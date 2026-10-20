import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Maximize2,
  Pencil,
  FilePlus2,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { GendocStarLogo } from './BrandLogo';
import { api, relativeTime } from '../api/client';
import type { ApiTemplate } from '../api/types';
import type { User } from '../types';
import './documentPage.css';

// --- Custom Brand & Document Header Wave SVGs ---

export const DocumentCornerWave = () => (
  <svg
    viewBox="0 0 180 65"
    fill="none"
    className="absolute top-0 right-0 w-[62%] h-auto pointer-events-none"
    preserveAspectRatio="none"
  >
    <path
      d="M0 0H180V55C145 65 115 35 75 28C35 21 15 30 0 0Z"
      fill="#1E3A8A"
    />
    <path
      d="M35 0H180V42C140 50 110 18 70 15C48 13 38 10 35 0Z"
      fill="#2563EB"
      fillOpacity="0.75"
    />
    <path
      d="M85 0H180V62C155 64 130 48 105 32C92 24 87 10 85 0Z"
      fill="#0B132B"
    />
  </svg>
);

// --- Mini Document Thumbnail Renderer for Grid Cards ---

export const MiniTemplateThumbnail: React.FC<{
  docTitle: string;
  variant: 'proposal-table' | 'letter' | 'bill-table';
}> = ({ docTitle, variant }) => (
  <div className="w-full h-[132px] bg-[#F8FAFC] rounded-xl border border-slate-200/70 p-2.5 flex items-center justify-center overflow-hidden">
    <div className="relative w-full h-full bg-white rounded-lg shadow-sm border border-slate-200/80 px-3 pt-2.5 pb-2 overflow-hidden flex flex-col">
      {/* Top-Right Navy Wave Ribbon */}
      <DocumentCornerWave />

      {/* Top-Left Club Branding */}
      <div className="flex items-center gap-1.5 relative z-10">
        <GendocStarLogo size="sm" />
        <div className="leading-none">
          <div className="text-[7.5px] font-bold text-slate-800">Coding Club</div>
          <div className="text-[6px] text-slate-500 font-medium">SVNIT Surat</div>
        </div>
      </div>

      {/* Document Heading */}
      <div className="text-center font-serif font-bold text-[8px] tracking-wide text-slate-900 mt-2 mb-1.5 relative z-10">
        {docTitle}
      </div>

      {/* Variant Wireframe Body */}
      {variant === 'proposal-table' && (
        <div className="border border-slate-200 rounded-[3px] overflow-hidden text-[5px] flex-1 flex flex-col justify-between">
          {[
            'Event Name',
            'Dates',
            'Venue',
            'Target Audience',
            'Expected Participants',
          ].map((label, idx) => (
            <div
              key={label}
              className={`grid grid-cols-12 items-center px-1.5 py-[2px] ${
                idx !== 4 ? 'border-b border-slate-200/80' : ''
              }`}
            >
              <span className="col-span-5 font-semibold text-slate-700 bg-slate-50/80 truncate">
                {label}
              </span>
              <span className="col-span-7 pl-1">
                <span className="block h-[3px] w-3/4 bg-slate-200 rounded-full" />
              </span>
            </div>
          ))}
        </div>
      )}

      {variant === 'letter' && (
        <div className="space-y-1.5 mt-0.5 px-1 flex-1">
          <div className="space-y-1">
            <div className="h-[3.5px] w-10 bg-slate-300 rounded-full" />
            <div className="h-[3px] w-14 bg-slate-200 rounded-full" />
          </div>
          <div className="space-y-1 pt-1">
            <div className="h-[3px] w-full bg-slate-200 rounded-full" />
            <div className="h-[3px] w-11/12 bg-slate-200 rounded-full" />
            <div className="h-[3px] w-4/5 bg-slate-200 rounded-full" />
          </div>
          <div className="pt-1.5">
            <div className="h-[3.5px] w-12 bg-slate-300 rounded-full" />
          </div>
        </div>
      )}

      {variant === 'bill-table' && (
        <div className="border border-slate-200 rounded-[3px] overflow-hidden flex-1 flex flex-col">
          <div className="grid grid-cols-3 bg-blue-50/70 border-b border-slate-200 px-1.5 py-[2.5px] gap-1">
            <div className="h-[3.5px] w-8 bg-slate-400 rounded-full" />
            <div className="h-[3.5px] w-8 bg-slate-400 rounded-full" />
            <div className="h-[3.5px] w-8 bg-slate-400 rounded-full" />
          </div>
          {[1, 2, 3].map((r) => (
            <div
              key={r}
              className="grid grid-cols-3 border-b last:border-b-0 border-slate-100 px-1.5 py-[3px] gap-1 items-center"
            >
              <div className="h-[3px] w-10 bg-slate-200 rounded-full" />
              <div className="h-[3px] w-8 bg-slate-200 rounded-full" />
              <div className="h-[3px] w-7 bg-slate-300 rounded-full" />
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// --- Template items shown on this page (mapped from GET /api/templates; nothing is bundled) ---

export interface TemplateItem {
  id: string;
  title: string;
  previewHeading: string;
  description: string;
  usedCount: number;
  category: string;
  iconTheme: 'blue' | 'orange' | 'rose' | 'green' | 'purple';
  wireframeVariant: 'proposal-table' | 'letter' | 'bill-table';
  createdBy: string;
  lastUpdated: string;
  version: string;
  formats: string;
  isMostUsed?: boolean;
  isSystem: boolean;
}

const THEME_MAP: Record<string, TemplateItem['iconTheme']> = {
  blue: 'blue', amber: 'orange', orange: 'orange', rose: 'rose', emerald: 'green', green: 'green', purple: 'purple', indigo: 'purple',
};

export const toTemplateItem = (t: ApiTemplate): TemplateItem => ({
  id: t.id,
  title: t.title,
  previewHeading: t.previewHeading,
  description: t.description,
  usedCount: t.usedCount,
  category: t.category,
  iconTheme: THEME_MAP[t.theme] ?? 'blue',
  wireframeVariant: (['proposal-table', 'letter', 'bill-table'].includes(t.wireframeVariant) ? t.wireframeVariant : 'letter') as TemplateItem['wireframeVariant'],
  createdBy: t.createdBy,
  lastUpdated: t.updatedAt ? relativeTime(t.updatedAt) : '—',
  version: t.versionLabel,
  formats: t.formats.join(', '),
  isMostUsed: t.isMostUsed,
  isSystem: t.isSystem,
});

interface TemplatesViewProps {
  searchQuery: string;
  currentUser: User;
  /** Bump to reload the list from the API. */
  reloadToken?: number;
  onUseTemplate: (template: TemplateItem) => void;
  /** Called after a template was created, changed or deleted on the server. */
  onChanged?: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  searchQuery,
  currentUser,
  reloadToken = 0,
  onUseTemplate,
  onChanged,
}) => {
  const isAdmin = currentUser.role === 'Club Admin';
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [modal, setModal] = useState<null | 'create' | 'edit' | 'delete'>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [localReload, setLocalReload] = useState(0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ApiTemplate | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<'idle' | 'loading' | 'error'>('idle');

  // Templates come from MongoDB through GET /api/templates.
  useEffect(() => {
    let cancelled = false;
    setLoadState('loading');
    api.templates
      .list()
      .then((items) => {
        if (cancelled) return;
        setTemplatesList(items.map(toTemplateItem));
        setLoadState('ready');
        setLoadError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadState('error');
        setLoadError(e instanceof Error ? e.message : 'Templates could not be loaded.');
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken, localReload]);

  const categoryTabs = ['All', ...Array.from(new Set(templatesList.map((t) => t.category)))];
  const selectedTemplate: TemplateItem | undefined =
    templatesList.find((t) => t.id === selectedTemplateId) || templatesList[0];

  // Real field list and a real rendering of the selected template (GET /templates/{id} and /preview).
  useEffect(() => {
    if (!selectedTemplate) return;
    let cancelled = false;
    setDetail(null);
    setPreviewHtml(null);
    setPreviewState('loading');
    Promise.all([api.templates.get(selectedTemplate.id), api.templates.preview(selectedTemplate.id)])
      .then(([d, p]) => {
        if (cancelled) return;
        setDetail(d);
        setPreviewHtml(p.html);
        setPreviewState('idle');
      })
      .catch(() => {
        if (!cancelled) setPreviewState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTemplate?.id, reloadToken, localReload]);

  const filteredTemplates = templatesList.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    const matchesCat = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const flash = (m: string) => {
    setActionNotice(m);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const getIconBadgeStyle = (theme: TemplateItem['iconTheme']) => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200/60';
      case 'orange':
        return 'bg-amber-50 text-amber-600 border-amber-200/60';
      case 'rose':
        return 'bg-rose-50 text-rose-600 border-rose-200/60';
      case 'green':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200/60';
    }
  };

  const openModal = (kind: 'create' | 'edit' | 'delete') => {
    setActionError(null);
    if (kind === 'edit' && selectedTemplate) {
      setFormTitle(selectedTemplate.title);
      setFormCategory(selectedTemplate.category);
      setFormDesc(selectedTemplate.description);
    } else {
      setFormTitle('');
      setFormCategory(selectedTemplate?.category ?? '');
      setFormDesc('');
    }
    setModal(kind);
  };

  // Create = a copy of the selected template under a new name (copies its layout and fields; Club Admin only).
  // Edit = rename / re-categorise / re-describe. Delete = soft delete. Existing documents are never affected.
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !formTitle.trim()) return;
    setSaving(true);
    setActionError(null);
    try {
      if (modal === 'create') {
        const copy = await api.templates.duplicate(selectedTemplate.id);
        const saved = await api.templates.patch(copy.id, {
          title: formTitle.trim(), category: formCategory.trim() || copy.category, description: formDesc.trim() || copy.description,
        });
        setSelectedTemplateId(saved.id);
        flash(`Template "${saved.title}" was created.`);
      } else if (modal === 'edit') {
        await api.templates.patch(selectedTemplate.id, {
          title: formTitle.trim(), category: formCategory.trim(), description: formDesc.trim(),
        });
        flash('Template details were saved.');
      }
      setModal(null);
      setLocalReload((n) => n + 1);
      onChanged?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The change could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setActionError(null);
    try {
      await api.templates.remove(selectedTemplate.id);
      setModal(null);
      setSelectedTemplateId(null);
      flash(`Template "${selectedTemplate.title}" was deleted. Documents made from it are not affected.`);
      setLocalReload((n) => n + 1);
      onChanged?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'The template could not be deleted.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header & + Add Template Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Templates
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            Use ready-made templates or create your own. All templates follow club branding.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => openModal('create')}
            title="Create a new template from the selected one"
            className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span>Add Template</span>
          </button>
        )}
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-900 underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {actionError && !modal && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      {loadState === 'loading' && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-10 justify-center">
          <Loader2 size={18} className="animate-spin" /> Loading templates…
        </div>
      )}
      {loadState === 'error' && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center justify-between gap-3">
          <span className="flex items-center gap-2"><AlertCircle size={16} /> {loadError}</span>
          <button type="button" onClick={() => setLocalReload((n) => n + 1)} className="px-3 py-1.5 bg-white border border-red-200 rounded-lg font-semibold text-xs">Try again</button>
        </div>
      )}
      {loadState === 'ready' && templatesList.length === 0 && (
        <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-sm text-slate-500">
          No templates yet. {isAdmin ? 'Use "Add Template" to create one.' : 'A Club Admin can add templates here.'}
        </div>
      )}

      {/* MAIN 2-COLUMN WORKSPACE: LEFT FILTER+GRID | RIGHT LIVE INSPECTOR */}
      {loadState === 'ready' && selectedTemplate && (
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* LEFT COLUMN: Filter Tabs + 3x2 Cards Grid */}
        <div className="flex-1 min-w-0 w-full">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {categoryTabs.map((tab) => {
              const isActive = activeCategory === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveCategory(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C7DDFD] text-[#1D4ED8] shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <p className="text-sm text-slate-500 py-6">No templates match your search.</p>
          )}

          {/* Grid of Template Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const isSelected = template.id === selectedTemplateId;
              return (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`bg-white rounded-2xl p-3.5 cursor-pointer transition-all flex flex-col justify-between select-none ${
                    isSelected
                      ? 'border-2 border-[#3B82F6] shadow-sm ring-2 ring-blue-500/10'
                      : 'border border-slate-200/80 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  {/* Top Miniature Document Preview */}
                  <MiniTemplateThumbnail
                    docTitle={template.previewHeading}
                    variant={template.wireframeVariant}
                  />

                  {/* Card Body: Icon + Title + Description */}
                  <div className="mt-3.5 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getIconBadgeStyle(
                          template.iconTheme
                        )}`}
                      >
                        <FileText size={15} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-bold text-slate-900 truncate">
                          {template.title}
                        </h3>
                        <p className="text-[11.5px] text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplateId(template.id);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-0.5 shrink-0"
                      title="Template Options"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </div>

                  {/* Card Footer: Usage Counter */}
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11.5px] font-medium text-slate-500 pl-9">
                    Used {template.usedCount} times
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Template Preview & Inspector Panel */}
        <aside className="w-full xl:w-[360px] shrink-0 bg-white rounded-2xl border border-slate-200/85 shadow-sm p-4">
          {/* Top Sort / Filter Controls inside Inspector */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              className="flex-1 bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-1.5 text-[12.5px] font-medium text-slate-700 flex items-center justify-between hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="text-slate-400" size={14} />
                <span>Most Used</span>
              </span>
              <ChevronDown className="text-slate-400" size={14} />
            </button>

            <button
              type="button"
              onClick={() => openModal('create')}
              disabled={!isAdmin}
              title={isAdmin ? 'Create a new template from the selected one' : 'Only a Club Admin can add templates'}
              className="p-2 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FilePlus2 size={16} />
            </button>
          </div>

          {/* Real rendering of the stored template (POST /templates/{id}/preview, example values) */}
          <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/70 p-3">
            <div className="relative bg-white rounded-lg shadow-sm border border-slate-200/80 px-4 py-3 overflow-hidden h-72 overflow-y-auto">
              {previewState === 'loading' && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" /> Loading preview…</div>}
              {previewState === 'error' && <p className="text-xs text-red-600">The preview could not be loaded.</p>}
              {previewHtml && <div className="gd-page" style={{ ['--gd-font' as string]: '8.5px' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />}
            </div>
            <div className="flex items-center justify-between mt-2.5 px-1 text-xs text-slate-500">
              <span>Example values shown</span>
              <button type="button" onClick={() => setIsFullscreenModalOpen(true)} title="Expand Preview" className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer">
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          {/* Selected Template Info & Tags */}
          <div className="mt-3.5">
            <h3 className="text-[16px] font-bold text-slate-900">{selectedTemplate.title}</h3>
            <p className="text-[12px] text-slate-500 mt-0.5">{selectedTemplate.description}</p>

            <div className="flex items-center gap-2 mt-2.5">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                {selectedTemplate.category}
              </span>
              {selectedTemplate.isMostUsed && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  Most Used
                </span>
              )}
            </div>
          </div>

          {detail?.fields && (
            <div className="mt-3.5">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">
                Information needed ({detail.fields.filter((f) => f.required).length} required)
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {detail.fields.filter((f) => f.required).map((f) => (
                  <span key={f.key} title={f.official ? 'Official detail: comes from you, never from the AI' : undefined}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                    {f.label}{f.official ? ' ·official' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 mt-4`}>
            <button
              type="button"
              onClick={() => onUseTemplate(selectedTemplate)}
              className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[12.5px] font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <FileText size={14} />
              <span>Use Template</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => openModal('edit')}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-[12.5px] font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil size={14} />
                <span>Edit Details</span>
              </button>
            )}
          </div>
          {isAdmin && (
            <button type="button" onClick={() => openModal('delete')} className="mt-2 w-full text-[12px] font-semibold text-red-600 hover:bg-red-50 rounded-xl py-2 flex items-center justify-center gap-1.5">
              <Trash2 size={13} /> Delete template
            </button>
          )}

          {/* Metadata Table */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Created by</span>
              <span className="font-semibold text-slate-800">{selectedTemplate.createdBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last updated</span>
              <span className="font-semibold text-slate-800">{selectedTemplate.lastUpdated}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Version</span>
              <span className="font-semibold text-slate-800">{selectedTemplate.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">File format</span>
              <span className="font-semibold text-slate-800">{selectedTemplate.formats}</span>
            </div>
          </div>
        </aside>
      </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col">
            <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <GendocStarLogo size="sm" />
                <h3 className="font-bold text-base">{selectedTemplate.title} — Full A4 Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreenModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 bg-slate-100 overflow-y-auto max-h-[75vh]">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 p-8">
                {previewHtml ? <div className="gd-page" style={{ ['--gd-font' as string]: '13px' }} dangerouslySetInnerHTML={{ __html: previewHtml }} /> : <p className="text-sm text-slate-500">Preview unavailable.</p>}
              </div>
            </div>

            <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreenModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFullscreenModalOpen(false);
                  onUseTemplate(selectedTemplate);
                }}
                className="px-4 py-2 bg-[#1D63DC] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
              >
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT / DELETE TEMPLATE (Club Admin) */}
      {modal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div role="dialog" aria-modal="true" className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilePlus2 size={18} className="text-blue-400" />
                <h3 className="font-bold text-base">
                  {modal === 'create' ? 'Add a new template' : modal === 'edit' ? 'Edit template details' : 'Delete template'}
                </h3>
              </div>
              <button type="button" onClick={() => !saving && setModal(null)} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {modal === 'delete' ? (
              <div className="p-6 space-y-4 text-sm">
                <p>Delete <strong>{selectedTemplate.title}</strong>? It disappears from the Templates page. Documents already created from it are kept.</p>
                {actionError && <p role="alert" className="text-red-600 text-xs">{actionError}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" disabled={saving} onClick={() => setModal(null)} className="px-4 py-2 text-slate-600 font-semibold text-xs">Cancel</button>
                  <button type="button" disabled={saving} onClick={() => void handleDelete()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs disabled:opacity-60">
                    {saving ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmitModal(e)} className="p-6 space-y-4 text-xs">
                {modal === 'create' && (
                  <p className="text-slate-500">
                    The new template starts as a copy of <strong>{selectedTemplate.title}</strong> (same layout and fields) so it is ready to use.
                  </p>
                )}
                <div>
                  <label htmlFor="tpl-title" className="block font-semibold text-slate-700 mb-1">Template title</label>
                  <input id="tpl-title" type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required maxLength={80}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label htmlFor="tpl-cat" className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input id="tpl-cat" list="tpl-cats" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required maxLength={40}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500" />
                  <datalist id="tpl-cats">{categoryTabs.filter((c) => c !== 'All').map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label htmlFor="tpl-desc" className="block font-semibold text-slate-700 mb-1">Description</label>
                  <textarea id="tpl-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} maxLength={400}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                {actionError && <p role="alert" className="text-red-600">{actionError}</p>}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button type="button" disabled={saving} onClick={() => setModal(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1D63DC] hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-60">
                    {saving ? 'Saving…' : modal === 'create' ? 'Create template' : 'Save changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
