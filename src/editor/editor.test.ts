// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Editor } from '@tiptap/core';
import { describe, expect, it } from 'vitest';
import { acceptAllAiDraft, applyProposal, exportHtml, hasAiDraft, snapshotBlocks } from './blocks';
import { editorExtensions } from './extensions';

const fixture = (name: string) => readFileSync(resolve(process.cwd(), 'src/editor/__fixtures__', `${name}.html`), 'utf8');
const make = (html: string) => new Editor({ extensions: editorExtensions(), content: html });
// data-field markers that wrap real text. (An empty optional field renders as an empty span; an editor
// cannot hold an empty mark, so those are intentionally not part of the comparison.)
const attrValues = (html: string, attr: string) =>
  [...new DOMParser().parseFromString(html, 'text/html').body.querySelectorAll(`[${attr}]`)]
    .filter((el) => (el.textContent ?? '').trim() !== '' || el.tagName === 'TR')
    .map((el) => el.getAttribute(attr) as string)
    .sort();
const squash = (s: string) => s.replace(/\s+/g, '');

// What the backend sanitizer (contract s.4) lets through.
const ALLOWED_TAGS = new Set('h1 h2 h3 p ul ol li table thead tbody tr th td strong em u br hr img span div blockquote'.split(' '));
const ALLOWED_ATTRS = new Set(['class', 'style', 'data-field', 'data-ai', 'src', 'alt']);

describe('editor round trip keeps the document model intact', () => {
  for (const name of ['event-proposal', 'permission-letter', 'bill-certificate', 'prize-money', 'meeting-minutes']) {
    it(`${name}: every data-field marker survives load -> getHTML`, () => {
      const html = fixture(name);
      const out = exportHtml(make(html));
      expect(attrValues(out, 'data-field')).toEqual(attrValues(html, 'data-field'));
      expect(attrValues(out, 'data-field').length).toBeGreaterThan(5);
    });

    it(`${name}: text content and table structure are unchanged`, () => {
      const html = fixture(name);
      const out = exportHtml(make(html));
      const a = new DOMParser().parseFromString(html, 'text/html').body;
      const b = new DOMParser().parseFromString(out, 'text/html').body;
      expect(squash(b.textContent!)).toBe(squash(a.textContent!));
      expect(b.querySelectorAll('table').length).toBe(a.querySelectorAll('table').length);
      expect(b.querySelectorAll('tr').length).toBe(a.querySelectorAll('tr').length);
      expect(b.querySelectorAll('td, th').length).toBe(a.querySelectorAll('td, th').length);
    });

    it(`${name}: output only uses tags/attributes the backend accepts `, () => {
      const body = new DOMParser().parseFromString(exportHtml(make(fixture(name))), 'text/html').body;
      for (const el of body.querySelectorAll('*')) {
        expect(ALLOWED_TAGS.has(el.tagName.toLowerCase()), `<${el.tagName.toLowerCase()}>`).toBe(true);
        for (const a of el.getAttributeNames()) expect(ALLOWED_ATTRS.has(a), `${el.tagName} ${a}`).toBe(true);
      }
    });
  }

  it('keeps the AI draft marker until a person accepts it, then removes it', () => {
    const ed = make(fixture('event-proposal'));
    expect(hasAiDraft(ed)).toBe(true);
    expect(ed.getHTML()).toContain('data-ai="draft"');
    acceptAllAiDraft(ed);
    expect(hasAiDraft(ed)).toBe(false);
    expect(ed.getHTML()).not.toContain('data-ai');
    expect(ed.getHTML()).toContain('data-field="summary"'); // the field marker stays
  });

  it('supports editing: formatting, alignment, lists and table rows', () => {
    const ed = make('<p>Hello world</p>');
    ed.chain().selectAll().toggleBold().toggleUnderline().setTextAlign('center').run();
    expect(ed.getHTML()).toContain('<strong>');
    expect(ed.getHTML()).toContain('<u>');
    expect(ed.getHTML()).toContain('text-align: center');
    ed.commands.setContent('<p>a</p>');
    ed.chain().selectAll().toggleBulletList().run();
    expect(ed.getHTML()).toContain('<ul>');
    ed.commands.insertTable({ rows: 2, cols: 2, withHeaderRow: false });
    expect(exportHtml(ed)).toContain('<table><tbody>');
    ed.commands.undo();
    expect(exportHtml(ed)).not.toContain('<table');
    ed.commands.redo();
    expect(exportHtml(ed)).toContain('<table');
  });
});

describe('Copilot proposals are applied only where they were made', () => {
  const html = '<h2>Intro</h2><p>The event is at <span data-field="venue">Seminar Hall</span> for everyone.</p><p>Closing line.</p>';
  const proposal = (over = {}) => ({ id: 'p1', action: 'replace' as const, blockId: 1, html: '<p>The event will take place at Seminar Hall for all attendees.</p>', reason: '', originalText: '', ...over });

  it('replace: swaps the block and re-tags the protected field value', () => {
    const ed = make(html);
    const snap = { blocks: snapshotBlocks(ed) };
    expect(applyProposal(ed, proposal(), snap)).toEqual({ ok: true });
    const out = ed.getHTML();
    expect(out).toContain('will take place');
    expect(out).toContain('<span data-field="venue">Seminar Hall</span>');
    expect(out).toContain('<h2>Intro</h2>');
    expect(out).toContain('Closing line.'); // unrelated content untouched
  });

  it('refuses a stale proposal when the document changed meanwhile', () => {
    const ed = make(html);
    const snap = { blocks: snapshotBlocks(ed) };
    ed.chain().focus().insertContentAt(0, '<p>New first paragraph</p>').run(); // shifts the blocks
    const r = applyProposal(ed, proposal(), snap);
    expect(r.ok).toBe(false);
    expect(ed.getHTML()).not.toContain('will take place');
  });

  it('insert_after adds a section after the block; replace_selection changes only the selected words', () => {
    const ed = make(html);
    const snap = { blocks: snapshotBlocks(ed) };
    expect(applyProposal(ed, proposal({ action: 'insert_after', blockId: 2, html: '<h2>Conclusion</h2><p>Thank you.</p>' }), snap).ok).toBe(true);
    expect(ed.getHTML().indexOf('Conclusion')).toBeGreaterThan(ed.getHTML().indexOf('Closing line.'));

    const ed2 = make(html);
    const blocks = snapshotBlocks(ed2);
    const start = blocks[2].pos + 1;
    const selection = { from: start, to: start + 7, text: 'Closing', blockId: 2 };
    expect(ed2.state.doc.textBetween(selection.from, selection.to, ' ')).toBe('Closing');
    expect(applyProposal(ed2, proposal({ action: 'replace_selection', blockId: 2, html: 'Final' }), { blocks, selection }).ok).toBe(true);
    expect(ed2.getHTML()).toContain('<p>Final line.</p>');
  });
});
