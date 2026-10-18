import React from 'react';
import { DocumentTemplate } from '../types';
import { FileText, Award } from 'lucide-react';

interface BrowseTemplatesCardProps {
  templates: DocumentTemplate[];
  onSelectTemplate: (template: DocumentTemplate) => void;
  onViewAllClick: () => void;
}

export const BrowseTemplatesCard: React.FC<BrowseTemplatesCardProps> = ({
  templates,
  onSelectTemplate,
  onViewAllClick,
}) => {
  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'amber':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'emerald':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'purple':
        return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'indigo':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const renderIcon = (tpl: DocumentTemplate) => {
    if (tpl.iconName === 'Award') {
      return <Award size={16} />;
    }
    return <FileText size={16} />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          {/* Dark filled document badge matching screenshot */}
          <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center shrink-0">
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" />
              <path d="M14 2V8H20" fill="#94A3B8" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800">Browse Templates</h2>
        </div>

        <button
          type="button"
          onClick={onViewAllClick}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
        >
          <span>View All</span>
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>

      {/* 5-Card Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => onSelectTemplate(tpl)}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/90 bg-white hover:border-blue-400 hover:shadow-sm transition-all text-left group"
          >
            {/* Soft colored square icon */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${getThemeStyles(
                tpl.theme
              )} group-hover:scale-105 transition-transform`}
            >
              {renderIcon(tpl)}
            </div>

            {/* Label */}
            <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
              {tpl.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
