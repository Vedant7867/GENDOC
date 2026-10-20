// TEMPORARY BRIDGE until the generator (extraction + missing-info flow) sends real documents.
//
// The existing Extraction and Form Wizard modals still produce a `ClubDocument` summary. This turns that
// summary into a POST /documents call so documents persist. It only sends values the modals actually
// collected: official fields such as the faculty coordinator are never invented, so the backend must run
// with ENFORCE_REQUIRED_FIELDS=false while this adapter is in use. Delete this file when the generator lands.
import type { ClubDocument } from '../types';
import { api } from './client';
import type { ApiDocumentDetail } from './types';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function createFromLegacy(doc: ClubDocument): Promise<ApiDocumentDetail> {
  const templates = await api.templates.list();
  const template = templates.find((t) => t.templateType === doc.templateType);
  if (!template) throw new Error(`No template is set up for "${doc.templateType}" yet.`);

  // Field names come from the templates catalog; they match the document's summary columns.
  const fields: Record<string, string> = {};
  if (doc.eventDate) fields.eventDate = doc.eventDate;
  if (doc.venue) fields.venue = doc.venue;
  if (doc.expectedAttendance) fields.expectedAttendance = doc.expectedAttendance;
  if (doc.budgetTotal) fields.budgetTotal = doc.budgetTotal;
  if (doc.summary) fields.summary = doc.summary;
  if (doc.organizer) fields.organizer = doc.organizer;

  const line = (label: string, key: string) =>
    fields[key] ? `<p><strong>${label}:</strong> <span data-field="${key}">${esc(fields[key])}</span></p>` : '';
  const content =
    `<h1>${esc(doc.title)}</h1>` +
    line('Date(s)', 'eventDate') +
    line('Venue', 'venue') +
    line('Expected participants', 'expectedAttendance') +
    line('Budget', 'budgetTotal') +
    line('Organizers', 'organizer') +
    (fields.summary ? `<h2>Summary</h2><p><span data-field="summary">${esc(fields.summary)}</span></p>` : '');

  return api.documents.create({
    title: doc.title,
    templateId: template.id,
    fields,
    content,
    venue: doc.venue,
    eventDate: doc.eventDate,
    expectedAttendance: doc.expectedAttendance,
    budgetTotal: doc.budgetTotal,
    summary: doc.summary,
    organizer: doc.organizer,
  });
}
