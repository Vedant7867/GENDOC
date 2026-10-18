import React, { useState } from 'react';
import {
  FileText,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  MoreVertical,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { ClubDocument, DocumentStatus } from '../types';

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

// --- Dataset Matching Specification 1:1 ---

export interface FolderCategory {
  id: number;
  title: string;
  count: string;
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
    count: '12 documents',
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
    count: '8 documents',
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
    count: '10 documents',
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
    count: '6 documents',
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
    title: 'Participation Certs',
    count: '7 documents',
    bgClass: 'bg-[#FFF0F0]',
    borderClass: 'border-rose-100/80',
    badgeBg: 'bg-[#FECDD3]',
    badgeText: 'text-[#9F1239]',
    folderBack: '#E11D48',
    folderFront: '#FDA4AF',
    filterType: 'Participation Cert',
  },
];

export interface DocumentRow {
  id: string;
  name: string;
  iconTheme: 'blue' | 'orange' | 'green' | 'purple';
  type: 'Permission Letter' | 'Event Proposal' | 'Budget Estimate' | 'Event Notice';
  event: string;
  lastModified: string;
  status: 'Needs Review' | 'Approved' | 'Draft';
  formats: ('DOCX' | 'PDF')[];
}

export const DOCUMENTS_DATA: DocumentRow[] = [
  {
    id: '1',
    name: 'Web Development Workshop - Permission Letter',
    iconTheme: 'blue',
    type: 'Permission Letter',
    event: 'Web Development Workshop',
    lastModified: '10 Oct 2026, 4:21 PM',
    status: 'Needs Review',
    formats: ['DOCX', 'PDF'],
  },
  {
    id: '2',
    name: 'Tech Fest 2026 - Prize Money Proposal',
    iconTheme: 'orange',
    type: 'Event Proposal',
    event: 'Tech Fest 2026',
    lastModified: '8 Oct 2026, 1:12 PM',
    status: 'Approved',
    formats: ['DOCX', 'PDF'],
  },
  {
    id: '3',
    name: 'AI Workshop - Event Proposal',
    iconTheme: 'green',
    type: 'Event Proposal',
    event: 'AI Workshop',
    lastModified: '5 Oct 2026, 6:45 PM',
    status: 'Approved',
    formats: ['DOCX', 'PDF'],
  },
  {
    id: '4',
    name: 'Cultural Event - Budget Estimate',
    iconTheme: 'purple',
    type: 'Budget Estimate',
    event: 'Cultural Event 2026',
    lastModified: '2 Oct 2026, 11:20 AM',
    status: 'Draft',
    formats: ['DOCX'],
  },
  {
    id: '5',
    name: 'Coding Bootcamp - Event Notice',
    iconTheme: 'green',
    type: 'Event Notice',
    event: 'Coding Bootcamp',
    lastModified: '28 Sept 2026, 3:10 PM',
    status: 'Approved',
    formats: ['DOCX', 'PDF'],
  },
  {
    id: '6',
    name: 'ML Seminar - Permission Letter',
    iconTheme: 'blue',
    type: 'Permission Letter',
    event: 'ML Seminar',
    lastModified: '20 Sept 2026, 2:05 PM',
    status: 'Needs Review',
    formats: ['DOCX'],
  },
  {
    id: '7',
    name: 'Hackathon 2026 - Budget Estimate',
    iconTheme: 'purple',
    type: 'Budget Estimate',
    event: 'Hackathon 2026',
    lastModified: '18 Sept 2026, 5:40 PM',
    status: 'Draft',
    formats: ['DOCX'],
  },
  {
    id: '8',
    name: 'Design Workshop - Event Notice',
    iconTheme: 'green',
    type: 'Event Notice',
    event: 'Design Workshop',
    lastModified: '15 Sept 2026, 12:18 PM',
    status: 'Approved',
    formats: ['DOCX', 'PDF'],
  },
];

