import { Mark } from '@tiptap/core';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import ListItem from '@tiptap/extension-list-item';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

/**
 * The editor must keep the markers the backend relies on (contract section 4):
 *   <span data-field="venue">  values that came from the event fields (so documents of one event stay consistent)
 *   <span data-ai="draft">     AI written text that a person has not accepted yet (export is blocked while any remains)
 * plus `data-field` on table rows and list items, and `class` on tables / page breaks. A plain rich-text
 * schema would silently drop all of these, so they are declared explicitly here.
 */
export const FieldValue = Mark.create({
  name: 'fieldValue',
  inclusive: false,
  addAttributes() {
    return {
      field: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-field'),
        renderHTML: (a) => (a.field ? { 'data-field': a.field } : {}),
      },
    };
  },
  parseHTML: () => [{ tag: 'span[data-field]' }],
  renderHTML: ({ HTMLAttributes }) => ['span', HTMLAttributes, 0],
});

export const AiDraft = Mark.create({
  name: 'aiDraft',
  inclusive: false,
  parseHTML: () => [{ tag: 'span[data-ai="draft"]' }],
  renderHTML: () => ['span', { 'data-ai': 'draft' }, 0],
});

const dataField = {
  dataField: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute('data-field'),
    renderHTML: (a: Record<string, unknown>) => (a.dataField ? { 'data-field': a.dataField as string } : {}),
  },
};
const className = {
  class: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute('class'),
    renderHTML: (a: Record<string, unknown>) => (a.class ? { class: a.class as string } : {}),
  },
};

const FieldListItem = ListItem.extend({ addAttributes: () => ({ ...dataField }) });
const FieldTableRow = TableRow.extend({ addAttributes: () => ({ ...dataField }) });
const ClassTable = Table.extend({ addAttributes() { return { ...this.parent?.(), ...className }; } });
const PageBreak = HorizontalRule.extend({ addAttributes() { return { ...this.parent?.(), ...className }; } });

/** Only constructs the backend's HTML allow-list can represent (no code blocks, strike-through, links, images). */
export const editorExtensions = () => [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
    horizontalRule: false,
    listItem: false,
    codeBlock: false,
    code: false,
    strike: false,
  }),
  FieldListItem,
  PageBreak,
  Underline,
  TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
  ClassTable.configure({ resizable: false }),
  FieldTableRow,
  TableHeader,
  TableCell,
  FieldValue,
  AiDraft,
];
