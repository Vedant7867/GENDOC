import React, { useState } from 'react';
import { ClubDocument, DocumentStatus } from '../types';
import { FileText, MoreHorizontal, Eye, Download, CheckCircle, Clock, Edit3, Trash2 } from 'lucide-react';

interface RecentDocumentsCardProps {
  documents: ClubDocument[];
  onSelectDocument: (doc: ClubDocument) => void;
  onViewAllClick: () => void;
  onStatusChange?: (docId: string, newStatus: DocumentStatus) => void;
  onDeleteDocument?: (docId: string) => void;
}

export const RecentDocumentsCard: React.FC<RecentDocumentsCardProps> = ({
  documents,
  onSelectDocument,
  onViewAllClick,
  onStatusChange,
  onDeleteDocument,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center">
            Completed
          </span>
        );
      case 'Needs Review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60 inline-flex items-center">
            Needs Review
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 inline-flex items-center">
            Draft
          </span>
        );
    }
  };

  const getIconStyles = (theme: string) => {
    switch (theme) {
      case 'amber':
        return 'bg-amber-50 text-amber-600';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600';
      case 'purple':
        return 'bg-purple-50 text-purple-600';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-600';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-base font-bold text-slate-800">Recent Documents</h2>
        <button
          type="button"
          onClick={onViewAllClick}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>View All</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>

      {/* Document List */}
      <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 bg-white overflow-visible">
        {documents.map((doc) => {
          const isMenuOpen = activeMenuId === doc.id;
          return (
            <div
              key={doc.id}
              className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 transition-colors group cursor-pointer relative"
              onClick={() => onSelectDocument(doc)}
            >
              {/* Left Column: Icon + Title + Status */}
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getIconStyles(
                    doc.iconTheme
                  )}`}
                >
                  <FileText size={16} />
                </div>

                <div className="flex items-center gap-3 truncate">
                  <span className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                    {doc.title}
                  </span>
                  {getStatusBadge(doc.status)}
                </div>
              </div>

              {/* Right Column: Last edited text + 3-dots menu button */}
              <div
                className="flex items-center gap-3 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {doc.lastEditedText}
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(isMenuOpen ? null : doc.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Document actions"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {/* Actions Dropdown */}
                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-fadeIn text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMenuId(null);
                          onSelectDocument(doc);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 text-left font-medium"
                      >
                        <Eye size={14} className="text-blue-600" />
                        Preview & Edit
                      </button>

                      {onStatusChange && (
                        <>
                          <div className="border-t border-slate-100 my-1" />
                          <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Set Status
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(doc.id, 'Completed');
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <CheckCircle size={13} className="text-emerald-600" />
                            Completed
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(doc.id, 'Needs Review');
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <Clock size={13} className="text-amber-600" />
                            Needs Review
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onStatusChange(doc.id, 'Draft');
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50 text-left"
                          >
                            <Edit3 size={13} className="text-blue-600" />
                            Draft
                          </button>
                        </>
                      )}

                      {onDeleteDocument && (
                        <>
                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteDocument(doc.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-left"
                          >
                            <Trash2 size={13} />
                            Remove Document
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
