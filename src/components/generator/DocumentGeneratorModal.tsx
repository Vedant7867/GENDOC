import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Sparkles, X } from 'lucide-react';
import { ApiError, api } from '../../api/client';
import type { ApiDocumentDetail, ApiTemplate, ApiTemplateField, InlineTemplateSpec } from '../../api/types';
import type { User } from '../../types';
import { FieldInput } from './FieldInput';
import { Values, groupFields, initialValues, isEmptyValue, mergeFields, missingRequired, suggestTemplates } from './fieldUtils';

export type GeneratorMode = 'describe' | 'form' | 'template';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: GeneratorMode;
  /** The text typed in the "Describe your event" card. */
  initialText?: string;
  initialTemplateId?: string | null;
  currentUser: User;
  /** Called after documents were really saved (POST /documents succeeded). */
  onCreated: (docs: ApiDocumentDetail[]) => void;
  onOpenDocument: (doc: ApiDocumentDetail) => void;
}

type Step = 'pick' | 'details' | 'done';
const aiEligible = (f: ApiTemplateField) => !f.official && (f.type === 'text' || f.type === 'textarea' || f.type === 'list');

export const DocumentGeneratorModal: React.FC<Props> = ({ isOpen, onClose, mode, initialText = '', initialTemplateId, currentUser, onCreated, onOpenDocument }) => {
  const [step, setStep] = useState<Step>('pick');
  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [listState, setListState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [text, setText] = useState(initialText);
  const [selected, setSelected] = useState<string[]>([]);
  const [useFreeform, setUseFreeform] = useState(false);
  const [details, setDetails] = useState<ApiTemplate[]>([]);
  const [inline, setInline] = useState<InlineTemplateSpec | null>(null);
  const [values, setValues] = useState<Values>({});
  const [extracted, setExtracted] = useState<Set<string>>(new Set());
  const [drafted, setDrafted] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<null | 'details' | 'extract' | 'draft' | 'generate'>(null);
  const [draftingKey, setDraftingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiProblem, setAiProblem] = useState<string | null>(null);
  const [showMissing, setShowMissing] = useState(false);
  const [serverMissing, setServerMissing] = useState<string[]>([]);
  const [created, setCreated] = useState<Record<string, ApiDocumentDetail>>({});
  const [needsSave, setNeedsSave] = useState(false);

  const canCreate = currentUser.role !== 'Faculty Advisor';
  const isAdmin = currentUser.role === 'Club Admin';

  const fields: ApiTemplateField[] = useMemo(
    () => (inline ? inline.fields : mergeFields(details)),
    [details, inline],
  );
  const missing = useMemo(() => missingRequired(fields, values), [fields, values]);
  const invalidKeys = useMemo(() => new Set([...(showMissing ? missing.map((f) => f.key) : []), ...serverMissing]), [showMissing, missing, serverMissing]);

  // Fresh state every time the dialog opens; templates always come from the API.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setStep('pick'); setText(initialText); setSelected([]); setUseFreeform(false); setDetails([]); setInline(null);
    setValues({}); setExtracted(new Set()); setDrafted(new Set()); setBusy(null); setError(null); setAiProblem(null);
    setShowMissing(false); setServerMissing([]); setCreated({}); setNeedsSave(false); setListState('loading');
    api.templates.list().then((items) => {
      if (cancelled) return;
      setTemplates(items);
      setListState('ready');
      if (mode === 'describe') setSelected(suggestTemplates(initialText, items));
      if (mode === 'template' && initialTemplateId) void enterDetails([initialTemplateId], {}, new Set(), cancelled);
    }).catch((e) => { if (!cancelled) { setListState('error'); setError(msg(e)); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const msg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.');

  async function enterDetails(ids: string[], fromServer: Values, foundKeys: Set<string>, cancelled = false) {
    setBusy('details'); setError(null);
    try {
      const [full, club] = await Promise.all([Promise.all(ids.map((id) => api.templates.get(id))), api.club.get().catch(() => null)]);
      if (cancelled) return;
      const merged = mergeFields(full);
      setDetails(full); setInline(null);
      setValues({ ...initialValues(merged, club), ...fromServer });
      setExtracted(foundKeys);
      setStep('details');
    } catch (e) {
      setError(msg(e));
    } finally {
      setBusy(null);
    }
  }

  const toggle = (id: string) =>
    setSelected((cur) => (mode === 'form' ? [id] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function handleExtract() {
    if (!text.trim()) { setError('Describe the event first.'); return; }
    setBusy('extract'); setError(null); setAiProblem(null);
    try {
      if (useFreeform) {
        const r = await api.generator.freeform(text.trim());
        setInline(r.template); setDetails([]);
        setValues(r.values); setExtracted(new Set(r.extractedKeys));
        setStep('details');
      } else {
        if (selected.length === 0) { setError('Choose at least one template.'); return; }
        const r = await api.generator.extract({ templateIds: selected, text: text.trim() });
        await enterDetails(selected, r.values, new Set(r.extractedKeys));
      }
    } catch (e) {
      if (e instanceof ApiError && ['llm_unavailable', 'llm_rate_limited', 'llm_model_unavailable', 'llm_error'].includes(e.code)) setAiProblem(e.message);
      else setError(msg(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleDraft(f: ApiTemplateField) {
    if (details.length === 0) return; // drafting needs a stored template
    setDraftingKey(f.key); setError(null);
    try {
      const r = await api.generator.draft({ templateId: details[0].id, values, keys: [f.key] });
      if (r.drafts[f.key] !== undefined) {
        setValues((v) => ({ ...v, [f.key]: r.drafts[f.key] }));
        setDrafted((d) => new Set(d).add(f.key));
      } else {
        setError(r.rejected[f.key] ? `No draft was added: ${r.rejected[f.key]}.` : 'No draft was produced.');
      }
    } catch (e) {
      if (e instanceof ApiError && e.code.startsWith('llm_')) setAiProblem(e.message); else setError(msg(e));
    } finally {
      setDraftingKey(null);
    }
  }

  async function handleGenerate() {
    setShowMissing(true); setServerMissing([]); setError(null);
    if (missing.length > 0) return;
    setBusy('generate');
    const aiKeys = [...drafted].filter((k) => !isEmptyValue(values[k]));
    const done = { ...created };
    try {
      if (inline) {
        const r = await api.generator.generate({ template: inline, values, aiKeys });
        if (r.requiresTemplateSave) { setNeedsSave(true); return; }
      }
      for (const t of details) {
        if (done[t.id]) continue; // already saved on an earlier attempt: never create duplicates
        const gen = await api.generator.generate({ templateId: t.id, values, aiKeys });
        // Only the `document` part goes to POST /documents; the rest of the response is for the UI.
        done[t.id] = await api.documents.create(gen.document);
        setCreated({ ...done });
      }
      onCreated(Object.values(done));
      setStep('done');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'missing_required_fields') { setServerMissing(e.fields ?? []); setError('Some required details are still missing.'); }
      else setError(msg(e));
    } finally {
      setBusy(null);
    }
  }

  async function saveInlineAsTemplate() {
    if (!inline) return;
    setBusy('generate'); setError(null);
    try {
      const t = await api.templates.create(inline);
      const full = await api.templates.get(t.id);
      setDetails([full]); setInline(null); setNeedsSave(false);
      setBusy(null);
      setError(null);
      // The form now belongs to a stored template: generating again saves the document for real.
      setTimeout(() => void handleGenerateWith([full]), 0);
    } catch (e) {
      setError(msg(e)); setBusy(null);
    }
  }

  async function handleGenerateWith(list: ApiTemplate[]) {
    setBusy('generate');
    try {
      const aiKeys = [...drafted].filter((k) => !isEmptyValue(values[k]));
      const out: Record<string, ApiDocumentDetail> = {};
      for (const t of list) {
        const gen = await api.generator.generate({ templateId: t.id, values, aiKeys });
        out[t.id] = await api.documents.create(gen.document);
      }
      setCreated(out); onCreated(Object.values(out)); setStep('done');
    } catch (e) { setError(msg(e)); } finally { setBusy(null); }
  }

  const close = useCallback(() => { if (busy !== 'generate') onClose(); }, [busy, onClose]);
  if (!isOpen) return null;

  const title = mode === 'describe' ? 'Describe your event' : mode === 'form' ? 'Fill a form' : 'Create a document';
  const grouped = groupFields(fields);
  const docs = Object.values(created);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center"><Sparkles size={18} /></div>
            <div>
              <h3 className="font-bold text-base leading-tight">{title}</h3>
              <p className="text-xs text-slate-300">
                {step === 'pick' ? 'Step 1 of 2: choose what to create' : step === 'details' ? 'Step 2 of 2: check the details' : 'Saved'}
              </p>
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="p-1 rounded-lg text-slate-300 hover:text-white"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {!canCreate && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> Faculty Advisors can review and approve documents but cannot create them.
            </div>
          )}
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
          {aiProblem && (
            <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <div className="flex gap-2"><AlertCircle size={15} className="shrink-0 mt-0.5" /> <span>{aiProblem}</span></div>
              <p>You can still create the document by filling in the details yourself.</p>
              {step === 'pick' && selected.length > 0 && !useFreeform && (
                <button type="button" onClick={() => void enterDetails(selected, {}, new Set())} className="font-semibold underline">Fill the form manually</button>
              )}
            </div>
          )}

          {listState === 'loading' && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading templates…</div>}

          {/* STEP 1 */}
          {step === 'pick' && listState === 'ready' && (
            <>
              {mode === 'describe' && (
                <div>
                  <label htmlFor="gen-text" className="block text-[12px] font-semibold text-slate-700 mb-1">Tell us about the event</label>
                  <textarea id="gen-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={4000}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Two-day Web Development Workshop on 14–15 October in Seminar Hall for around 120 students." />
                  <p className="text-[11px] text-slate-400 mt-1">Only what you write here is sent to the AI. Names, amounts and other official details are used only if you wrote them.</p>
                </div>
              )}
              {!useFreeform && (
                <div>
                  <p className="text-[12px] font-semibold text-slate-700 mb-2">
                    {mode === 'describe' ? 'Documents to create (suggested from your text, change if needed)' : 'Choose a template'}
                  </p>
                  {templates.length === 0 ? (
                    <p className="text-sm text-slate-500">No templates exist yet. A Club Admin can add templates on the Templates page.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                      {templates.map((t) => {
                        const on = selected.includes(t.id);
                        return (
                          <button key={t.id} type="button" onClick={() => toggle(t.id)} aria-pressed={on}
                            className={`text-left p-3 rounded-xl border text-[12.5px] transition-colors ${on ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5"><FileText size={13} /> {t.title}</div>
                            <div className="text-slate-500 text-[11.5px] line-clamp-2 mt-0.5">{t.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {mode === 'describe' && (
                <label className="flex items-start gap-2 text-[12px] text-slate-600">
                  <input type="checkbox" checked={useFreeform} onChange={(e) => setUseFreeform(e.target.checked)} className="mt-0.5" />
                  <span>None of these fit: let the AI design a new form from my description. (It is shown for review and is not saved automatically.)</span>
                </label>
              )}
            </>
          )}

          {/* STEP 2 */}
          {step === 'details' && (
            <>
              <div className="text-[12px] text-slate-600">
                Creating: <strong>{inline ? inline.title : details.map((d) => d.title).join(' + ')}</strong>
                {extracted.size > 0 && <span> · {extracted.size} detail{extracted.size === 1 ? '' : 's'} found in your text. Check them before you continue.</span>}
              </div>
              {missing.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <strong>{missing.length} required detail{missing.length === 1 ? '' : 's'} still needed:</strong>{' '}
                  {missing.map((f) => f.label).join(', ')}. These are never guessed by the AI.
                </div>
              )}
              {needsSave && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-2">
                  <p>This form was designed by the AI, so it has to be saved as a template before a document can be created from it.</p>
                  {isAdmin ? (
                    <button type="button" onClick={() => void saveInlineAsTemplate()} disabled={busy !== null}
                      className="px-3 py-1.5 bg-[#1D63DC] text-white font-semibold rounded-lg disabled:opacity-60">Save as template and create the document</button>
                  ) : (
                    <p>Only a Club Admin can save templates. Ask an admin to save this form, or pick an existing template instead.</p>
                  )}
                </div>
              )}
              {grouped.map(([group, list]) => (
                <fieldset key={group} className="space-y-3">
                  <legend className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">{group}</legend>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {list.map((f) => (
                      <div key={f.key} className={f.type === 'textarea' || f.type === 'table' || f.type === 'list' ? 'sm:col-span-2' : ''}>
                        <FieldInput field={f} value={values[f.key]} invalid={invalidKeys.has(f.key)}
                          badge={drafted.has(f.key) ? 'ai-draft' : extracted.has(f.key) ? 'ai-extracted' : null}
                          onChange={(v) => setValues((cur) => ({ ...cur, [f.key]: v }))}
                          disabled={busy === 'generate' || !canCreate}
                          onDraft={aiEligible(f) && details.length > 0 && canCreate ? () => void handleDraft(f) : undefined}
                          drafting={draftingKey === f.key} />
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}
            </>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-2">
                <CheckCircle2 size={18} className="shrink-0" /> Saved. {docs.length === 1 ? 'The document is' : `${docs.length} documents are`} now in your Documents archive.
              </div>
              {docs.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
                  <div className="min-w-0">
                    <div className="font-semibold text-[13px] text-slate-900 truncate">{d.title}</div>
                    <div className="text-[11.5px] text-slate-500">{d.templateType} · {d.status}{d.hasUnacceptedAiText ? ' · has AI-drafted text to review' : ''}</div>
                  </div>
                  <button type="button" onClick={() => onOpenDocument(d)} className="px-3 py-1.5 bg-[#1D63DC] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0">Open in editor</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <div>
            {step === 'details' && mode !== 'template' && (
              <button type="button" onClick={() => { setStep('pick'); setNeedsSave(false); }} disabled={busy !== null}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"><ArrowLeft size={13} /> Back</button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={close} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900">{step === 'done' ? 'Close' : 'Cancel'}</button>
            {step === 'pick' && mode === 'describe' && (
              <button type="button" onClick={() => void handleExtract()} disabled={busy !== null || !canCreate || listState !== 'ready'}
                className="px-4 py-2 bg-[#1D63DC] hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
                {busy === 'extract' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Extract details with AI
              </button>
            )}
            {step === 'pick' && mode !== 'describe' && (
              <button type="button" onClick={() => void enterDetails(selected, {}, new Set())} disabled={busy !== null || selected.length === 0 || !canCreate}
                className="px-4 py-2 bg-[#1D63DC] hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
                {busy === 'details' && <Loader2 size={13} className="animate-spin" />} Continue
              </button>
            )}
            {step === 'details' && !needsSave && (
              <button type="button" onClick={() => void handleGenerate()} disabled={busy !== null || !canCreate}
                className="px-4 py-2 bg-[#1D63DC] hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5">
                {busy === 'generate' && <Loader2 size={13} className="animate-spin" />} Generate document{details.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
