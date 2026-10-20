import type { ClubDocument, DocumentStatus, IconColorTheme, User } from '../types';
import type {
  ApiDocument,
  ApiDocumentDetail,
  ApiDocumentList,
  ApiFolderCount,
  ApiTemplate,
  ApiUser,
  ApiVersionMeta,
  CreateDocumentBody,
  ListDocumentsParams,
  PatchDocumentBody,
} from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api';
const TOKEN_KEY = 'gendoc_token';

/** Fired when the server says the session is no longer valid, so the app can show the sign-in screen. */
export const UNAUTHENTICATED_EVENT = 'gendoc:unauthenticated';

export const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => sessionStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  code: string;
  /** Present on `missing_required_fields`: the field keys the user still has to provide. */
  fields?: string[];
  currentVersion?: number;

  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = Array.isArray(extra.fields) ? (extra.fields as string[]) : undefined;
    this.currentVersion = typeof extra.currentVersion === 'number' ? extra.currentVersion : undefined;
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let body: { error?: { code?: string; message?: string } & Record<string, unknown> } = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error body */
  }
  const e = body.error ?? {};
  return new ApiError(res.status, e.code ?? 'http_error', e.message ?? `Request failed (${res.status})`, e);
}

async function send(path: string, init: RequestInit & { json?: unknown } = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let body = init.body;
  if (init.json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.json);
  }
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers, body });
  } catch {
    throw new ApiError(0, 'network_error', 'Cannot reach the server. Check that the backend is running.');
  }
  if (!res.ok) {
    const err = await toApiError(res);
    if (res.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event(UNAUTHENTICATED_EVENT));
    }
    throw err;
  }
  return res;
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const res = await send(path, init);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  auth: {
    async login(email: string, password: string): Promise<ApiUser> {
      const r = await request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', json: { email, password } });
      setToken(r.token);
      return r.user;
    },
    async signup(name: string, email: string, password: string): Promise<ApiUser> {
      const r = await request<{ token: string; user: ApiUser }>('/auth/signup', {
        method: 'POST',
        json: { name, email, password },
      });
      setToken(r.token);
      return r.user;
    },
    me: () => request<ApiUser>('/auth/me'),
    signOut: () => clearToken(),
  },

  templates: {
    list: () => request<{ items: ApiTemplate[] }>('/templates').then((r) => r.items),
    get: (id: string) => request<ApiTemplate>(`/templates/${encodeURIComponent(id)}`),
    byType: (templateType: string) =>
      request<ApiTemplate>(`/templates/by-type/${encodeURIComponent(templateType)}`),
  },

  documents: {
    list: (p: ListDocumentsParams = {}) =>
      request<ApiDocumentList>(`/documents${qs({ ...p })}`),
    folders: () => request<{ folders: ApiFolderCount[]; total: number }>('/documents/folders'),
    get: (id: string) => request<ApiDocumentDetail>(`/documents/${id}`),
    create: (body: CreateDocumentBody) => request<ApiDocumentDetail>('/documents', { method: 'POST', json: body }),
    patch: (id: string, body: PatchDocumentBody) =>
      request<ApiDocument>(`/documents/${id}`, { method: 'PATCH', json: body }),
    remove: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) => request<ApiDocumentDetail>(`/documents/${id}/duplicate`, { method: 'POST' }),

    // Editor calls (for the generator/editor owner).
    saveDraft: (id: string, content: string, baseVersion: number) =>
      request<{ draftSavedAt: string; currentVersion: number }>(`/documents/${id}/draft`, {
        method: 'PUT',
        json: { content, baseVersion },
      }),
    saveContent: (id: string, body: { content: string; baseVersion: number; fields?: Record<string, unknown>; note?: string }) =>
      request<ApiDocumentDetail>(`/documents/${id}/content`, { method: 'PUT', json: body }),
    versions: (id: string) =>
      request<{ items: ApiVersionMeta[]; currentVersion: number }>(`/documents/${id}/versions`),
    version: (id: string, n: number) =>
      request<ApiVersionMeta & { content: string; fields: Record<string, unknown> }>(`/documents/${id}/versions/${n}`),
    restore: (id: string, n: number) =>
      request<ApiDocumentDetail>(`/documents/${id}/versions/${n}/restore`, { method: 'POST' }),

    /** Downloads the file. Throws ApiError (for example `unaccepted_ai_text` or `not_implemented`). */
    async download(id: string, format: 'pdf' | 'docx', fallbackName: string): Promise<void> {
      const res = await send(`/documents/${id}/export${qs({ format })}`);
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      const name = match?.[1] ?? `${fallbackName.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};

// ---------- mapping helpers for the existing components ----------

// Mirrors the catalog's template themes; "rose" is not an IconColorTheme in this app, so it maps to amber.
const ICON_THEME_BY_TYPE: Record<string, IconColorTheme> = {
  'Event Proposal': 'blue',
  'Permission Letter': 'amber',
  'Event Notice': 'emerald',
  'Budget Estimate': 'purple',
  'Participation Certificate': 'indigo',
  'Bill Summary': 'purple',
  'Bill Certificate': 'amber',
  'Prize Money Receipt': 'amber',
  'Submitted Document': 'emerald',
  'Event Report': 'blue',
  'Speaker Invitation': 'amber',
  'OD Attendance Relief Notice': 'emerald',
  'Meeting Minutes': 'indigo',
  'Certificate of Appreciation': 'indigo',
  'Sponsorship Request': 'amber',
  'Thank You Letter': 'emerald',
  'Attendance Sheet': 'purple',
};

export const iconThemeFor = (templateType: string): IconColorTheme => ICON_THEME_BY_TYPE[templateType] ?? 'blue';

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const mins = Math.round((now.getTime() - then.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const toClubDocument = (d: ApiDocument): ClubDocument => ({
  id: d.id,
  title: d.title,
  templateType: d.templateType,
  status: d.status as DocumentStatus,
  lastEditedText: relativeTime(d.updatedAt),
  lastEditedDate: d.updatedAt,
  iconTheme: iconThemeFor(d.templateType),
  venue: d.venue,
  eventDate: d.eventDate,
  expectedAttendance: d.expectedAttendance,
  budgetTotal: d.budgetTotal,
  summary: d.summary,
  organizer: d.organizer,
});

export const toUser = (u: ApiUser): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatarInitial: u.avatarInitial,
  createdAt: u.createdAt,
});
