import React, { useState } from 'react';
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
} from 'lucide-react';
import { GendocStarLogo } from './BrandLogo';

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

// --- Dataset Matching Specification 1:1 ---

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
}

export const TEMPLATES_DATA: TemplateItem[] = [
  {
    id: 'event-proposal',
    title: 'Event Proposal',
    previewHeading: 'EVENT PROPOSAL',
    description: 'For workshops, seminars and general events.',
    usedCount: 24,
    category: 'Permission Docs',
    iconTheme: 'blue',
    wireframeVariant: 'proposal-table',
    createdBy: 'Club Admin',
    lastUpdated: '10 Oct 2026',
    version: 'v1.2',
    formats: 'DOCX, PDF',
    isMostUsed: true,
  },
  {
    id: 'permission-letter',
    title: 'Permission Letter',
    previewHeading: 'PERMISSION LETTER',
    description: 'To request venue, resources and other permissions.',
    usedCount: 18,
    category: 'Permission Docs',
    iconTheme: 'orange',
    wireframeVariant: 'letter',
    createdBy: 'Club Admin',
    lastUpdated: '08 Oct 2026',
    version: 'v1.4',
    formats: 'DOCX, PDF',
    isMostUsed: true,
  },
  {
    id: 'prize-money',
    title: 'Prize Money Proposal',
    previewHeading: 'PRIZE MONEY PROPOSAL',
    description: 'For requesting prize money and budget approval.',
    usedCount: 12,
    category: 'Prize Money',
    iconTheme: 'rose',
    wireframeVariant: 'letter',
    createdBy: 'Club Admin',
    lastUpdated: '04 Oct 2026',
    version: 'v1.1',
    formats: 'DOCX, PDF',
  },
  {
    id: 'submitted-document',
    title: 'Submitted Document',
    previewHeading: 'SUBMITTED DOCUMENT',
    description: 'For final submission to authorities/committees.',
    usedCount: 10,
    category: 'Submitted',
    iconTheme: 'green',
    wireframeVariant: 'letter',
    createdBy: 'Club Admin',
    lastUpdated: '29 Sept 2026',
    version: 'v1.0',
    formats: 'DOCX, PDF',
  },
  {
    id: 'bill-summary',
    title: 'Bill Summary',
    previewHeading: 'BILL SUMMARY',
    description: 'Summary of expenses for the event.',
    usedCount: 8,
    category: 'Bill Summary',
    iconTheme: 'purple',
    wireframeVariant: 'bill-table',
    createdBy: 'Club Admin',
    lastUpdated: '22 Sept 2026',
    version: 'v1.3',
    formats: 'DOCX, PDF',
  },
  {
    id: 'bill-certificate',
    title: 'Bill Certificate',
    previewHeading: 'BILL CERTIFICATE',
    description: 'For reimbursement and financial records.',
    usedCount: 7,
    category: 'Bill Certificate',
    iconTheme: 'rose',
    wireframeVariant: 'bill-table',
    createdBy: 'Club Admin',
    lastUpdated: '15 Sept 2026',
    version: 'v1.0',
    formats: 'DOCX, PDF',
  },
];

export const CATEGORY_TABS = [
  'All',
  'Permission Docs',
  'Prize Money',
  'Submitted',
  'Bill Summary',
  'Bill Certificate',
];

