// @vitest-environment jsdom
/**
 * End-to-end check of the REAL frontend code against a REAL running API (no mocks of our own code):
 *   python -m backend/scripts.e2e_server      (in-memory database + scripted AI)
 *   GENDOC_E2E=1 VITE_API_URL=http://127.0.0.1:8765/api npx vitest run src/e2e
 * Skipped unless GENDOC_E2E is set, so the normal `npm test` needs no server.
 */
import { Editor } from '@tiptap/core';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ApiError, api, clearToken, getToken } from '../api/client';
import type { ApiTemplate, MissingField } from '../api/types';
import { acceptAllAiDraft, applyProposal, exportHtml, hasAiDraft, snapshotBlocks, toCopilotBlocks } from '../editor/blocks';
import { editorExtensions } from '../editor/extensions';

const run = process.env.GENDOC_E2E ? describe : describe.skip;
// Markers that wrap real text. (An empty optional field is an empty span; an editor cannot keep an empty mark.)
const filledMarkers = (html: string) =>
  [...new DOMParser().parseFromString(html, 'text/html').body.querySelectorAll('[data-field]')]
    .filter((el) => el.tagName === 'TR' || (el.textContent ?? '').trim() !== '').length;
const fill = (missing: MissingField[]) =>
  Object.fromEntries(missing.map((m) => [m.key, m.type === 'table' ? [Object.fromEntries((m.columns ?? []).map((c) => [c.key, '100']))] : m.type === 'list' ? ['one', 'two'] : m.type === 'select' ? (m.options ?? [''])[0] : `Test ${m.label}`]));

