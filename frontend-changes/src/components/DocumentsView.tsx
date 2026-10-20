import React, { useEffect, useState } from 'react';
import {
  FileText,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  MoreVertical,
  MoreHorizontal,
  ChevronLeft,
  X,
} from 'lucide-react';
import { ClubDocument, DocumentStatus, IconColorTheme, User } from '../types';
import { ApiError, api, toClubDocument } from '../api/client';
import { canCreate, canDelete, statusActions } from '../api/permissions';
import type { ApiDocument, ApiDocumentList } from '../api/types';

// --- Custom SVGs for 100% Pixel Accuracy ---

export const GendocStarLogo = () => (
  <div className="relative flex items-center justify-center w-9 h-9">
    <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-md" />
    <svg viewBox="0 0 36 36" className="w-8 h-8 relative z-10" fill="none">
      <path
        d="M18 2C18 11.5 24.5 18 34 18C24.5 18 18 24.5 18 34C18 24.5 11.5 18 2 18C11.5 18 18 11.5 18 2Z"
        fill="url(#starGrad)"
      />
      <defs>
        <linearGradient id="starGrad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" />
          <stop offset="0.5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const TwoToneFolderIcon = ({ backColor, frontColor }: { backColor: string; frontColor: string }) => (
  <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0 5C0 2.23858 2.23858 0 5 0H14.1716C15.502 0 16.7783 0.526784 17.7175 1.46447L19.5355 3.28198C20.4747 4.21967 21.751 4.74645 23.0814 4.74645H37C39.7614 4.74645 42 6.98503 42 9.74645V29C42 31.7614 39.7614 34 37 34H5C2.23858 34 0 31.7614 0 29V5Z"
      fill={backColor}
    />
    <rect y="8" width="42" height="26" rx="4.5" fill={frontColor} />
  </svg>
);

export const DocxBadgeIcon = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
  <button
    type="button"
    onClick={onClick}
    title="Download DOCX"
    className="group relative inline-flex items-center justify-center w-7 h-8 hover:scale-105 transition-transform"
  >
    <svg viewBox="0 0 28 32" fill="none" className="w-7 h-8">
      <path
        d="M4 2C4 0.89543 4.89543 0 6 0H19L26 7V30C26 31.1046 25.1046 32 24 32H6C4.89543 32 4 31.1046 4 30V2Z"
        fill="#EFF6FF"
        stroke="#3B82F6"
        strokeWidth="1.5"
      />
      <path d="M19 0V5C19 6.10457 19.8954 7 21 7H26" fill="#BFDBFE" />
      <path d="M19 0L26 7H21C19.8954 7 19 6.10457 19 5V0Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="1" y="16" width="24" height="10" rx="2" fill="#1D4ED8" />
      <text
        x="13"
        y="23"
        fill="white"
        fontSize="6.5"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
      >
        DOCX
      </text>
    </svg>
  </button>
);

export const PdfBadgeIcon = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
  <button
    type="button"
    onClick={onClick}
    title="Download PDF"
    className="group relative inline-flex items-center justify-center w-7 h-8 hover:scale-105 transition-transform"
  >
    <svg viewBox="0 0 28 32" fill="none" className="w-7 h-8">
      <path
        d="M4 2C4 0.89543 4.89543 0 6 0H19L26 7V30C26 31.1046 25.1046 32 24 32H6C4.89543 32 4 31.1046 4 30V2Z"
        fill="#FEF2F2"
        stroke="#EF4444"
        strokeWidth="1.5"
      />
      <path d="M19 0L26 7H21C19.8954 7 19 6.10457 19 5V0Z" fill="#FECACA" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="2" y="16" width="22" height="10" rx="2" fill="#DC2626" />
      <text
        x="13"
        y="23"
        fill="white"
        fontSize="6.8"
        fontWeight="800"
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
      >
        PDF
      </text>
    </svg>
  </button>
);

// --- Folder cards (counts come from GET /documents/folders) ---

export interface FolderCategory {
  id: number;
  title: string;
  bgClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  folderBack: string;
  folderFront: string;
  filterType: string;
}

