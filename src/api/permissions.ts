// Mirrors the backend role rules (contract section 7) so the UI only offers actions that will succeed.
// The backend stays the authority: if these ever drift, the server answers 403 and the UI shows its message.
import type { DocumentStatus, User } from '../types';
import type { ApiDocument } from './types';

const isOwner = (u: User, d: ApiDocument) => d.ownerId === u.id;

export const canCreate = (u: User): boolean => u.role !== 'Faculty Advisor';

export const canDelete = (u: User, d: ApiDocument): boolean => {
  if (u.role === 'Club Admin') return true;
  if (u.role === 'Core Coordinator') return d.status !== 'Completed';
  if (u.role === 'Club Member') return isOwner(u, d) && d.status === 'Draft';
  return false;
};

export interface StatusAction {
  label: string;
  status: DocumentStatus;
}

export function statusActions(u: User, d: ApiDocument): StatusAction[] {
  const staff = u.role === 'Core Coordinator' || u.role === 'Club Admin';
  const memberOwn = u.role === 'Club Member' && isOwner(u, d);
  const out: StatusAction[] = [];
  if (d.status === 'Draft' && (staff || memberOwn)) out.push({ label: 'Send for review', status: 'Needs Review' });
  if (d.status === 'Needs Review') {
    if (staff || u.role === 'Faculty Advisor') out.push({ label: 'Mark completed', status: 'Completed' });
    if (staff || memberOwn || u.role === 'Faculty Advisor') out.push({ label: 'Back to draft', status: 'Draft' });
  }
  if (d.status === 'Completed' && staff) out.push({ label: 'Reopen as draft', status: 'Draft' });
  return out;
}
