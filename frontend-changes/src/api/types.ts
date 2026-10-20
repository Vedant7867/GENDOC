import type { DocumentStatus, UserRole } from '../types';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId: string;
  avatarInitial: string;
  createdAt: string;
}

export interface ApiDocument {
  id: string;
  title: string;
  templateId: string;
  templateType: string;
  status: DocumentStatus;
  ownerId: string;
  clubId: string;
  currentVersion: number;
  hasUnsavedDraft: boolean;
  hasAiDraft: boolean;
  createdAt: string;
  updatedAt: string;
  venue?: string;
  eventDate?: string;
  expectedAttendance?: string;
  budgetTotal?: string;
  summary?: string;
  organizer?: string;
}

/** GET /documents/{id}: metadata plus the working content the editor should load. */
export interface ApiDocumentDetail extends ApiDocument {
  content: string;
  fields: Record<string, unknown>;
  hasUnacceptedAiText: boolean;
  draftSavedAt?: string;
}

export interface ApiDocumentList {
  items: ApiDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiFolderCount {
  templateType: string;
  count: number;
}

export interface ApiVersionMeta {
  version: number;
  source: 'generated' | 'manual' | 'restore';
  note: string | null;
  savedBy: string;
  savedAt: string;
}

export interface ApiTemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'currency' | 'select' | 'list' | 'table';
  required: boolean;
  /** Official fields (reference numbers, signatories, amounts) are never filled by the AI. */
  official: boolean;
  group?: string;
  helpText?: string;
  placeholder?: string;
  defaultValue?: string;
  example?: unknown;
  options?: string[];
  columns?: { key: string; label: string }[];
  autoNumber?: boolean;
  prefill?: string;
}

export interface ApiTemplate {
  id: string;
  /** Stable slug such as "event-proposal"; also accepted as `templateId` when creating a document. */
  key: string | null;
  title: string;
  templateType: string;
  category: string;
  description: string;
  iconName: string;
  theme: string;
  suggestedPrompt: string;
  version: number;
  versionLabel: string;
  previewHeading: string;
  wireframeVariant: string;
  formats: ('DOCX' | 'PDF')[];
  usedCount: number;
  isMostUsed: boolean;
  isSystem: boolean;
  customized: boolean;
  createdBy: string;
  createdAt: string | null;
  updatedAt: string | null;
  fieldCount: number;
  requiredFieldCount: number;
  /** Only on GET /templates/{id}, not in the list. */
  html?: string;
  fields?: ApiTemplateField[];
}

export type DocumentSort = 'updatedAt' | '-updatedAt' | 'createdAt' | '-createdAt' | 'title' | '-title';

export interface ListDocumentsParams {
  q?: string;
  status?: DocumentStatus;
  templateType?: string;
  sort?: DocumentSort;
  page?: number;
  limit?: number;
}

export interface CreateDocumentBody {
  title: string;
  templateId: string;
  fields: Record<string, unknown>;
  content: string;
  venue?: string;
  eventDate?: string;
  expectedAttendance?: string;
  budgetTotal?: string;
  summary?: string;
  organizer?: string;
}

export interface PatchDocumentBody {
  title?: string;
  status?: DocumentStatus;
  venue?: string;
  eventDate?: string;
  expectedAttendance?: string;
  budgetTotal?: string;
  summary?: string;
  organizer?: string;
}
