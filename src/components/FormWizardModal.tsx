import React, { useState } from 'react';
import { ClubDocument } from '../types';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileCheck,
  Building,
  Sparkles,
} from 'lucide-react';

interface FormWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (doc: ClubDocument) => void;
}

export const FormWizardModal: React.FC<FormWizardModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    title: 'ACM Cloud & DevOps BootCamp 2026',
    category: 'Technical Workshop',
    startDate: '2026-11-05',
    endDate: '2026-11-06',
    venue: 'Seminar Hall, Computer Engg. Dept.',
    participantsCount: '150',
    targetYears: '2nd & 3rd Year B.Tech',
    equipments: ['Overhead HD Projector', 'Handheld Mics', 'LAN & Wi-Fi Access'],
    budgetEstimate: '₹24,500',
    facultyAdvisor: 'Dr. M. A. Zaveri',
    studentLead: 'Kristal Patel (Tech Lead)',
    documentType: 'Event Proposal',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newDoc: ClubDocument = {
        id: `doc-${Date.now()}`,
        title: `${formData.title} - ${formData.documentType}`,
        templateType: formData.documentType,
        status: 'Draft',
        lastEditedText: 'Just now',
        lastEditedDate: new Date().toISOString(),
        iconTheme:
          formData.documentType === 'Event Proposal'
            ? 'blue'
            : formData.documentType === 'Permission Letter'
            ? 'amber'
            : formData.documentType === 'Event Notice'
            ? 'emerald'
            : 'purple',
        venue: formData.venue,
        eventDate: `${formData.startDate} to ${formData.endDate}`,
        expectedAttendance: `${formData.participantsCount} students`,
        budgetTotal: formData.budgetEstimate,
        summary: `Guided form generated club document for ${formData.title} organized by ${formData.studentLead}.`,
        organizer: formData.studentLead,
      };

      onComplete(newDoc);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const stepsList = [
    { number: 1, title: 'Event Details' },
    { number: 2, title: 'Participants & Resources' },
    { number: 3, title: 'Additional Information' },
    { number: 4, title: 'Review & Generate' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-fadeIn">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base">Guided Document Builder Wizard</h3>
              <p className="text-xs text-slate-300">ACM- NIT SURAT Standard Club Procedures</p>
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

        {/* Stepper Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <div className="absolute top-3.5 left-10 right-10 h-[2px] bg-slate-200 -z-0" />
            <div className="grid grid-cols-4 gap-2 relative z-10">
              {stepsList.map((s) => {
                const isActive = step === s.number;
                const isPassed = step > s.number;
                return (
                  <div key={s.number} className="flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : isActive
                          ? 'bg-[#2563EB] text-white ring-4 ring-blue-100 shadow-sm'
                          : 'bg-white text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 size={16} /> : s.number}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 leading-tight ${
                        isActive
                          ? 'font-bold text-slate-900'
                          : isPassed
                          ? 'font-semibold text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Event Details */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Step 1: Event Details & Specifications
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  placeholder="e.g. Web Development Workshop 2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Technical Workshop">Technical Workshop</option>
                    <option value="Hackathon / Coding Contest">Hackathon / Coding Contest</option>
                    <option value="Seminar / Guest Lecture">Seminar / Guest Lecture</option>
                    <option value="Cultural / Annual Fest">Cultural / Annual Fest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue Reservation
                  </label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Participants & Resources */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-blue-600" />
                Step 2: Participants & Department Resources
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Participant Count
                  </label>
                  <input
                    type="number"
                    value={formData.participantsCount}
                    onChange={(e) =>
                      setFormData({ ...formData, participantsCount: e.target.value })
                    }
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Eligibility
                  </label>
                  <input
                    type="text"
                    value={formData.targetYears}
                    onChange={(e) => setFormData({ ...formData, targetYears: e.target.value })}
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Institutional Resource Requisition
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {['Overhead HD Projector', 'Handheld Mics', 'LAN & Wi-Fi Access', 'Air Conditioning', 'Power Backup (UPS)', 'Lab Computer Terminals'].map(
                    (item) => {
                      const isChecked = formData.equipments.includes(item);
                      return (
                        <label
                          key={item}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setFormData({
                                  ...formData,
                                  equipments: formData.equipments.filter((e) => e !== item),
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  equipments: [...formData.equipments, item],
                                });
                              }
                            }}
                            className="rounded text-blue-600"
                          />
                          <span>{item}</span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Additional Information */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={16} className="text-blue-600" />
                Step 3: Budget & Chapter Authorities
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Estimated Budget
                  </label>
                  <input
                    type="text"
                    value={formData.budgetEstimate}
                    onChange={(e) =>
                      setFormData({ ...formData, budgetEstimate: e.target.value })
                    }
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. ₹24,500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faculty Advisor Endorsement
                  </label>
                  <input
                    type="text"
                    value={formData.facultyAdvisor}
                    onChange={(e) =>
                      setFormData({ ...formData, facultyAdvisor: e.target.value })
                    }
                    className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Student Coordinator
                </label>
                <input
                  type="text"
                  value={formData.studentLead}
                  onChange={(e) => setFormData({ ...formData, studentLead: e.target.value })}
                  className="w-full text-xs font-medium text-slate-800 border border-slate-300 rounded-xl px-3.5 py-2.5 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Document Type
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-xl px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Event Proposal">Event Proposal</option>
                  <option value="Permission Letter">Permission Letter</option>
                  <option value="Event Notice">Event Notice</option>
                  <option value="Budget Estimate">Budget Estimate</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Review & Generate */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-600" />
                Step 4: Review Specifications & Compile Document
              </h4>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-600">Document Type:</span>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    {formData.documentType}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 block">Event Title:</span>
                    <span className="font-semibold text-slate-800">{formData.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category:</span>
                    <span className="font-semibold text-slate-800">{formData.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Dates:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.startDate} to {formData.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Venue:</span>
                    <span className="font-semibold text-slate-800">{formData.venue}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Attendance:</span>
                    <span className="font-semibold text-slate-800">
                      {formData.participantsCount} participants
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Budget:</span>
                    <span className="font-semibold text-slate-800">{formData.budgetEstimate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-1">Equipment Requisition:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.equipments.map((eq) => (
                      <span
                        key={eq}
                        className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[11px]"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-3 py-2 rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Compile & Save Document</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
