import type { ApiClub, ApiTemplate, ApiTemplateField, MissingField } from '../../api/types';

export type Values = Record<string, unknown>;

export const isEmptyValue = (v: unknown): boolean =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) ||
  (Array.isArray(v) && v.every((r) => (typeof r === 'object' && r ? Object.values(r as object).every((x) => !String(x ?? '').trim()) : !String(r).trim()))) ||
  (typeof v === 'string' && !v.trim());

/** Union of the fields of several templates; the same key means the same thing everywhere. */
export function mergeFields(templates: ApiTemplate[]): ApiTemplateField[] {
  const byKey = new Map<string, ApiTemplateField>();
  for (const t of templates) {
    for (const f of t.fields ?? []) {
      const seen = byKey.get(f.key);
      byKey.set(f.key, seen ? { ...seen, required: seen.required || f.required } : f);
    }
  }
  return [...byKey.values()];
}

/** Template defaults plus the club-record hints (`club.name`, `signatory:<Title>`), as the server applies them. */
export function initialValues(fields: ApiTemplateField[], club: ApiClub | null): Values {
  const out: Values = {};
  const signatories = (club?.signatories as { name?: string; title?: string }[] | undefined) ?? [];
  for (const f of fields) {
    if (f.defaultValue) out[f.key] = f.defaultValue;
    if (f.prefill === 'club.name' && club?.name) out[f.key] = club.name;
    if (f.prefill?.startsWith('signatory:')) {
      const title = f.prefill.slice(10).trim().toLowerCase();
      const hit = signatories.find((s) => (s.title ?? '').toLowerCase() === title);
      if (hit?.name) out[f.key] = hit.name;
    }
  }
  return out;
}

export const missingRequired = (fields: ApiTemplateField[], values: Values): ApiTemplateField[] =>
  fields.filter((f) => f.required && isEmptyValue(values[f.key]));

export const toMissingField = (f: ApiTemplateField): MissingField => ({
  key: f.key, label: f.label, type: f.type, official: f.official, group: f.group, options: f.options,
  columns: f.columns, helpText: f.helpText, placeholder: f.placeholder, example: f.example,
});

/** Cheap, explainable template suggestion for a free-text description (shown as a suggestion only). */
export function suggestTemplates(text: string, templates: { id: string; title: string; category: string; description: string }[]): string[] {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const score = (t: { title: string; category: string; description: string }) =>
    `${t.title} ${t.category} ${t.description}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => words.has(w)).length;
  const asked = templates.filter((t) => text.toLowerCase().includes(t.title.toLowerCase()));
  if (asked.length) return asked.map((t) => t.id);
  const best = [...templates].sort((a, b) => score(b) - score(a))[0];
  return best && score(best) > 0 ? [best.id] : [];
}

export function groupFields(fields: ApiTemplateField[]): [string, ApiTemplateField[]][] {
  const groups = new Map<string, ApiTemplateField[]>();
  for (const f of fields) {
    const g = f.group || 'Details';
    groups.set(g, [...(groups.get(g) ?? []), f]);
  }
  return [...groups.entries()];
}
