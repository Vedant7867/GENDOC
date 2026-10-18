import React from 'react';
import { X, HelpCircle, FileText, CheckCircle2, MessageSquare, ExternalLink } from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-blue-400" />
            <h3 className="font-bold text-base">Help & Documentation</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 max-h-[65vh] overflow-y-auto">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">
              About GENDOC (ACM- NIT SURAT)
            </h4>
            <p className="leading-relaxed">
              GENDOC is the standardized automated document workflow and template engine designed
              for the ACM Student Chapter at Sardar Vallabhbhai National Institute of Technology
              (SVNIT), Surat.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <h5 className="font-bold text-slate-800">1. "Describe your event" (Recommended)</h5>
            <p className="leading-relaxed text-slate-600">
              Type or paste your raw event concept in natural language (e.g. date, venue, expected
              students). The AI extraction engine parses entities and creates compliant SVNIT document
              drafts automatically.
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
            <h5 className="font-bold text-slate-800">2. "Fill a form"</h5>
            <p className="leading-relaxed text-slate-600">
              Step through our 4-stage guided form wizard to supply structured fields: Event Details,
              Participants & Resources, Additional Info (Budget), and Review & Generate.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-400">Need further support from Chapter Admins?</span>
            <a
              href="mailto:acm@coed.svnit.ac.in"
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              Contact Chapter <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
