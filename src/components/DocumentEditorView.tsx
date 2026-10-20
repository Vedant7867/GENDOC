import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import {
  AlertCircle, AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Bold, CheckCircle2, ChevronDown, Download,
  History, Italic, List, ListOrdered, Loader2, Minus, Plus, Redo2, Save, Send, Sparkles, Table2, Underline as UnderlineIcon, Undo2, X,
} from 'lucide-react';
import { ApiError, api } from '../api/client';
import type { ApiClub, ApiDocumentDetail, ApiVersionMeta, CopilotProposal } from '../api/types';
import type { User } from '../types';
import { editorExtensions } from '../editor/extensions';
import {
  RequestSnapshot, acceptAllAiDraft, applyProposal, exportHtml, hasAiDraft, snapshotBlocks, snapshotSelection,
  toCopilotBlocks, windowBlocks,
} from '../editor/blocks';
import './documentPage.css';

interface Props {
  /** The document to edit. Without an id there is nothing to load, so the editor shows an error. */
  documentId: string | null;
  initialTitle: string;
  currentUser: User;
  onBack: () => void;
  /** Called after a save/rename/status change so lists elsewhere can refresh. */
  onDocumentsChanged?: () => void;
}

type SaveState = 'saved' | 'unsaved' | 'saving' | 'draft' | 'error';
interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'error';
  text: string;
  proposals?: { p: CopilotProposal; status: 'pending' | 'accepted' | 'rejected' | 'stale'; snap: RequestSnapshot; note?: string }[];
}

const QUICK_ACTIONS = [
  'Improve this section',
  'Make it more formal',
  'Shorten this',
  'Fix grammar and spelling',
  'Draft a conclusion',
  'Suggest missing sections',
  'Check the document for inconsistencies',
];

const plainText = (html: string | undefined): string =>
  html ? (new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '').replace(/\s+/g, ' ').trim() : '';