run('frontend client + editor against the live API', () => {
  let templates: ApiTemplate[] = [];
  beforeAll(async () => {
    clearToken();
    const user = await api.auth.login('kristal.patel@svnit.acm.org', 'Password123!');
    expect(user.role).toBe('Club Member');
    expect(getToken()).toBeTruthy();
    templates = await api.templates.list();
  });

  it('lists the seeded templates from the database, with real previews and fields', async () => {
    expect(templates.length).toBeGreaterThanOrEqual(15);
    expect(templates.slice(0, 5).map((t) => t.title)).toContain('Prize Money Receipt');
    const t = templates.find((x) => x.title === 'Permission Letter')!;
    const [detail, preview] = await Promise.all([api.templates.get(t.id), api.templates.preview(t.id)]);
    expect(detail.fields!.some((f) => f.official && f.required)).toBe(true);
    expect(preview.html).toContain('data-field="venue"');
  });

  it('describe -> extract -> answer missing -> generate -> save -> edit -> save -> reload', async () => {
    const t = templates.find((x) => x.title === 'Permission Letter')!;
    const ex = await api.generator.extract({ templateIds: [t.id], text: 'Web Dev Workshop in Seminar Hall on 14 October 2026 at 6:00 PM, 120 students. Student head Ansh Gupta.' });
    expect(ex.values.venue).toBe('Seminar Hall');
    expect(ex.extractedKeys).toContain('eventTitle');
    const missing = ex.missing[t.id];
    expect(missing.length).toBeGreaterThan(0); // official details the text did not contain are asked, not invented
    expect(ex.values.facultyChairmanName).toBeUndefined();

    const gen = await api.generator.generate({ templateId: t.id, values: { ...ex.values, ...fill(missing) } });
    expect(gen.requiresTemplateSave).toBe(false);
    const created = await api.documents.create(gen.document); // the generator's body, unchanged
    expect(created.status).toBe('Draft');

    // open in the editor exactly as the editor view does
    const loaded = await api.documents.get(created.id);
    const editor = new Editor({ extensions: editorExtensions(), content: loaded.content });
    const fieldsBefore = filledMarkers(loaded.content);
    editor.commands.insertContentAt(editor.state.doc.content.size, '<p>Added by the user.</p>');
    const draft = await api.documents.saveDraft(created.id, exportHtml(editor), loaded.currentVersion);
    expect(draft.currentVersion).toBe(loaded.currentVersion);
    const saved = await api.documents.saveContent(created.id, { content: exportHtml(editor), baseVersion: loaded.currentVersion });
    expect(saved.currentVersion).toBe(loaded.currentVersion + 1);

    const again = await api.documents.get(created.id);
    expect(again.content).toContain('Added by the user.');
    expect(filledMarkers(again.content)).toBe(fieldsBefore); // every filled-in field marker survives the editor and the server
    expect(again.hasUnsavedDraft).toBe(false);

    // a stale save is refused, never silently overwritten
    await expect(api.documents.saveContent(created.id, { content: '<p>x</p>', baseVersion: loaded.currentVersion }))
      .rejects.toMatchObject({ code: 'version_conflict' });
  });

  it('incomplete generation is rejected with the missing field keys', async () => {
    const t = templates.find((x) => x.title === 'Prize Money Receipt')!;
    const err = await api.generator.generate({ templateId: t.id, values: { eventTitle: 'X' } }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('missing_required_fields');
    expect(err.fields).toContain('amount');
  });

  it('AI drafted text: export is blocked until accepted and saved, then PDF and DOCX work', async () => {
    const t = templates.find((x) => x.title === 'Event Notice')!;
    const ex = await api.generator.extract({ templateIds: [t.id], text: 'notice for the workshop' });
    const values = { ...ex.values, ...fill(ex.missing[t.id]) };
    const d = await api.generator.draft({ templateId: t.id, values, keys: ['summary'] });
    expect(d.drafts.summary).toBeTruthy();
    const gen = await api.generator.generate({ templateId: t.id, values: { ...values, summary: d.drafts.summary }, aiKeys: ['summary'] });
    expect(gen.aiDraftFields).toEqual(['summary']);
    const doc = await api.documents.create(gen.document);
    expect(doc.hasUnacceptedAiText).toBe(true);

    const blocked = await fetch(`${import.meta.env.VITE_API_URL}/documents/${doc.id}/export?format=pdf`, { headers: { Authorization: `Bearer ${getToken()}` } });
    expect(blocked.status).toBe(409);
    expect((await blocked.json()).error.code).toBe('unaccepted_ai_text');

    const editor = new Editor({ extensions: editorExtensions(), content: doc.content });
    expect(hasAiDraft(editor)).toBe(true);
    acceptAllAiDraft(editor);
    expect(hasAiDraft(editor)).toBe(false);
    await api.documents.saveContent(doc.id, { content: exportHtml(editor), baseVersion: doc.currentVersion });

    for (const [fmt, magic] of [['pdf', '%PDF'], ['docx', 'PK']] as const) {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/documents/${doc.id}/export?format=${fmt}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      expect(r.status, fmt).toBe(200);
      expect(new TextDecoder('latin1').decode((await r.arrayBuffer()).slice(0, 4))).toContain(magic);
    }
    // and the UI's download helper succeeds too
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    await expect(api.documents.download(doc.id, 'pdf', 'x')).resolves.toBeUndefined();
  });

  it('Copilot suggestion is applied to the open editor and persisted', async () => {
    const t = templates.find((x) => x.title === 'Event Notice')!;
    const ex = await api.generator.extract({ templateIds: [t.id], text: 'notice' });
    const gen = await api.generator.generate({ templateId: t.id, values: { ...ex.values, ...fill(ex.missing[t.id]) } });
    const doc = await api.documents.create(gen.document);
    const editor = new Editor({ extensions: editorExtensions(), content: doc.content });
    const blocks = snapshotBlocks(editor);
    const r = await api.generator.copilot({ instruction: 'Make it more formal', blocks: toCopilotBlocks(blocks) });
    expect(r.proposals.length).toBe(1);
    const res = applyProposal(editor, r.proposals[0], { blocks });
    expect(res).toEqual({ ok: true });
    expect(exportHtml(editor)).toContain('Kindly note');
    const saved = await api.documents.saveContent(doc.id, { content: exportHtml(editor), baseVersion: doc.currentVersion });
    expect((await api.documents.get(doc.id)).content).toContain('Kindly note');
    expect(saved.currentVersion).toBe(doc.currentVersion + 1);
  });

  it('permissions: a member cannot manage templates; faculty cannot create', async () => {
    const t = templates[0];
    await expect(api.templates.remove(t.id)).rejects.toMatchObject({ status: 403 });
    clearToken();
    await api.auth.login('faculty@svnit.acm.org', 'Password123!');
    await expect(api.generator.generate({ templateId: t.id, values: {} })).rejects.toMatchObject({ status: 403 });
    clearToken();
    await expect(api.templates.list()).rejects.toMatchObject({ status: 401 });
  });
});
