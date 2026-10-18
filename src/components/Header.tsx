import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { Search, Bell, ChevronDown, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSignOut: () => void;
  onNotificationClick: () => void;
  placeholder?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  onSignOut,
  onNotificationClick,
  placeholder = 'Search documents, templates, or events...',
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = currentUser.avatarInitial || currentUser.name.charAt(0).toUpperCase() || 'K';

  return (
    <header className="h-16 bg-white border-b border-slate-200/70 px-7 flex items-center justify-between shrink-0 z-20">
      {/* Search Input */}
      <div className="relative w-[420px]">
        <Search
          className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
          size={16}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl pl-10 pr-4 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Right Profile & Notification */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={onNotificationClick}
          className="relative p-1.5 text-slate-600 hover:text-slate-900 transition-colors"
          title="Notifications"
        >
          <Bell size={20} />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1 right-1 ring-2 ring-white" />
        </button>

        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-full bg-[#1D63DC] text-white font-semibold text-sm flex items-center justify-center shadow-xs">
              {initial}
            </div>
            <div className="leading-tight text-left">
              <div className="text-[13.5px] font-bold text-slate-800">{currentUser.name}</div>
              <div className="text-[11.5px] text-slate-500 font-medium">{currentUser.role}</div>
            </div>
            <ChevronDown
              className={`text-slate-400 ml-0.5 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
              size={16}
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-fadeIn">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Signed in as
                </p>
                <p className="text-sm font-bold text-slate-900 truncate mt-0.5">
                  {currentUser.name}
                </p>
                <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60">
                  <UserCheck size={12} />
                  {currentUser.role}
                </div>
              </div>

              <div className="p-1.5">
                <div className="px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>ACM NIT Surat Verified</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    onSignOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