export const DocumentEditorView: React.FC<Props> = ({ documentId, initialTitle, currentUser, onBack, onDocumentsChanged }) => {
  const [doc, setDoc] = useState<ApiDocumentDetail | null>(null);
  const [club, setClub] = useState<ApiClub | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(documentId ? 'loading' : 'error');
  const [loadError, setLoadError] = useState<string | null>(documentId ? null : 'No document was selected.');
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [aiPresent, setAiPresent] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [versions, setVersions] = useState<ApiVersionMeta[] | null>(null);
  const [showVersions, setShowVersions] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const [exporting, setExporting] = useState<null | 'pdf' | 'docx'>(null);
  const [selectionLen, setSelectionLen] = useState(0);
  const [copilotOpen, setCopilotOpen] = useState(true);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [instruction, setInstruction] = useState('');
  const [asking, setAsking] = useState(false);
  const msgId = useRef(0);

  // Refs hold the latest values for the autosave timer and the unload handler.
  const baseVersion = useRef(1);
  const changedSinceVersion = useRef(false);
  const changedSinceDraft = useRef(false);
  const busySaving = useRef(false);
  const editableRef = useRef(false);

  const canEditDoc = useMemo(() => {
    if (!doc) return false;
    if (doc.status !== 'Draft') return false;
    if (currentUser.role === 'Core Coordinator' || currentUser.role === 'Club Admin') return true;
    return currentUser.role === 'Club Member' && doc.ownerId === currentUser.id;
  }, [doc, currentUser]);
  const canReopen = !!doc && doc.status === 'Completed' && (currentUser.role === 'Core Coordinator' || currentUser.role === 'Club Admin');

  const editor = useEditor({
    extensions: editorExtensions(),
    content: '',
    editable: false,
    editorProps: { attributes: { 'aria-label': 'Document editor', spellcheck: 'true' } },
    onUpdate: ({ editor: ed }) => {
      changedSinceVersion.current = true;
      changedSinceDraft.current = true;
      setSaveState('unsaved');
      setAiPresent(hasAiDraft(ed));
    },
    onSelectionUpdate: ({ editor: ed }) => {
      const { from, to } = ed.state.selection;
      setSelectionLen(to - from);
    },
  });

  // ---------------------------------------------------------------- load
  const loadDocument = useCallback(async () => {
    if (!documentId || !editor) return;
    setLoadState('loading');
    try {
      const [d, c] = await Promise.all([api.documents.get(documentId), api.club.get().catch(() => null)]);
      setDoc(d);
      setClub(c);
      setTitle(d.title);
      baseVersion.current = d.currentVersion;
      editor.commands.setContent(d.content, false);
      changedSinceVersion.current = false;
      changedSinceDraft.current = false;
      setAiPresent(hasAiDraft(editor));
      setSaveState('saved');
      setConflict(false);
      setBanner(d.hasUnsavedDraft ? { kind: 'info', text: 'Restored your autosaved working copy. Save to keep it as a new version.' } : null);
      if (d.hasUnsavedDraft) { changedSinceVersion.current = true; setSaveState('draft'); }
      setLoadState('ready');
    } catch (e) {
      setLoadState('error');
      setLoadError(e instanceof Error ? e.message : 'The document could not be loaded.');
    }
  }, [documentId, editor]);

  useEffect(() => { void loadDocument(); }, [loadDocument]);

  useEffect(() => {
    const editable = canEditDoc && !conflict;
    editableRef.current = editable;
    editor?.setEditable(editable);
  }, [editor, canEditDoc, conflict]);

  // ---------------------------------------------------------------- saving
  const handleSaveError = useCallback((e: unknown) => {
    setSaveState('error');
    if (e instanceof ApiError && e.code === 'version_conflict') {
      setConflict(true);
      setBanner({ kind: 'error', text: 'Someone else saved a newer version of this document. Reload to see it (your unsaved changes here would be lost).' });
    } else if (e instanceof ApiError && e.code === 'document_locked') {
      setBanner({ kind: 'error', text: 'This document is Completed and read-only. Ask a coordinator to reopen it.' });
    } else {
      setBanner({ kind: 'error', text: e instanceof Error ? e.message : 'Saving failed. Your changes are still in the editor.' });
    }
  }, []);

  const autosave = useCallback(async () => {
    if (!documentId || !editor || !editableRef.current || busySaving.current || !changedSinceDraft.current) return;
    busySaving.current = true;
    try {
      await api.documents.saveDraft(documentId, exportHtml(editor), baseVersion.current);
      changedSinceDraft.current = false;
      setSaveState('draft');
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      handleSaveError(e);
    } finally {
      busySaving.current = false;
    }
  }, [documentId, editor, handleSaveError]);

  // Autosave about every 30 seconds while there are changes (contract section 7).
  useEffect(() => {
    const t = window.setInterval(() => void autosave(), 30_000);
    return () => window.clearInterval(t);
  }, [autosave]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!documentId || !editor || busySaving.current) return false;
    busySaving.current = true;
    setSaveState('saving');
    try {
      const d = await api.documents.saveContent(documentId, { content: exportHtml(editor), baseVersion: baseVersion.current });
      baseVersion.current = d.currentVersion;
      setDoc((cur) => (cur ? { ...cur, ...d } : d));
      changedSinceVersion.current = false;
      changedSinceDraft.current = false;
      setSaveState('saved');
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setBanner(null);
      setVersions(null);
      onDocumentsChanged?.();
      return true;
    } catch (e) {
      handleSaveError(e);
      return false;
    } finally {
      busySaving.current = false;
    }
  }, [documentId, editor, handleSaveError, onDocumentsChanged]);

  // Warn before the tab closes with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (changedSinceVersion.current && editableRef.current) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  const requestClose = () => {
    if (changedSinceVersion.current && editableRef.current) setShowLeave(true); else onBack();
  };

  const saveTitle = async () => {
    if (!doc || !documentId || title.trim() === doc.title || !title.trim() || !canEditDoc) { setTitle(doc?.title ?? title); return; }
    try {
      await api.documents.patch(documentId, { title: title.trim() });
      setDoc({ ...doc, title: title.trim() });
      onDocumentsChanged?.();
    } catch (e) {
      setBanner({ kind: 'error', text: e instanceof Error ? e.message : 'The title could not be changed.' });
      setTitle(doc.title);
    }
  };

  const reopen = async () => {
    if (!doc || !documentId) return;
    try {
      await api.documents.patch(documentId, { status: 'Draft' });
      onDocumentsChanged?.();
      await loadDocument();
    } catch (e) {
      setBanner({ kind: 'error', text: e instanceof Error ? e.message : 'Could not reopen the document.' });
    }
  };

  // ---------------------------------------------------------------- versions / export
  const openVersions = async () => {
    setShowVersions((v) => !v);
    if (!versions && documentId) {
      try { setVersions((await api.documents.versions(documentId)).items); } catch (e) {
        setBanner({ kind: 'error', text: e instanceof Error ? e.message : 'Version history could not be loaded.' });
      }
    }
  };

  const restore = async (n: number) => {
    if (!documentId) return;
    if (changedSinceVersion.current && !window.confirm('Restoring replaces what is in the editor. Continue?')) return;
    try {
      await api.documents.restore(documentId, n);
      setShowVersions(false); setVersions(null);
      onDocumentsChanged?.();
      await loadDocument();
    } catch (e) {
      handleSaveError(e);
    }
  };

  const exportAs = async (format: 'pdf' | 'docx') => {
    if (!documentId) return;
    setExporting(format); setBanner(null);
    try {
      await api.documents.download(documentId, format, title);
    } catch (e) {
      const text = e instanceof ApiError && e.code === 'unaccepted_ai_text'
        ? 'This document still has AI-drafted text. Review it and choose "Accept AI text", save, then export again.'
        : e instanceof ApiError && e.code === 'not_implemented' ? e.message
        : e instanceof Error ? e.message : 'The export failed.';
      setBanner({ kind: 'error', text });
    } finally {
      setExporting(null);
    }
  };

  // ---------------------------------------------------------------- Copilot
  const ask = async (text: string) => {
    if (!editor || !text.trim() || asking) return;
    const blocksAll = snapshotBlocks(editor);
    const selection = snapshotSelection(editor);
    const centre = selection?.blockId ?? Math.max(0, editor.state.selection.$from.index(0));
    const blocks = windowBlocks(blocksAll, centre);
    const snap: RequestSnapshot = { blocks, selection };
    setChat((c) => [...c, { id: ++msgId.current, role: 'user', text }]);
    setInstruction('');
    setAsking(true);
    try {
      const r = await api.generator.copilot({
        instruction: text,
        blocks: toCopilotBlocks(blocks),
        selection: selection ? { blockId: selection.blockId, text: selection.text } : undefined,
      });
      const notes = r.rejected.length ? ` (${r.rejected.length} suggestion${r.rejected.length > 1 ? 's were' : ' was'} discarded for safety: ${r.rejected[0].reason}.)` : '';
      setChat((c) => [...c, {
        id: ++msgId.current, role: 'assistant', text: (r.message || (r.proposals.length ? 'Here are my suggestions.' : 'I have no changes to suggest.')) + notes,
        proposals: r.proposals.map((p) => ({ p, status: 'pending' as const, snap })),
      }]);
    } catch (e) {
      const m = e instanceof ApiError && e.code === 'llm_unavailable'
        ? 'The AI assistant is not set up on this server yet. Everything else in the editor still works.'
        : e instanceof Error ? e.message : 'The assistant could not answer.';
      setChat((c) => [...c, { id: ++msgId.current, role: 'error', text: m }]);
    } finally {
      setAsking(false);
    }
  };

  const decide = (mid: number, pid: string, accept: boolean) => {
    if (!editor) return;
    setChat((all) => all.map((m) => {
      if (m.id !== mid || !m.proposals) return m;
      return {
        ...m,
        proposals: m.proposals.map((x) => {
          if (x.p.id !== pid || x.status !== 'pending') return x;
          if (!accept) return { ...x, status: 'rejected' as const };
          if (!editableRef.current) return { ...x, status: 'stale' as const, note: 'This document is read-only.' };
          const res = applyProposal(editor, x.p, x.snap);
          return res.ok ? { ...x, status: 'accepted' as const } : { ...x, status: 'stale' as const, note: res.reason };
        }),
      };
    }));
  };

  // ---------------------------------------------------------------- render
  const clubName = club?.name ?? '';
  const headerText = plainText(club?.headerHtml as string | undefined);
  const footerText = plainText(club?.footerHtml as string | undefined);
  const statusText =
    saveState === 'saving' ? 'Saving…'
    : saveState === 'error' ? 'Not saved'
    : saveState === 'unsaved' ? 'Unsaved changes'
    : saveState === 'draft' ? `Draft autosaved${savedAt ? ` at ${savedAt}` : ''} (not yet a version)`
    : `Saved${doc ? ` · version ${doc.currentVersion}` : ''}${savedAt ? ` at ${savedAt}` : ''}`;
  const exportBlockedReason = !documentId ? 'No document'
    : changedSinceVersion.current || saveState !== 'saved' ? 'Save first: exports use the latest saved version'
    : aiPresent ? 'Accept the AI-drafted text first' : '';

  const tb = (active: boolean) =>
    `p-1.5 rounded-md text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent ${active ? 'bg-blue-100 text-blue-700' : ''}`;
  const ed = editor;
  const can = !!ed && editableRef.current;

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow p-6 max-w-md text-center space-y-3">
          <AlertCircle className="mx-auto text-red-500" />
          <p className="text-sm text-slate-700">{loadError}</p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={onBack} className="px-4 py-2 text-xs font-semibold text-slate-600">Back</button>
            {documentId && <button type="button" onClick={() => void loadDocument()} className="px-4 py-2 bg-[#1D63DC] text-white text-xs font-semibold rounded-xl">Try again</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800">
      {/* top bar */}
      <header className="bg-[#0B132B] text-white px-4 h-14 flex items-center gap-3 shrink-0">
        <button type="button" onClick={requestClose} aria-label="Back to documents" className="p-1.5 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></button>
        <input aria-label="Document title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => void saveTitle()}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          disabled={!canEditDoc} maxLength={200}
          className="bg-transparent text-[14px] font-semibold min-w-0 flex-1 max-w-xl px-2 py-1 rounded focus:bg-white/10 focus:outline-none disabled:opacity-90" />
        {doc && <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10">{doc.status}</span>}
        <span role="status" className={`text-[11.5px] hidden md:inline ${saveState === 'error' ? 'text-red-300' : 'text-slate-300'}`}>{statusText}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button type="button" onClick={() => void openVersions()} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 flex items-center gap-1.5"><History size={14} /> Versions</button>
            {showVersions && (
              <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 z-40 p-1 max-h-72 overflow-y-auto">
                {!versions && <div className="p-3 text-xs text-slate-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Loading…</div>}
                {versions?.map((v) => (
                  <div key={v.version} className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg hover:bg-slate-50">
                    <div><div className="font-semibold">Version {v.version}{v.version === doc?.currentVersion ? ' (current)' : ''}</div>
                      <div className="text-slate-500">{v.source}{v.note ? ` · ${v.note}` : ''}</div></div>
                    {v.version !== doc?.currentVersion && canEditDoc && <button type="button" onClick={() => void restore(v.version)} className="text-blue-700 font-semibold">Restore</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {(['pdf', 'docx'] as const).map((f) => (
            <button key={f} type="button" onClick={() => void exportAs(f)} disabled={!!exportBlockedReason || exporting !== null}
              title={exportBlockedReason || `Download ${f.toUpperCase()}`}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 disabled:opacity-40 flex items-center gap-1.5">
              {exporting === f ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} {f.toUpperCase()}
            </button>
          ))}
          <button type="button" onClick={() => void save()} disabled={!can || saveState === 'saving' || !changedSinceVersion.current}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1D63DC] hover:bg-blue-600 disabled:opacity-40 flex items-center gap-1.5">
            {saveState === 'saving' ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
          </button>
          <button type="button" onClick={() => setCopilotOpen((o) => !o)} aria-pressed={copilotOpen} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-white/10 flex items-center gap-1.5"><Sparkles size={14} /> Copilot</button>
        </div>
      </header>

      {/* banners */}
      {banner && (
        <div role="alert" className={`px-4 py-2 text-xs flex items-center gap-2 shrink-0 ${banner.kind === 'error' ? 'bg-red-50 text-red-800 border-b border-red-200' : 'bg-blue-50 text-blue-800 border-b border-blue-200'}`}>
          <AlertCircle size={14} /> <span className="flex-1">{banner.text}</span>
          {conflict && <button type="button" onClick={() => void loadDocument()} className="font-semibold underline">Reload</button>}
          <button type="button" onClick={() => setBanner(null)} aria-label="Dismiss"><X size={14} /></button>
        </div>
      )}
      {doc && !canEditDoc && (
        <div className="px-4 py-2 text-xs bg-amber-50 text-amber-900 border-b border-amber-200 flex items-center gap-3 shrink-0">
          <span className="flex-1">
            {doc.status === 'Completed' ? 'This document is Completed and read-only.'
              : doc.status === 'Needs Review' ? 'This document is waiting for review and cannot be edited.'
              : 'You can view this document but not edit it.'}
          </span>
          {canReopen && <button type="button" onClick={() => void reopen()} className="font-semibold underline">Reopen as Draft</button>}
        </div>
      )}
      {aiPresent && (
        <div className="px-4 py-2 text-xs bg-yellow-50 text-yellow-900 border-b border-yellow-200 flex items-center gap-3 shrink-0">
          <Sparkles size={14} />
          <span className="flex-1">Highlighted passages were written by AI. Read them, correct anything that is wrong, then accept them. Export stays blocked until you do.</span>
          <button type="button" disabled={!can} onClick={() => ed && acceptAllAiDraft(ed)} className="px-3 py-1 rounded-lg bg-yellow-600 text-white font-semibold disabled:opacity-40 flex items-center gap-1"><CheckCircle2 size={13} /> Accept AI text</button>
        </div>
      )}

      {/* toolbar */}
      <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center gap-0.5 flex-wrap shrink-0" role="toolbar" aria-label="Formatting">
        <button type="button" className={tb(false)} disabled={!can} onClick={() => ed?.chain().focus().undo().run()} aria-label="Undo"><Undo2 size={16} /></button>
        <button type="button" className={tb(false)} disabled={!can} onClick={() => ed?.chain().focus().redo().run()} aria-label="Redo"><Redo2 size={16} /></button>
        <span className="w-px h-5 bg-slate-200 mx-1.5" />
        <select aria-label="Text style" disabled={!can} value={ed?.isActive('heading', { level: 1 }) ? 'h1' : ed?.isActive('heading', { level: 2 }) ? 'h2' : ed?.isActive('heading', { level: 3 }) ? 'h3' : 'p'}
          onChange={(e) => { const v = e.target.value; const c = ed?.chain().focus(); if (!c) return; v === 'p' ? c.setParagraph().run() : c.toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 }).run(); }}
          className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white">
          <option value="p">Normal</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option>
        </select>
        <span className="w-px h-5 bg-slate-200 mx-1.5" />
        <button type="button" className={tb(!!ed?.isActive('bold'))} disabled={!can} onClick={() => ed?.chain().focus().toggleBold().run()} aria-label="Bold"><Bold size={16} /></button>
        <button type="button" className={tb(!!ed?.isActive('italic'))} disabled={!can} onClick={() => ed?.chain().focus().toggleItalic().run()} aria-label="Italic"><Italic size={16} /></button>
        <button type="button" className={tb(!!ed?.isActive('underline'))} disabled={!can} onClick={() => ed?.chain().focus().toggleUnderline().run()} aria-label="Underline"><UnderlineIcon size={16} /></button>
        <span className="w-px h-5 bg-slate-200 mx-1.5" />
        {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight], ['justify', AlignJustify]] as const).map(([a, Icon]) => (
          <button key={a} type="button" className={tb(!!ed?.isActive({ textAlign: a }))} disabled={!can} onClick={() => ed?.chain().focus().setTextAlign(a).run()} aria-label={`Align ${a}`}><Icon size={16} /></button>
        ))}
        <span className="w-px h-5 bg-slate-200 mx-1.5" />
        <button type="button" className={tb(!!ed?.isActive('bulletList'))} disabled={!can} onClick={() => ed?.chain().focus().toggleBulletList().run()} aria-label="Bulleted list"><List size={16} /></button>
        <button type="button" className={tb(!!ed?.isActive('orderedList'))} disabled={!can} onClick={() => ed?.chain().focus().toggleOrderedList().run()} aria-label="Numbered list"><ListOrdered size={16} /></button>
        <button type="button" className={tb(false)} disabled={!can} onClick={() => ed?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} aria-label="Insert table"><Table2 size={16} /></button>
        {ed?.isActive('table') && can && (
          <span className="flex items-center gap-1 ml-1 text-[11px]">
            {[['+ Row', () => ed.chain().focus().addRowAfter().run()], ['− Row', () => ed.chain().focus().deleteRow().run()],
              ['+ Col', () => ed.chain().focus().addColumnAfter().run()], ['− Col', () => ed.chain().focus().deleteColumn().run()],
              ['Delete table', () => ed.chain().focus().deleteTable().run()]].map(([label, fn]) => (
              <button key={label as string} type="button" onClick={fn as () => void} className="px-1.5 py-1 rounded border border-slate-200 hover:bg-slate-50">{label as string}</button>
            ))}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs text-slate-600">
          <button type="button" onClick={() => setZoom((z) => Math.max(50, z - 10))} className={tb(false)} aria-label="Zoom out"><Minus size={14} /></button>
          <span className="w-10 text-center">{zoom}%</span>
          <button type="button" onClick={() => setZoom((z) => Math.min(160, z + 10))} className={tb(false)} aria-label="Zoom in"><Plus size={14} /></button>
        </span>
      </div>

      <div className="flex-1 min-h-0 flex">
        {/* A4 page */}
        <main className="flex-1 overflow-auto p-6">
          {loadState === 'loading' ? (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-20"><Loader2 className="animate-spin" size={18} /> Loading document…</div>
          ) : (
            <div className="mx-auto bg-white shadow-md border border-slate-200 gd-page"
              style={{ width: `${(794 * zoom) / 100}px`, minHeight: `${(1123 * zoom) / 100}px`, padding: `${(56 * zoom) / 100}px`, ['--gd-font' as string]: `${(13 * zoom) / 100}px` }}>
              {(clubName || headerText) && (
                <div className="text-center text-slate-500 border-b border-slate-200 pb-2 mb-3" style={{ fontSize: `${(10 * zoom) / 100}px` }}>
                  <strong className="text-slate-700">{clubName}</strong>{headerText ? ` · ${headerText}` : ''}
                </div>
              )}
              <EditorContent editor={editor} />
              {footerText && (
                <div className="text-center text-slate-400 border-t border-slate-200 pt-2 mt-6" style={{ fontSize: `${(9 * zoom) / 100}px` }}>{footerText}</div>
              )}
              <p className="mt-6 text-[10px] text-slate-300 text-center select-none">Branding shown here is applied from the club record when you export.</p>
            </div>
          )}
        </main>

        {/* Copilot */}
        {copilotOpen && (
          <aside className="w-[340px] shrink-0 bg-white border-l border-slate-200 flex flex-col" aria-label="Copilot">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2"><Sparkles size={16} className="text-blue-600" /><h2 className="text-sm font-bold">Copilot</h2>
              <span className="ml-auto text-[10.5px] text-slate-400">Suggestions only: nothing changes until you accept</span></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3" aria-live="polite">
              {chat.length === 0 && (
                <p className="text-xs text-slate-500">Select some text, or just ask. Copilot can reword, shorten, fix grammar, add a missing section or check the document. It never changes names, dates, venues or amounts you filled in.</p>
              )}
              {chat.map((m) => (
                <div key={m.id} className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`inline-block max-w-full text-left text-[12.5px] rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-blue-600 text-white' : m.role === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>
                  {m.proposals?.map(({ p, status, note }) => (
                    <div key={p.id} className="mt-2 border border-slate-200 rounded-xl overflow-hidden text-left">
                      <div className="px-3 py-1.5 bg-slate-50 text-[11px] font-semibold text-slate-600">
                        {p.action === 'insert_after' ? 'Add after this paragraph' : p.action === 'replace_selection' ? 'Replace selected text' : 'Replace paragraph'}{p.reason ? ` · ${p.reason}` : ''}
                      </div>
                      {p.action !== 'insert_after' && <div className="px-3 py-1.5 text-[11.5px] text-slate-500 line-through decoration-red-300 max-h-20 overflow-y-auto">{p.originalText}</div>}
                      <div className="px-3 py-1.5 text-[12px] text-slate-800 bg-emerald-50/50 max-h-32 overflow-y-auto gd-page" style={{ ['--gd-font' as string]: '12px' }} dangerouslySetInnerHTML={{ __html: p.html }} />
                      <div className="px-3 py-2 flex items-center gap-2 border-t border-slate-100">
                        {status === 'pending' ? (<>
                          <button type="button" onClick={() => decide(m.id, p.id, true)} className="px-2.5 py-1 rounded-lg bg-[#1D63DC] text-white text-[11.5px] font-semibold">Accept</button>
                          <button type="button" onClick={() => decide(m.id, p.id, false)} className="px-2.5 py-1 rounded-lg text-[11.5px] font-semibold text-slate-600 hover:bg-slate-100">Reject</button>
                        </>) : (
                          <span className={`text-[11.5px] font-semibold ${status === 'accepted' ? 'text-emerald-700' : status === 'stale' ? 'text-amber-700' : 'text-slate-400'}`}>
                            {status === 'accepted' ? 'Applied (you can undo with Ctrl+Z)' : status === 'rejected' ? 'Dismissed' : note ?? 'No longer applicable'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {asking && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" /> Thinking…</div>}
            </div>
            <div className="border-t border-slate-100 p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((q) => (
                  <button key={q} type="button" disabled={asking || loadState !== 'ready'} onClick={() => void ask(q)}
                    className="px-2 py-1 rounded-full border border-slate-200 text-[11px] text-slate-600 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50">{q}</button>
                ))}
              </div>
              {selectionLen > 0 && <p className="text-[11px] text-blue-700">Using your selected text ({selectionLen} characters)</p>}
              <form onSubmit={(e) => { e.preventDefault(); void ask(instruction); }} className="flex gap-2">
                <input value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder="Ask Copilot…" aria-label="Ask Copilot" maxLength={1000}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                <button type="submit" disabled={asking || !instruction.trim()} aria-label="Send" className="p-2 rounded-xl bg-[#1D63DC] text-white disabled:opacity-40"><Send size={14} /></button>
              </form>
            </div>
          </aside>
        )}
      </div>

      {/* leave dialog */}
      {showLeave && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-3 shadow-2xl">
            <h3 className="font-bold text-slate-900">Save your changes?</h3>
            <p className="text-sm text-slate-600">You have changes that are not saved as a version yet.</p>
            <div className="flex flex-col gap-2">
              <button type="button" onClick={async () => { if (await save()) { setShowLeave(false); onBack(); } else setShowLeave(false); }} className="px-4 py-2 bg-[#1D63DC] text-white text-sm font-semibold rounded-xl">Save and leave</button>
              <button type="button" onClick={async () => { await autosave(); setShowLeave(false); onBack(); }} className="px-4 py-2 border border-slate-200 text-sm font-semibold rounded-xl">Leave (keep as working copy)</button>
              <button type="button" onClick={() => setShowLeave(false)} className="px-4 py-2 text-sm text-slate-600">Keep editing</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
