import React from 'react';
import { NavTab } from '../types';
import { GendocStarLogo } from './BrandLogo';
import {
  Home,
  Calendar,
  FileText,
  LayoutGrid,
  Settings,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenHelp,
}) => {
  const navItems: { label: NavTab; icon: LucideIcon }[] = [
    { label: 'Home', icon: Home },
    { label: 'Events', icon: Calendar },
    { label: 'Documents', icon: FileText },
    { label: 'Templates', icon: LayoutGrid },
    { label: 'Club Settings', icon: Settings },
  ];

  return (
    <aside className="w-[235px] bg-[#0B132B] text-white flex flex-col justify-between shrink-0 select-none border-r border-slate-800/60">
      <div>
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-3">
          <GendocStarLogo size="md" />
          <div>
            <div className="text-[17px] font-bold tracking-wide text-white leading-tight">
              GENDOC
            </div>
            <div className="text-[10.5px] font-medium text-slate-400 tracking-wider uppercase mt-0.5">
              ACM- NIT SURAT
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.label;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onTabChange(item.label)}
                className={`w-full text-left rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-[13.5px] transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1D4ED8] text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white font-medium'
                }`}
              >
                <Icon
                  className={isActive ? 'text-white' : 'text-slate-400'}
                  size={18}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Help & Support */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onOpenHelp}
          className="w-full text-slate-400 hover:text-white px-3 py-2 flex items-center gap-3 text-[13px] font-medium transition-colors rounded-xl hover:bg-slate-800/40 cursor-pointer"
        >
          <HelpCircle size={18} />
          <span>Help & Support</span>
        </button>
      </div>
    </aside>
  );
};