interface TemplatesViewProps {
  searchQuery: string;
  onUseTemplate: (template: TemplateItem) => void;
  onAddTemplate?: () => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  searchQuery,
  onUseTemplate,
  onAddTemplate,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedTemplateId, setSelectedTemplateId] = useState('event-proposal');
  const [previewPage, setPreviewPage] = useState(1);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Permission Docs');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>(TEMPLATES_DATA);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedTemplate =
    templatesList.find((t) => t.id === selectedTemplateId) || templatesList[0];

  const filteredTemplates = templatesList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

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

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateTitle.trim()) return;

    const newTpl: TemplateItem = {
      id: `custom-${Date.now()}`,
      title: newTemplateTitle.trim(),
      previewHeading: newTemplateTitle.trim().toUpperCase(),
      description: newTemplateDesc.trim() || 'Custom club document template for SVNIT.',
      usedCount: 1,
      category: newTemplateCategory,
      iconTheme: 'blue',
      wireframeVariant: 'proposal-table',
      createdBy: 'Kristal Patel (Club Member)',
      lastUpdated: 'Just now',
      version: 'v1.0',
      formats: 'DOCX, PDF',
    };

    setTemplatesList([newTpl, ...templatesList]);
    setSelectedTemplateId(newTpl.id);
    setIsAddModalOpen(false);
    setNewTemplateTitle('');
    setNewTemplateDesc('');
    setActionNotice(`Template "${newTpl.title}" added successfully!`);
    setTimeout(() => setActionNotice(null), 3000);
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

        <button
          type="button"
          onClick={() => {
            if (onAddTemplate) onAddTemplate();
            setIsAddModalOpen(true);
          }}
          className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>Add Template</span>
        </button>
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

      {/* MAIN 2-COLUMN WORKSPACE: LEFT FILTER+GRID | RIGHT LIVE INSPECTOR */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* LEFT COLUMN: Filter Tabs + 3x2 Cards Grid */}
        <div className="flex-1 min-w-0 w-full">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {CATEGORY_TABS.map((tab) => {
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

          {/* 3x2 Grid of Template Cards */}
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
              onClick={() => setIsAddModalOpen(true)}
              title="Upload / Import Template"
              className="p-2 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <FilePlus2 size={16} />
            </button>
          </div>

          {/* A4 Document Sheet Preview Container */}
          <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/70 p-3">
            <div className="relative bg-white rounded-lg shadow-sm border border-slate-200/80 px-5 pt-4 pb-5 overflow-hidden">
              {/* Top-Right Layered Wave Ribbon */}
              <DocumentCornerWave />

              {/* Top-Left Club Header */}
              <div className="flex items-center gap-2 relative z-10">
                <GendocStarLogo size="sm" />
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-slate-900">Coding Club</div>
                  <div className="text-[9px] text-slate-500 font-medium">SVNIT Surat</div>
                </div>
              </div>

              {/* Document Formal Title */}
              <h4 className="text-center font-serif font-bold text-[13px] tracking-wide text-slate-900 mt-4 mb-3 relative z-10">
                {selectedTemplate.previewHeading}
              </h4>

              {/* Structured Dynamic Placeholders Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden text-[9.5px]">
                {[
                  { label: 'Event Name', value: '{{event_name}}' },
                  { label: 'Dates', value: '{{dates}}' },
                  { label: 'Venue', value: '{{venue}}' },
                  { label: 'Target Audience', value: '{{target_audience}}' },
                  {
                    label: 'Expected Participants',
                    value: '{{expected_participants}}',
                  },
                  {
                    label: 'Organizing Club',
                    value: 'Coding Club, SVNIT Surat',
                  },
                ].map((row, index) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-12 items-center ${
                      index !== 5 ? 'border-b border-slate-200/80' : ''
                    }`}
                  >
                    <div className="col-span-5 bg-[#F8FAFC] px-2 py-1 font-semibold text-slate-800 border-r border-slate-200/80 truncate">
                      {row.label}
                    </div>
                    <div className="col-span-7 px-2 py-1 text-slate-500 font-mono text-[8.5px] truncate">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 1. Objectives */}
              <div className="mt-3">
                <div className="font-serif font-bold text-[10.5px] text-slate-900 mb-1">
                  1. Objectives
                </div>
                <ul className="space-y-1 pl-3 text-[8.5px] text-slate-500 font-mono">
                  <li className="flex items-center gap-2">
                    <span>• {'{{objective_1}}'}</span>
                    <span className="h-1.5 w-16 bg-slate-200 rounded-full inline-block" />
                  </li>
                  <li className="flex items-center gap-2">
                    <span>• {'{{objective_2}}'}</span>
                    <span className="h-1.5 w-14 bg-slate-200 rounded-full inline-block" />
                  </li>
                  <li className="flex items-center gap-2">
                    <span>• {'{{objective_3}}'}</span>
                    <span className="h-1.5 w-12 bg-slate-200 rounded-full inline-block" />
                  </li>
                </ul>
              </div>
            </div>

            {/* Preview Pagination & Fullscreen Bar */}
            <div className="flex items-center justify-between mt-2.5 px-1 text-xs text-slate-600">
              <div className="w-5" />
              <div className="flex items-center gap-3 font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                  className="p-0.5 hover:text-slate-900 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11.5px] font-semibold text-slate-700">
                  {previewPage} / 3
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewPage((p) => Math.min(3, p + 1))}
                  className="p-0.5 hover:text-slate-900 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreenModalOpen(true)}
                title="Expand Preview"
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
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

          {/* Action Buttons: Use Template | Edit Template */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => onUseTemplate(selectedTemplate)}
              className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[12.5px] font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <FileText size={14} />
              <span>Use Template</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActionNotice(`Opening editor for ${selectedTemplate.title}...`);
                setTimeout(() => setActionNotice(null), 2500);
              }}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-[12.5px] font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              <span>Edit Template</span>
            </button>
          </div>

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

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenModalOpen && (
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
              <div className="relative bg-white rounded-xl shadow-md border border-slate-200 p-8 text-slate-800 leading-relaxed overflow-hidden">
                <DocumentCornerWave />
                <div className="flex items-center gap-2 mb-4">
                  <GendocStarLogo size="md" />
                  <div>
                    <h2 className="text-sm font-bold text-slate-950 uppercase">Coding Club</h2>
                    <p className="text-xs text-blue-700 font-semibold">SVNIT Surat Student Chapter</p>
                  </div>
                </div>

                <h1 className="text-center font-serif font-bold text-lg text-slate-900 underline underline-offset-4 my-4">
                  {selectedTemplate.previewHeading}
                </h1>

                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs my-4">
                  {[
                    { label: 'Event Name', value: '{{event_name}}' },
                    { label: 'Dates & Duration', value: '{{dates}}' },
                    { label: 'Venue Allocation', value: '{{venue}}' },
                    { label: 'Target Audience', value: '{{target_audience}}' },
                    { label: 'Expected Participants', value: '{{expected_participants}}' },
                    { label: 'Organizing Body', value: 'Coding Club, SVNIT Surat' },
                  ].map((row, i) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-12 ${i !== 5 ? 'border-b border-slate-200' : ''}`}
                    >
                      <div className="col-span-5 bg-slate-50 px-3 py-2 font-semibold text-slate-800 border-r border-slate-200">
                        {row.label}
                      </div>
                      <div className="col-span-7 px-3 py-2 font-mono text-slate-600 bg-white">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-2 text-xs">
                  <h3 className="font-serif font-bold text-sm text-slate-900">1. Objectives & Scope</h3>
                  <p className="font-mono text-slate-600 pl-3">• {'{{objective_1}}'}</p>
                  <p className="font-mono text-slate-600 pl-3">• {'{{objective_2}}'}</p>
                  <p className="font-mono text-slate-600 pl-3">• {'{{objective_3}}'}</p>
                </div>
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

      {/* ADD TEMPLATE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FilePlus2 size={18} className="text-blue-400" />
                <h3 className="font-bold text-base">Add New Club Template</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Template Title
                </label>
                <input
                  type="text"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="e.g. Workshop Sponsorship Proposal"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Permission Docs">Permission Docs</option>
                  <option value="Prize Money">Prize Money</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Bill Summary">Bill Summary</option>
                  <option value="Bill Certificate">Bill Certificate</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Brief summary of what this template is used for..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D63DC] hover:bg-blue-700 text-white font-semibold rounded-xl"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
