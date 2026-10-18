import React, { useState } from 'react';
import { ClubDocument, ExtractedEventData } from '../types';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ExtractionModalProps {
  promptText: string;
  isOpen: boolean;
  onClose: () => void;
  onGenerateDocument: (doc: ClubDocument) => void;
}

export const ExtractionModal: React.FC<ExtractionModalProps> = ({
  promptText,
  isOpen,
  onClose,
  onGenerateDocument,
}) => {
  if (!isOpen) return null;

  // Simulate smart extraction heuristics from promptText
  const extractFromText = (text: string): ExtractedEventData => {
    const isWorkshop = text.toLowerCase().includes('workshop');
    const isNotice = text.toLowerCase().includes('fest') || text.toLowerCase().includes('notice');

    return {
      eventName: isWorkshop
        ? 'Web Development Workshop 2026'
        : isNotice
        ? 'ACM Annual Tech Fest & Hackathon'
        : 'ACM NIT Surat Technical Seminar',
      dates: text.includes('14–15 October') || text.includes('14-15 October')
        ? '14–15 October 2026'
        : '22–24 October 2026',
      venue: text.toLowerCase().includes('seminar hall')
        ? 'Seminar Hall - Computer Engineering Dept.'
        : 'Central Academic Auditorium, SVNIT',
      expectedParticipants: text.match(/\d+\s*students/i)?.[0] || '120 students',
      objective:
        'Equip undergraduate students with modern full-stack engineering skills, version control, and cloud deployment foundations.',
      targetAudience: 'B.Tech CSE, IT, and Electronics students (All semesters)',
      budgetRequired: '₹18,500 (Honorarium, Refreshments & Stationery)',
      facultyCoordinator: 'Dr. M. A. Zaveri (Faculty Advisor, ACM SVNIT)',
      studentLeads: 'Kristal Patel, Aarav Sharma',
      equipmentNeeds: ['Overhead Projector', 'Lapel & Cordless Mics', 'High-Speed Wi-Fi Access'],
    };
  };

  const [extractedData, setExtractedData] = useState<ExtractedEventData>(() =>
    extractFromText(promptText)
  );
  const [selectedDocType, setSelectedDocType] = useState<string>('Event Proposal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerationSuccess(true);

      const newDoc: ClubDocument = {
        id: `doc-${Date.now()}`,
        title: `${extractedData.eventName} - ${selectedDocType}`,
        templateType: selectedDocType,
        status: 'Draft',
        lastEditedText: 'Just now',
        lastEditedDate: new Date().toISOString(),
        iconTheme:
          selectedDocType === 'Event Proposal'
            ? 'blue'
            : selectedDocType === 'Permission Letter'
            ? 'amber'
            : selectedDocType === 'Event Notice'
            ? 'emerald'
            : 'purple',
        venue: extractedData.venue,
        eventDate: extractedData.dates,
        expectedAttendance: extractedData.expectedParticipants,
        budgetTotal: extractedData.budgetRequired,
        summary: extractedData.objective,
        organizer: extractedData.studentLeads,
      };

      setTimeout(() => {
        onGenerateDocument(newDoc);
        onClose();
      }, 700);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                AI Entity Extraction & Document Builder
              </h3>
              <p className="text-xs text-slate-300">
                GENDOC NLP Engine parsed your event description
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Original Prompt Bubble */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs">
            <span className="font-bold text-slate-600 block mb-1">Original Natural Language Prompt:</span>
            <p className="italic text-slate-800">"{promptText}"</p>
          </div>

          {/* Extracted Entities Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Detected Club Entities (Editable)
              </span>
              <span className="text-[11px] text-blue-600 font-medium">98.4% Confidence Score</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={extractedData.eventName}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, eventName: e.target.value })
                  }
                  className="w-full text-xs font-semibold text-slate-800 border-b border-slate-200 pb-1 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Dates & Duration
                </label>
                <input
                  type="text"
                  value={extractedData.dates}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, dates: e.target.value })
                  }
                  className="w-full text-xs font-semibold text-slate-800 border-b border-slate-200 pb-1 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Requested Venue
                </label>
                <input
                  type="text"
                  value={extractedData.venue}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, venue: e.target.value })
                  }
                  className="w-full text-xs font-semibold text-slate-800 border-b border-slate-200 pb-1 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-white">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Expected Attendees
                </label>
                <input
                  type="text"
                  value={extractedData.expectedParticipants}
                  onChange={(e) =>
                    setExtractedData({
                      ...extractedData,
                      expectedParticipants: e.target.value,
                    })
                  }
                  className="w-full text-xs font-semibold text-slate-800 border-b border-slate-200 pb-1 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Missing Detail Prompter */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-amber-950">GENDOC Compliance Advisory:</span>
                <p className="text-amber-800 mt-0.5">
                  Institutional approval requires faculty endorsement. Added default advisor:
                  <strong className="ml-1 text-amber-950">{extractedData.facultyCoordinator}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Choose Document Type to Generate */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Select Document Output Format:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Event Proposal', 'Permission Letter', 'Event Notice', 'Budget Estimate'].map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedDocType(type)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      selectedDocType === type
                        ? 'border-blue-600 bg-blue-50/80 text-blue-700 font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <FileText size={14} className="mb-1 text-slate-500" />
                    {type}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Document...</span>
              </>
            ) : generationSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>Created Successfully!</span>
              </>
            ) : (
              <>
                <span>Generate Official Document</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
