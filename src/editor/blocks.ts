import type { Editor } from '@tiptap/core';
import type { CopilotBlock, CopilotProposal } from '../api/types';

/** One top-level block of the document as the Copilot sees it. `pos`/`size` are ProseMirror positions. */
export interface BlockSnapshot {
  id: number;
  type: string;
  text: string;
  pos: number;
  size: number;
  /** Filled-in field values inside the block: they must survive any rewrite. */
  protectedValues: { key: string; text: string }[];
}

export interface SelectionSnapshot {
  from: number;
  to: number;
  text: string;
  blockId: number;
}

export interface RequestSnapshot {
  blocks: BlockSnapshot[];
  selection?: SelectionSnapshot;
}

export function snapshotBlocks(editor: Editor): BlockSnapshot[] {
  const out: BlockSnapshot[] = [];
  editor.state.doc.forEach((node, offset, index) => {
    const protectedValues: { key: string; text: string }[] = [];
    node.descendants((n) => {
      const mark = n.isText ? n.marks.find((m) => m.type.name === 'fieldValue') : undefined;
      if (mark && n.text) protectedValues.push({ key: String(mark.attrs.field ?? ''), text: n.text });
    });
    out.push({ id: index, type: node.type.name, text: node.textContent, pos: offset, size: node.nodeSize, protectedValues });
  });
  return out;
}

/** Selection inside ONE top-level block (otherwise the request uses the whole document). */
export function snapshotSelection(editor: Editor): SelectionSnapshot | undefined {
  const { from, to, empty, $from, $to } = editor.state.selection;
  if (empty || $from.index(0) !== $to.index(0)) return undefined;
  const text = editor.state.doc.textBetween(from, to, ' ');
  return text.trim() ? { from, to, text, blockId: $from.index(0) } : undefined;
}

/** Keeps the request small: a window of blocks around the caret when the document is long. */
export function windowBlocks(blocks: BlockSnapshot[], centre: number, maxBlocks = 300, maxChars = 50_000): BlockSnapshot[] {
  if (blocks.length <= maxBlocks && blocks.reduce((n, b) => n + b.text.length, 0) <= maxChars) return blocks;
  const picked: BlockSnapshot[] = [];
  let chars = 0;
  for (let d = 0; d < blocks.length && picked.length < maxBlocks; d++) {
    for (const i of d === 0 ? [centre] : [centre - d, centre + d]) {
      const b = blocks[i];
      if (b && chars + b.text.length <= maxChars && picked.length < maxBlocks) {
        picked.push(b);
        chars += b.text.length;
      }
    }
  }
  return picked.sort((a, b) => a.id - b.id);
}

export const toCopilotBlocks = (blocks: BlockSnapshot[]): CopilotBlock[] =>
  blocks.map((b) => ({
    id: b.id,
    type: b.type,
    text: b.text.slice(0, 8000),
    protected: b.protectedValues.map((p) => p.text).slice(0, 40),
  }));

export type ApplyResult = { ok: true } | { ok: false; reason: string };

const STALE = 'The document changed since this suggestion was made. Ask the assistant again.';

/** Re-tags filled-in values after a block was rewritten, so fields stay findable (contract s.4). */
function reapplyFieldMarks(editor: Editor, from: number, to: number, values: { key: string; text: string }[]) {
  const markType = editor.schema.marks.fieldValue;
  const { tr } = editor.state;
  for (const v of values) {
    editor.state.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isText || !node.text || node.marks.some((m) => m.type === markType)) return;
      const i = node.text.indexOf(v.text);
      if (i >= 0) tr.addMark(pos + i, pos + i + v.text.length, markType.create({ field: v.key }));
    });
  }
  if (tr.docChanged || tr.steps.length) editor.view.dispatch(tr);
}

/** Applies ONE accepted proposal. Refuses (instead of guessing) when the target changed since the request. */
export function applyProposal(editor: Editor, p: CopilotProposal, snap: RequestSnapshot): ApplyResult {
  const now = snapshotBlocks(editor);
  const block = now[p.blockId];
  const before = snap.blocks.find((b) => b.id === p.blockId);
  if (!block || !before || block.text !== before.text) return { ok: false, reason: STALE };

  if (p.action === 'replace_selection') {
    const s = snap.selection;
    if (!s || editor.state.doc.textBetween(s.from, s.to, ' ') !== s.text) return { ok: false, reason: STALE };
    editor.chain().focus().insertContentAt({ from: s.from, to: s.to }, p.html).run();
    return { ok: true };
  }
  if (p.action === 'insert_after') {
    editor.chain().focus().insertContentAt(block.pos + block.size, p.html).run();
    return { ok: true };
  }
  // replace a whole text block
  const sizeBefore = editor.state.doc.content.size;
  editor.chain().focus().insertContentAt({ from: block.pos, to: block.pos + block.size }, p.html).run();
  const delta = editor.state.doc.content.size - sizeBefore;
  reapplyFieldMarks(editor, block.pos, block.pos + block.size + delta, before.protectedValues);
  return { ok: true };
}

export const hasAiDraft = (editor: Editor): boolean => {
  let found = false;
  editor.state.doc.descendants((n) => {
    if (n.isText && n.marks.some((m) => m.type.name === 'aiDraft')) found = true;
    return !found;
  });
  return found;
};

/** "Accept": the person reviewed the AI text, so the draft marker is removed. */
export function acceptAllAiDraft(editor: Editor): void {
  const markType = editor.schema.marks.aiDraft;
  const { tr } = editor.state;
  tr.removeMark(0, editor.state.doc.content.size, markType);
  editor.view.dispatch(tr);
}

/**
 * The HTML that is sent to the server. TipTap adds helper markup the backend allow-list would drop anyway
 * (`<colgroup>`, `min-width` styles, `colspan="1"`); removing it here means "what you see is what is saved".
 */
export function exportHtml(editor: Editor): string {
  const body = new DOMParser().parseFromString(editor.getHTML(), 'text/html').body;
  body.querySelectorAll('colgroup').forEach((n) => n.remove());
  body.querySelectorAll('table').forEach((n) => n.removeAttribute('style'));
  body.querySelectorAll('[colspan="1"]').forEach((n) => n.removeAttribute('colspan'));
  body.querySelectorAll('[rowspan="1"]').forEach((n) => n.removeAttribute('rowspan'));
  return body.innerHTML;
}
