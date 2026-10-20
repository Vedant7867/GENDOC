import React from 'react';
import { Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import type { ApiTemplateField } from '../../api/types';

interface Props {
  field: ApiTemplateField;
  value: unknown;
  onChange: (v: unknown) => void;
  invalid?: boolean;
  badge?: 'ai-extracted' | 'ai-draft' | null;
  disabled?: boolean;
  /** Offered only for non-official text fields: asks the server (AI) for a draft the user can review. */
  onDraft?: () => void;
  drafting?: boolean;
}

const base = 'w-full border rounded-xl px-3 py-2 text-[12.5px] text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-50';

export const FieldInput: React.FC<Props> = ({ field, value, onChange, invalid, badge, disabled, onDraft, drafting }) => {
  const border = invalid ? 'border-red-400 bg-red-50/40' : 'border-slate-200';
  const id = `f-${field.key}`;
  let input: React.ReactNode;

  if (field.type === 'textarea') {
    input = <textarea id={id} rows={3} disabled={disabled} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder} className={`${base} ${border} resize-y`} />;
  } else if (field.type === 'select') {
    input = (
      <select id={id} disabled={disabled} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={`${base} ${border}`}>
        <option value="">Select…</option>
        {(field.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  } else if (field.type === 'list') {
    const text = Array.isArray(value) ? (value as string[]).join('\n') : String(value ?? '');
    input = <textarea id={id} rows={3} disabled={disabled} value={text} onChange={(e) => onChange(e.target.value.split('\n'))}
      placeholder="One item per line" className={`${base} ${border} resize-y`} />;
  } else if (field.type === 'table') {
    const cols = field.columns ?? [];
    const rows = (Array.isArray(value) ? value : []) as Record<string, string>[];
    const setCell = (i: number, key: string, v: string) => onChange(rows.map((r, j) => (j === i ? { ...r, [key]: v } : r)));
    input = (
      <div className={`rounded-xl border ${border} overflow-hidden`}>
        <table className="w-full text-[12px]">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {field.autoNumber && <th className="px-2 py-1.5 w-8 text-left">#</th>}
              {cols.map((c) => <th key={c.key} className="px-2 py-1.5 text-left font-semibold">{c.label}</th>)}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {field.autoNumber && <td className="px-2 text-slate-400">{i + 1}</td>}
                {cols.map((c) => (
                  <td key={c.key} className="p-1">
                    <input disabled={disabled} value={r[c.key] ?? ''} onChange={(e) => setCell(i, c.key, e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500" />
                  </td>
                ))}
                <td className="px-1">
                  <button type="button" disabled={disabled} onClick={() => onChange(rows.filter((_, j) => j !== i))}
                    className="p-1 text-slate-400 hover:text-red-600" aria-label="Remove row"><Trash2 size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" disabled={disabled} onClick={() => onChange([...rows, Object.fromEntries(cols.map((c) => [c.key, '']))])}
          className="w-full py-1.5 text-[12px] font-semibold text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1">
          <Plus size={13} /> Add row
        </button>
      </div>
    );
  } else {
    input = <input id={id} disabled={disabled} type={field.type === 'date' ? 'text' : 'text'} value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? (field.type === 'date' ? 'e.g. 14 October 2026' : undefined)}
      className={`${base} ${border}`} />;
  }

  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700 mb-1">
        <span>{field.label}</span>
        {field.required && <span className="text-red-500" title="Required">*</span>}
        {field.official && (
          <span title="Official detail: it must come from you or the club record, never from the AI"
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
            <ShieldCheck size={10} /> Official
          </span>
        )}
        {badge === 'ai-extracted' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 rounded px-1.5 py-0.5">
            <Sparkles size={10} /> Found in your text, please check
          </span>
        )}
        {badge === 'ai-draft' && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 bg-amber-50 rounded px-1.5 py-0.5">
            <Sparkles size={10} /> AI draft: review it in the editor
          </span>
        )}
        {onDraft && (
          <button type="button" onClick={onDraft} disabled={drafting || disabled}
            className="ml-auto text-[11px] font-semibold text-blue-700 hover:underline disabled:opacity-50">
            {drafting ? 'Drafting…' : 'Draft with AI'}
          </button>
        )}
      </label>
      {input}
      {invalid && <p className="text-[11px] text-red-600 mt-1">This is required.</p>}
      {field.helpText && !invalid && <p className="text-[11px] text-slate-400 mt-1">{field.helpText}</p>}
    </div>
  );
};
