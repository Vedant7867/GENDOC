import React from 'react';
import { DocumentTemplate } from '../types';
import { X, FileText, Award, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface TemplateQuickStartModalProps {
  template: DocumentTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: DocumentTemplate) => void;
}

export const TemplateQuickStartModal: React.FC<TemplateQuickStartModalProps> = ({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0B132B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              {template.iconName === 'Award' ? <Award size={18} /> : <FileText size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">{template.title} Template</h3>
              <p className="text-xs text-slate-300">ACM NIT Surat Verified Club Schema</p>
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
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Category:
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {template.category}
            </span>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Description
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">{template.description}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" />
              Suggested Prompt for GENDOC AI:
            </span>
            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200">
              "{template.suggestedPrompt}"
            </p>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Complies with SVNIT Department format specifications</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <span>Includes digital signature placeholders for Faculty Advisor</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onUseTemplate(template)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all"
          >
            <span>Use This Template</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