export const FOLDER_CATEGORIES: FolderCategory[] = [
  {
    id: 1,
    title: 'Event Proposals',
    bgClass: 'bg-[#EEF5FF]',
    borderClass: 'border-blue-100/80',
    badgeBg: 'bg-[#BFDBFE]',
    badgeText: 'text-[#1E40AF]',
    folderBack: '#3B82F6',
    folderFront: '#76A9FA',
    filterType: 'Event Proposal',
  },
  {
    id: 2,
    title: 'Permission Letters',
    bgClass: 'bg-[#FFF4EA]',
    borderClass: 'border-orange-100/80',
    badgeBg: 'bg-[#FED7AA]',
    badgeText: 'text-[#9A3412]',
    folderBack: '#D97706',
    folderFront: '#FBBF24',
    filterType: 'Permission Letter',
  },
  {
    id: 3,
    title: 'Event Notices',
    bgClass: 'bg-[#ECFDF3]',
    borderClass: 'border-emerald-100/80',
    badgeBg: 'bg-[#A7F3D0]',
    badgeText: 'text-[#065F46]',
    folderBack: '#10B981',
    folderFront: '#6EE7B7',
    filterType: 'Event Notice',
  },
  {
    id: 4,
    title: 'Budget Estimates',
    bgClass: 'bg-[#F4F0FF]',
    borderClass: 'border-purple-100/80',
    badgeBg: 'bg-[#DDD6FE]',
    badgeText: 'text-[#4C1D95]',
    folderBack: '#7C3AED',
    folderFront: '#A78BFA',
    filterType: 'Budget Estimate',
  },
  {
    id: 5,
    title: 'Participation Certificates',
    bgClass: 'bg-[#FFF0F0]',
    borderClass: 'border-rose-100/80',
    badgeBg: 'bg-[#FECDD3]',
    badgeText: 'text-[#9F1239]',
    folderBack: '#E11D48',
    folderFront: '#FDA4AF',
    filterType: 'Participation Certificate',
  },
];

const PAGE_SIZE = 20;
type SortOrder = 'recent' | 'name';

const ICON_CLASSES: Record<IconColorTheme, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200/60',
  amber: 'bg-amber-50 text-amber-600 border-amber-200/60',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
  purple: 'bg-purple-50 text-purple-600 border-purple-200/60',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200/60',
};

const TYPE_BADGE: Record<string, string> = {
  'Permission Letter': 'bg-[#CBD5E1]/80 text-slate-800',
  'Event Proposal': 'bg-[#93C5FD]/85 text-slate-900',
  'Budget Estimate': 'bg-[#C4B5FD]/85 text-slate-900',
  'Event Notice': 'bg-[#A7F3D0]/90 text-slate-900',
  'Participation Certificate': 'bg-[#FECDD3]/90 text-slate-900',
};

const STATUS_BADGE: Record<DocumentStatus, string> = {
  'Needs Review': 'bg-[#FDE08D] text-slate-900',
  Completed: 'bg-[#52D681] text-slate-900',
  Draft: 'bg-[#64748B] text-white',
};

const formatModified = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const messageOf = (e: unknown) =>
  e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong. Please try again.';

const countLabel = (n: number) => `${n} document${n === 1 ? '' : 's'}`;

