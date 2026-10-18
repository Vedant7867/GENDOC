import React, { useState } from 'react';
import { ClubDocument, DocumentStatus, DocumentTemplate, NavTab, User } from '../types';
import {
  Calendar,
  FileText,
  LayoutGrid,
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Edit3,
  Award,
  Users,
  Building,
  Save,
} from 'lucide-react';

interface TabViewProps {
  activeTab: NavTab;
  documents: ClubDocument[];
  templates: DocumentTemplate[];
  currentUser: User;
  onSelectDocument: (doc: ClubDocument) => void;
  onSelectTemplate: (template: DocumentTemplate) => void;
  onOpenNewDoc: () => void;
}

export const OtherTabViews: React.FC<TabViewProps> = ({
  activeTab,
  documents,
  templates,
  currentUser,
  onSelectDocument,
  onSelectTemplate,
  onOpenNewDoc,
}) => {
  const [docFilter, setDocFilter] = useState<'All' | DocumentStatus>('All');
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  if (activeTab === 'Events') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ACM Chapter Events</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Scheduled events and associated administrative document sets.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenNewDoc}
            className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus size={16} />
            <span>New Event Document</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Web Development Workshop 2026',
              date: '14–15 October 2026',
              venue: 'Seminar Hall, Computer Dept.',
              status: 'Approved',
              attendees: '120 Registered',
              docsCount: 3,
            },
            {
              title: 'ACM Annual Tech Fest & Hackathon',
              date: '24–26 November 2026',
              venue: 'Central Auditorium, SVNIT',
              status: 'In Review',
              attendees: '850+ Projected',
              docsCount: 5,
            },
            {
              title: 'Competitive Programming BootCamp',
              date: '08–10 December 2026',
              venue: 'Advanced Computing Lab',
              status: 'Planning',
              attendees: '90 Enrolled',
              docsCount: 2,
            },
          ].map((event, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 hover:border-blue-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {event.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">{event.docsCount} Documents</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building size={14} className="text-slate-400" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>{event.attendees}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'Documents') {
    const filteredDocs =
      docFilter === 'All' ? documents : documents.filter((d) => d.status === docFilter);

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All Club Documents</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete archive of GENDOC documents for ACM NIT Surat.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['All', 'Completed', 'Needs Review', 'Draft'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDocFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  docFilter === filter
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc)}
              className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.summary?.slice(0, 90)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    doc.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : doc.status === 'Needs Review'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {doc.status}
                </span>
                <span className="text-xs text-slate-400">{doc.lastEditedText}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'Templates') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Document Templates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pre-approved official templates for SVNIT administration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {tpl.iconName === 'Award' ? <Award size={18} /> : <FileText size={18} />}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {tpl.category}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{tpl.title}</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tpl.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
                <span>Start with this template</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === 'Club Settings') {
    return (
      <div className="space-y-6 max-w-3xl animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Club & Chapter Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Institutional parameters and default signatory information.
          </p>
        </div>

        {savedSettingsSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle size={15} />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
            Chapter Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Chapter Name
              </label>
              <input
                type="text"
                defaultValue="ACM SVNIT Student Chapter"
                className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Parent Institute
              </label>
              <input
                type="text"
                defaultValue="Sardar Vallabhbhai National Institute of Technology, Surat"
                className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Faculty Advisor Name
              </label>
              <input
                type="text"
                defaultValue="Dr. M. A. Zaveri"
                className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Chapter Email
              </label>
              <input
                type="email"
                defaultValue="acm@coed.svnit.ac.in"
                className="w-full text-xs font-medium text-slate-800 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSavedSettingsSuccess(true);
                setTimeout(() => setSavedSettingsSuccess(false), 2500);
              }}
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Save size={14} />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