interface DocumentsViewProps {
  searchQuery: string;
  onGenerateDocument: () => void;
  onPreviewDocument: (doc: ClubDocument) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  searchQuery,
  onGenerateDocument,
  onPreviewDocument,
}) => {
  const [selectedFolderType, setSelectedFolderType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortOrder, setSortOrder] = useState<'recent' | 'name'>('recent');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getDocIconClasses = (theme: DocumentRow['iconTheme']) => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-50 text-blue-600 border-blue-200/60';
      case 'orange':
        return 'bg-amber-50 text-amber-600 border-amber-200/60';
      case 'green':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200/60';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-200/60';
    }
  };

  const getTypeBadgeClasses = (type: DocumentRow['type']) => {
    switch (type) {
      case 'Permission Letter':
        return 'bg-[#CBD5E1]/80 text-slate-800';
      case 'Event Proposal':
        return 'bg-[#93C5FD]/85 text-slate-900';
      case 'Budget Estimate':
        return 'bg-[#C4B5FD]/85 text-slate-900';
      case 'Event Notice':
        return 'bg-[#A7F3D0]/90 text-slate-900';
    }
  };

  const getStatusBadgeClasses = (status: DocumentRow['status']) => {
    switch (status) {
      case 'Needs Review':
        return 'bg-[#FDE08D] text-slate-900';
      case 'Approved':
        return 'bg-[#52D681] text-slate-900';
      case 'Draft':
        return 'bg-[#64748B] text-white';
    }
  };

  const filteredDocuments = DOCUMENTS_DATA.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolderType ? doc.type === selectedFolderType : true;
    return matchesSearch && matchesFolder;
  });

  const handleRowClick = (doc: DocumentRow) => {
    // Map to ClubDocument interface for preview
    const mapped: ClubDocument = {
      id: doc.id,
      title: doc.name,
      templateType: doc.type,
      status: doc.status === 'Approved' ? 'Completed' : doc.status,
      lastEditedText: doc.lastModified,
      lastEditedDate: new Date().toISOString(),
      iconTheme: doc.iconTheme === 'orange' ? 'amber' : doc.iconTheme === 'green' ? 'emerald' : doc.iconTheme,
      venue: 'Seminar Hall, SVNIT Surat',
      eventDate: 'October 2026',
      expectedAttendance: '120 students',
      budgetTotal: doc.type === 'Budget Estimate' ? '₹24,500' : 'Approved Fund',
      summary: `Official ${doc.type} record for ${doc.event} under the ACM NIT Surat student committee charter.`,
      organizer: 'Kristal Patel (Tech Lead)',
    };
    onPreviewDocument(mapped);
  };

  const handleDownloadFormat = (doc: DocumentRow, format: 'DOCX' | 'PDF', e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `===============================================================
SARDAR VALLABHBHAI NATIONAL INSTITUTE OF TECHNOLOGY, SURAT
ACM STUDENT CHAPTER (GENDOC AUTOMATED DOCUMENT ENGINE)
===============================================================
DOCUMENT: ${doc.name}
TYPE: ${doc.type}
EVENT: ${doc.event}
LAST MODIFIED: ${doc.lastModified}
STATUS: ${doc.status}
FORMAT: ${format}

AUTHORIZED SIGNATORIES:
1. Faculty Advisor, ACM SVNIT Chapter
2. Lead Coordinator (Kristal Patel)
===============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page Title & Primary CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Documents
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            Your generated documents, organised by type.
          </p>
        </div>

        <button
          type="button"
          onClick={onGenerateDocument}
          className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>Generate Document</span>
        </button>
      </div>

      {/* 5 FOLDER CATEGORY CARDS CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {FOLDER_CATEGORIES.map((folder) => {
            const isSelected = selectedFolderType === folder.filterType;
            return (
              <div
                key={folder.id}
                onClick={() =>
                  setSelectedFolderType(isSelected ? null : folder.filterType)
                }
                className={`${folder.bgClass} ${folder.borderClass} ${
                  isSelected ? 'ring-2 ring-blue-500 shadow-sm' : ''
                } border rounded-xl p-4 flex flex-col justify-between min-h-[116px] cursor-pointer hover:shadow-sm transition-all select-none`}
              >
                {/* Top Row: 2-Tone Folder Icon + Number Badge */}
                <div className="flex items-start justify-between">
                  <TwoToneFolderIcon backColor={folder.folderBack} frontColor={folder.folderFront} />
                  <span
                    className={`w-6 h-6 rounded-full ${folder.badgeBg} ${folder.badgeText} text-[12px] font-bold flex items-center justify-center`}
                  >
                    {folder.id}
                  </span>
                </div>

                {/* Bottom Row: Title, Count, Chevron */}
                <div className="flex items-end justify-between mt-3.5">
                  <div>
                    <div className="text-[14px] font-bold text-slate-900 leading-snug">
                      {folder.title}
                    </div>
                    <div className="text-[12px] text-slate-600 font-medium mt-0.5">
                      {folder.count}
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
          {/* List / Grid Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#E2E8F0]/80 text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#E2E8F0]/80 text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {/* Sort Dropdown */}
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

      {/* ALL DOCUMENTS LIST TABLE */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[12px] font-semibold text-slate-600 bg-[#FAFBFD]">
                <th className="py-3.5 pl-5 pr-3 w-[31%]">Name</th>
                <th className="py-3.5 px-3 w-[16%]">Type</th>
                <th className="py-3.5 px-3 w-[18%]">Event</th>
                <th className="py-3.5 px-3 w-[15%]">Last Modified</th>
                <th className="py-3.5 px-3 w-[11%]">Status</th>
                <th className="py-3.5 px-3 w-[7%]">Formats</th>
                <th className="py-3.5 pl-2 pr-5 text-right w-[2%]">
                  <MoreHorizontal className="inline text-slate-500" size={16} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => handleRowClick(doc)}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  {/* Name Column */}
                  <td className="py-3 pl-5 pr-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${getDocIconClasses(
                          doc.iconTheme
                        )}`}
                      >
                        <FileText size={15} />
                      </div>
                      <span className="font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                        {doc.name}
                      </span>
                    </div>
                  </td>

                  {/* Type Badge Column */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold ${getTypeBadgeClasses(
                        doc.type
                      )}`}
                    >
                      {doc.type}
                    </span>
                  </td>

                  {/* Event Column */}
                  <td className="py-3 px-3 text-slate-700 font-medium">
                    {doc.event}
                  </td>

                  {/* Last Modified Column */}
                  <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                    {doc.lastModified}
                  </td>

                  {/* Status Badge Column */}
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold ${getStatusBadgeClasses(
                        doc.status
                      )}`}
                    >
                      {doc.status}
                    </span>
                  </td>

                  {/* Formats Column (DOCX / PDF Mini Icons) */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {doc.formats.includes('DOCX') && (
                        <DocxBadgeIcon onClick={(e) => handleDownloadFormat(doc, 'DOCX', e)} />
                      )}
                      {doc.formats.includes('PDF') && (
                        <PdfBadgeIcon onClick={(e) => handleDownloadFormat(doc, 'PDF', e)} />
                      )}
                    </div>
                  </td>

                  {/* Three-dot Action Menu */}
                  <td className="py-3 pl-2 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                        className="p-1 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === doc.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 text-left text-xs animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              handleRowClick(doc);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50 font-medium"
                          >
                            Preview Document
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              setActiveMenuId(null);
                              handleDownloadFormat(doc, 'DOCX', e);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Download DOCX
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              setActiveMenuId(null);
                              handleDownloadFormat(doc, 'PDF', e);
                            }}
                            className="w-full px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            Download PDF
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              onClick={() => handleRowClick(doc)}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getDocIconClasses(
                      doc.iconTheme
                    )}`}
                  >
                    <FileText size={16} />
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeClasses(
                      doc.status
                    )}`}
                  >
                    {doc.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                  {doc.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{doc.event}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">{doc.lastModified}</span>
                <div className="flex items-center gap-1.5">
                  {doc.formats.includes('DOCX') && (
                    <DocxBadgeIcon onClick={(e) => handleDownloadFormat(doc, 'DOCX', e)} />
                  )}
                  {doc.formats.includes('PDF') && (
                    <PdfBadgeIcon onClick={(e) => handleDownloadFormat(doc, 'PDF', e)} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