interface DocumentsViewProps {
  searchQuery: string;
  currentUser: User;
  /** Bump this number to make the page reload (App does it after any change made elsewhere). */
  reloadToken: number;
  onGenerateDocument: () => void;
  onOpenDocument: (doc: ClubDocument) => void;
  /** Called after this page changes something (status, delete, duplicate) so other screens can refresh. */
  onChanged: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  searchQuery,
  currentUser,
  reloadToken,
  onGenerateDocument,
  onOpenDocument,
  onChanged,
}) => {
  const [selectedFolderType, setSelectedFolderType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery.trim());

  const [data, setData] = useState<ApiDocumentList | null>(null);
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Search runs on the server; wait for a pause in typing before asking.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, selectedFolderType, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.documents
      .list({
        q: debouncedQuery || undefined,
        templateType: selectedFolderType ?? undefined,
        sort: sortOrder === 'recent' ? '-updatedAt' : 'title',
        page,
        limit: PAGE_SIZE,
      })
      .then((r) => {
        if (cancelled) return;
        setData(r);
        setLoadError(null);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(messageOf(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selectedFolderType, sortOrder, page, reloadToken, retry]);

  useEffect(() => {
    let cancelled = false;
    api.documents
      .folders()
      .then((r) => {
        if (!cancelled) setFolderCounts(Object.fromEntries(r.folders.map((f) => [f.templateType, f.count])));
      })
      .catch(() => {
        /* folder counts are decoration; the list shows any real error */
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // After deleting the last row of a page, step back instead of showing an empty page.
  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) setPage((p) => p - 1);
  }, [data, page]);

  const docs: ApiDocument[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const run = async (doc: ApiDocument, action: () => Promise<unknown>) => {
    setActiveMenuId(null);
    setActionError(null);
    setBusyId(doc.id);
    try {
      await action();
      onChanged();
    } catch (e) {
      setActionError(messageOf(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (doc: ApiDocument) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) {
      setActiveMenuId(null);
      return;
    }
    void run(doc, () => api.documents.remove(doc.id));
  };

  const handleDownload = async (doc: ApiDocument, format: 'docx' | 'pdf', e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setActionError(null);
    try {
      await api.documents.download(doc.id, format, doc.title);
    } catch (err) {
      setActionError(messageOf(err));
    }
  };

  const open = (doc: ApiDocument) => onOpenDocument(toClubDocument(doc));

  const renderMenu = (doc: ApiDocument) => {
    const actions = statusActions(currentUser, doc);
    const itemClass = 'w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50';
    return (
      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-left text-xs animate-fadeIn">
        <button type="button" onClick={() => { setActiveMenuId(null); open(doc); }} className={`${itemClass} font-medium`}>
          Open document
        </button>
        <button type="button" onClick={(e) => handleDownload(doc, 'docx', e)} className={itemClass}>
          Download DOCX
        </button>
        <button type="button" onClick={(e) => handleDownload(doc, 'pdf', e)} className={itemClass}>
          Download PDF
        </button>
        {canCreate(currentUser) && (
          <button type="button" onClick={() => run(doc, () => api.documents.duplicate(doc.id))} className={itemClass}>
            Duplicate
          </button>
        )}
        {actions.length > 0 && <div className="my-1 border-t border-slate-100" />}
        {actions.map((a) => (
          <button
            key={a.status}
            type="button"
            onClick={() => run(doc, () => api.documents.patch(doc.id, { status: a.status }))}
            className={itemClass}
          >
            {a.label}
          </button>
        ))}
        {canDelete(currentUser, doc) && (
          <>
            <div className="my-1 border-t border-slate-100" />
            <button type="button" onClick={() => handleDelete(doc)} className="w-full px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50">
              Delete
            </button>
          </>
        )}
      </div>
    );
  };

  const emptyMessage =
    debouncedQuery || selectedFolderType
      ? 'No documents match your search or filter.'
      : 'No documents yet. Use "Generate Document" to create your first one.';

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page Title & Primary CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">Documents</h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">Your generated documents, organised by type.</p>
        </div>

        {canCreate(currentUser) && (
          <button
            type="button"
            onClick={onGenerateDocument}
            className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span>Generate Document</span>
          </button>
        )}
      </div>

      {actionError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-[13px] text-rose-800">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {/* FOLDER CATEGORY CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {FOLDER_CATEGORIES.map((folder) => {
            const isSelected = selectedFolderType === folder.filterType;
            return (
              <div
                key={folder.id}
                onClick={() => setSelectedFolderType(isSelected ? null : folder.filterType)}
                className={`${folder.bgClass} ${folder.borderClass} ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-sm' : ''
                } border rounded-xl p-4 flex flex-col justify-between min-h-[116px] cursor-pointer hover:shadow-sm transition-all select-none`}
              >
                <div className="flex items-start justify-between">
                  <TwoToneFolderIcon backColor={folder.folderBack} frontColor={folder.folderFront} />
                  <span
                    className={`w-6 h-6 rounded-full ${folder.badgeBg} ${folder.badgeText} text-[12px] font-bold flex items-center justify-center`}
                  >
                    {folder.id}
                  </span>
                </div>

                <div className="flex items-end justify-between mt-3.5">
                  <div>
                    <div className="text-[14px] font-bold text-slate-900 leading-snug">{folder.title}</div>
                    <div className="text-[12px] text-slate-600 font-medium mt-0.5">
                      {countLabel(folderCounts[folder.filterType] ?? 0)}
                    </div>
                  </div>
                  <ChevronRight className="text-slate-700 mb-1 shrink-0" size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ALL DOCUMENTS HEADER & CONTROLS */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <h2 className="text-[17px] font-bold text-slate-900">All Documents</h2>
          {selectedFolderType && (
            <button
              type="button"
              onClick={() => setSelectedFolderType(null)}
              className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium hover:bg-blue-100 flex items-center gap-1.5 transition-colors border border-blue-200"
            >
              <span>Filtered by: {selectedFolderType}</span>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-[#E2E8F0]/80 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-[#E2E8F0]/80 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'recent' ? 'name' : 'recent')}
            className="bg-white border border-slate-200/90 rounded-lg px-3.5 py-1.5 text-[12.5px] font-medium text-slate-700 flex items-center gap-2 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <span>{sortOrder === 'recent' ? 'Last modified' : 'Alphabetical (A-Z)'}</span>
            <ChevronDown className="text-slate-500" size={14} />
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center">
          <p className="text-[13.5px] text-rose-700">{loadError}</p>
          <button
            type="button"
            onClick={() => setRetry((r) => r + 1)}
            className="mt-3 px-4 py-2 rounded-lg bg-[#1D63DC] text-white text-[13px] font-semibold hover:bg-blue-700"
          >
            Try again
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[12px] font-semibold text-slate-600 bg-[#FAFBFD]">
                <th className="py-3.5 pl-5 pr-3 w-[31%]">Name</th>
                <th className="py-3.5 px-3 w-[16%]">Type</th>
                <th className="py-3.5 px-3 w-[18%]">Event Date</th>
                <th className="py-3.5 px-3 w-[15%]">Last Modified</th>
                <th className="py-3.5 px-3 w-[11%]">Status</th>
                <th className="py-3.5 px-3 w-[7%]">Formats</th>
                <th className="py-3.5 pl-2 pr-5 text-right w-[2%]">
                  <MoreHorizontal className="inline text-slate-500" size={16} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">Loading documents…</td>
                </tr>
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">{emptyMessage}</td>
                </tr>
              ) : (
                docs.map((doc) => (
                  <tr
                    key={doc.id}
                    onClick={() => open(doc)}
                    className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                      busyId === doc.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <td className="py-3 pl-5 pr-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                            ICON_CLASSES[toClubDocument(doc).iconTheme]
                          }`}
                        >
                          <FileText size={15} />
                        </div>
                        <span className="font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                          {doc.title}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold ${
                          TYPE_BADGE[doc.templateType] ?? 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {doc.templateType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-700 font-medium">{doc.eventDate ?? '—'}</td>

                    <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {formatModified(doc.updatedAt)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold ${STATUS_BADGE[doc.status]}`}
                      >
                        {doc.status}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <DocxBadgeIcon onClick={(e) => handleDownload(doc, 'docx', e)} />
                        <PdfBadgeIcon onClick={(e) => handleDownload(doc, 'pdf', e)} />
                      </div>
                    </td>

                    <td className="py-3 pl-2 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                          aria-label="Document actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === doc.id && renderMenu(doc)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && !data ? (
            <p className="col-span-full py-10 text-center text-slate-500">Loading documents…</p>
          ) : docs.length === 0 ? (
            <p className="col-span-full py-10 text-center text-slate-500">{emptyMessage}</p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => open(doc)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
                        ICON_CLASSES[toClubDocument(doc).iconTheme]
                      }`}
                    >
                      <FileText size={16} />
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_BADGE[doc.status]}`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{doc.templateType}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{formatModified(doc.updatedAt)}</span>
                  <div className="flex items-center gap-1.5">
                    <DocxBadgeIcon onClick={(e) => handleDownload(doc, 'docx', e)} />
                    <PdfBadgeIcon onClick={(e) => handleDownload(doc, 'pdf', e)} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* PAGINATION */}
      {!loadError && total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-[12.5px] text-slate-600">
          <span>
            Showing {from}–{to} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              type="button"
              disabled={to >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
