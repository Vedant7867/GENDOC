import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Undo2,
  Redo2,
  Share,
  Download,
  Scissors,
  Copy,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  Search,
  Replace,
  MousePointer,
  X,
  Sparkles,
  CheckCircle2,
  Send,
  Globe,
  FileText,
  BookOpen,
  Layout,
  Maximize2,
  Minus,
  Plus,
  PaintBucket,
  Grid,
  Pilcrow,
  ArrowUpDown,
  Eraser,
  Highlighter,
  ArrowLeft,
} from 'lucide-react';
import { User } from '../types';

// --- Custom SVGs for Brand & Ribbon Fidelity ---

export const GendocHeaderStar = () => (
  <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
    <div className="absolute inset-0 bg-blue-500/40 rounded-full blur-xs" />
    <svg viewBox="0 0 36 36" className="w-5 h-5 relative z-10" fill="none">
      <path
        d="M18 2C18 11.5 24.5 18 34 18C24.5 18 18 24.5 18 34C18 24.5 11.5 18 2 18C11.5 18 18 11.5 18 2Z"
        fill="url(#editorStarGrad)"
      />
      <defs>
        <linearGradient id="editorStarGrad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93C5FD" />
          <stop offset="0.5" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

export const DualClubEmblem = () => (
  <svg width="42" height="38" viewBox="0 0 42 38" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left Soft Blue Star */}
    <path
      d="M12 6C12 12.5 16.5 17 23 17C16.5 17 12 21.5 12 28C12 21.5 7.5 17 1 17C7.5 17 12 12.5 12 6Z"
      fill="#93C5FD"
    />
    {/* Main Dark Navy Star */}
    <path
      d="M24 2C24 11 30 17 39 17C30 17 24 23 24 32C24 23 18 17 9 17C18 17 24 11 24 2Z"
      fill="#0F1E46"
    />
    {/* Tiny Accent Sparkle */}
    <path
      d="M36 6C36 8.2 37.8 10 40 10C37.8 10 36 11.8 36 14C36 11.8 34.2 10 32 10C34.2 10 36 8.2 36 6Z"
      fill="#93C5FD"
    />
  </svg>
);

export const PasteClipboardIcon = () => (
  <svg width="26" height="28" viewBox="0 0 26 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="16" height="20" rx="2" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" />
    <rect x="7" y="2" width="8" height="4" rx="1" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
    <rect x="8" y="9" width="15" height="17" rx="1.5" fill="white" stroke="#64748B" strokeWidth="1.2" />
    <line x1="11" y1="13" x2="20" y2="13" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="11" y1="17" x2="20" y2="17" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="11" y1="21" x2="17" y2="21" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const CloudCheckIcon = ({ size = 15 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-slate-300"
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

interface DocumentEditorViewProps {
  initialTitle?: string;
  currentUser: User;
  onBack: () => void;
}

export const DocumentEditorView: React.FC<DocumentEditorViewProps> = ({
  initialTitle = 'Web Development Workshop - Event Proposal',
  currentUser,
  onBack,
}) => {
  const [docTitle, setDocTitle] = useState(initialTitle);
  const [activeMenuTab, setActiveMenuTab] = useState('Home');
  const [activeStyle, setActiveStyle] = useState('Normal');
  const [activePage, setActivePage] = useState(1);
  const [activeCopilotTab, setActiveCopilotTab] = useState<'Chat' | 'Suggestions'>('Chat');
  const [copilotInput, setCopilotInput] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [copilotNotice, setCopilotNotice] = useState<string | null>(null);

  // Editable Document Content State
  const [objectives, setObjectives] = useState([
    'To introduce students to modern web development technologies.',
    'To provide hands-on learning experience through guided projects.',
    'To build practical project skills and encourage collaborative learning.',
    'To create a platform for students to explore opportunities in web development.',
  ]);

  const [hasBudgetSection, setHasBudgetSection] = useState(false);
  const [hasConclusionSection, setHasConclusionSection] = useState(false);

  const MENU_TABS = [
    'File',
    'Home',
    'Insert',
    'Design',
    'Layout',
    'References',
    'Review',
    'View',
    'Help',
  ];

  const COPILOT_PROMPTS = [
    'Improve the event objectives',
    'Make it more formal',
    'Shorten this section',
    'Add a budget section',
    'Create a conclusion',
  ];

  const handleCopilotQuickAction = (promptText: string) => {
    if (promptText === 'Improve the event objectives') {
      setObjectives([
        'To equip undergraduate students with industry-standard full-stack web development frameworks.',
        'To deliver intensive hands-on training through real-world guided coding sessions.',
        'To foster peer-to-peer technical collaboration and production-ready project deployment skills.',
        'To bridge academic learning with modern software engineering career pathways.',
      ]);
      setCopilotNotice('Objectives improved with industry-standard phrasing!');
    } else if (promptText === 'Make it more formal') {
      setObjectives([
        'To systematically introduce foundational principles of responsive client-server architectures.',
        'To facilitate rigorous experiential learning through supervised software engineering laboratories.',
        'To cultivate team-oriented development protocols in alignment with institutional academic mandates.',
        'To disseminate practical competencies in version control and continuous integration frameworks.',
      ]);
      setCopilotNotice('Applied formal academic institutional tone!');
    } else if (promptText === 'Shorten this section') {
      setObjectives([
        'Master modern full-stack web architecture and Git version control.',
        'Build and deploy a collaborative full-stack application under faculty mentorship.',
      ]);
      setCopilotNotice('Objectives concisely summarized.');
    } else if (promptText === 'Add a budget section') {
      setHasBudgetSection(true);
      setCopilotNotice('Itemized chapter budget forecast injected into document!');
    } else if (promptText === 'Create a conclusion') {
      setHasConclusionSection(true);
      setCopilotNotice('Formal concluding statement and signatory blocks appended!');
    } else {
      setCopilotInput(promptText);
    }

    setTimeout(() => setCopilotNotice(null), 3500);
  };

  const handleDownload = (format: 'DOCX' | 'PDF') => {
    setShowDownloadMenu(false);
    const content = `===============================================================
SARDAR VALLABHBHAI NATIONAL INSTITUTE OF TECHNOLOGY, SURAT
CODING CLUB & ACM STUDENT CHAPTER
===============================================================
DOCUMENT: ${docTitle}
DATE: 14 – 15 October 2026
VENUE: Seminar Hall, SVNIT Surat
TARGET: Undergraduate Students (Around 120 participants)
ORGANIZER: Coding Club, SVNIT Surat

OBJECTIVES:
${objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

SCHEDULE:
Day 1 (14 Oct 2026): HTML, CSS, JavaScript Basics (Hands-on)
Day 2 (15 Oct 2026): React.js and Mini Project (Hands-on)
===============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format.toLowerCase()}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#EBEEF3] font-sans antialiased text-slate-800 select-none">
      {/* 1. TOP DARK BRAND HEADER BAR */}
      <header className="h-11 bg-[#0B132B] text-white px-4 flex items-center justify-between shrink-0">
        {/* Left: GENDOC | ACM- NIT SURAT & Back Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-xs font-semibold mr-1 cursor-pointer"
            title="Return to Workspace"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <GendocHeaderStar />
            <span className="text-[14px] font-bold tracking-wide text-white">
              GENDOC
            </span>
          </div>
          <span className="text-slate-600 text-sm">|</span>
          <span className="text-[12.5px] font-medium text-slate-300">
            ACM- NIT SURAT
          </span>
        </div>

        {/* Center: Document Title & Saved Status */}
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-semibold text-white tracking-tight truncate max-w-xs sm:max-w-md">
            {docTitle}
          </span>
          <div className="flex items-center gap-1.5 text-slate-300 text-[12px]">
            <CloudCheckIcon size={15} />
            <span>Saved</span>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white font-semibold text-xs flex items-center justify-center">
              {currentUser.avatarInitial || currentUser.name.charAt(0) || 'K'}
            </div>
            <span className="text-[12.5px] font-medium text-slate-100 hidden sm:inline">
              {currentUser.name}
            </span>
            <ChevronDown className="text-slate-400" size={14} />
          </div>

          {showUserMenu && (
            <div className="absolute right-0 mt-1.5 w-48 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-slate-500 text-[11px]">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 font-medium"
              >
                Close Editor
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. MENU TABS & SHARE / DOWNLOAD BAR */}
      <div className="h-10 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0">
        {/* Left Menu Tabs */}
        <nav className="flex items-center gap-1 h-full overflow-x-auto">
          {MENU_TABS.map((tab) => {
            const isActive = activeMenuTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMenuTab(tab)}
                className={`relative h-full px-3 text-[12.5px] font-medium transition-colors cursor-pointer flex items-center shrink-0 ${
                  isActive
                    ? 'text-[#1D63DC] font-semibold'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#1D63DC] rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Undo/Redo + Share + Download */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1 mr-1 text-slate-600">
            <button
              type="button"
              title="Undo"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              title="Redo"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Redo2 size={15} />
            </button>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share size={14} />
            <span>Share</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDownloadMenu((prev) => !prev)}
              className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[12.5px] font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download</span>
              <span className="border-l border-blue-400/60 pl-1.5 ml-0.5">
                <ChevronDown size={13} />
              </span>
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5 z-50 text-xs font-medium text-slate-700 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => handleDownload('DOCX')}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span>Download as DOCX</span>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                    .DOCX
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('PDF')}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                >
                  <span>Download as PDF</span>
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                    .PDF
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. MS-WORD RICH FORMATTING RIBBON */}
      <div className="bg-white border-b border-slate-200/90 px-4 py-2 flex items-center gap-3 overflow-x-auto shrink-0">
        {/* Group 1: Clipboard */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-slate-200 shrink-0">
          <button
            type="button"
            className="flex flex-col items-center justify-center px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <PasteClipboardIcon />
            <span className="text-[11px] font-medium text-slate-700 flex items-center gap-0.5 mt-0.5">
              Paste <ChevronDown size={10} />
            </span>
          </button>

          <div className="flex flex-col justify-between space-y-1 text-[11px] text-slate-600">
            <button type="button" className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer">
              <Scissors className="text-slate-400" size={12} />
              <span>Cut</span>
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer">
              <Copy className="text-slate-400" size={12} />
              <span>Copy</span>
            </button>
            <button type="button" className="flex items-center gap-1.5 hover:text-slate-900 cursor-pointer">
              <Paintbrush className="text-amber-500" size={12} />
              <span className="text-slate-700 font-medium">Format Painter</span>
            </button>
          </div>
        </div>

        {/* Group 2: Font & Text Styling */}
        <div className="flex flex-col justify-between space-y-2 pr-3 border-r border-slate-200 shrink-0">
          {/* Top Font Row */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center justify-between w-36 px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[12px] text-slate-800 cursor-pointer">
              <span>Times New Roman</span>
              <ChevronDown className="text-slate-400" size={12} />
            </div>
            <div className="flex items-center justify-between w-14 px-2 py-1 rounded-md border border-slate-200 bg-white text-[12px] text-slate-800 cursor-pointer">
              <span>12</span>
              <ChevronDown className="text-slate-400" size={12} />
            </div>

            <button type="button" className="px-1.5 py-1 rounded hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
              A<sup className="text-[9px]">^</sup>
            </button>
            <button type="button" className="px-1.5 py-1 rounded hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
              A<sup className="text-[9px]">v</sup>
            </button>
            <button type="button" className="px-1.5 py-1 rounded hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center cursor-pointer">
              Aa <ChevronDown className="ml-0.5 text-slate-400" size={10} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer">
              <Eraser size={14} />
            </button>
          </div>

          {/* Bottom Font Row */}
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-800 cursor-pointer font-bold">
              <Bold size={14} />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-800 cursor-pointer italic">
              <Italic size={14} />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-800 flex items-center cursor-pointer underline">
              <Underline size={14} />
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-800 cursor-pointer">
              <Strikethrough size={14} />
            </button>
            <button type="button" className="px-1.5 py-1 rounded hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
              x<sub className="text-[9px]">2</sub>
            </button>
            <button type="button" className="px-1.5 py-1 rounded hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
              x<sup className="text-[9px]">2</sup>
            </button>
            <span className="h-4 w-[1px] bg-slate-200 mx-1" />
            <button type="button" className="px-1.5 py-0.5 rounded hover:bg-slate-100 text-xs font-bold text-blue-600 cursor-pointer">
              A
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 flex items-center cursor-pointer">
              <span className="flex flex-col items-center">
                <Highlighter className="text-slate-700" size={13} />
                <span className="w-3.5 h-1 bg-yellow-400 rounded-xs" />
              </span>
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 flex items-center cursor-pointer">
              <span className="flex flex-col items-center leading-none">
                <span className="text-[12px] font-bold text-slate-800">A</span>
                <span className="w-3.5 h-1 bg-red-600 rounded-xs mt-0.5" />
              </span>
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
          </div>
        </div>

        {/* Group 3: Paragraph & Alignment */}
        <div className="flex flex-col justify-between space-y-2 pr-3 border-r border-slate-200 shrink-0">
          {/* Top Paragraph Row */}
          <div className="flex items-center gap-1.5">
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 flex items-center cursor-pointer">
              <List size={14} />
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 flex items-center cursor-pointer">
              <ListOrdered size={14} />
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <IndentDecrease size={14} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <IndentIncrease size={14} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <ArrowUpDown size={14} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <Pilcrow size={14} />
            </button>
          </div>

          {/* Bottom Paragraph Row */}
          <div className="flex items-center gap-1.5">
            <button type="button" className="p-1.5 rounded bg-slate-200/80 text-slate-900 cursor-pointer">
              <AlignLeft size={14} />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <AlignCenter size={14} />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <AlignRight size={14} />
            </button>
            <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-700 cursor-pointer">
              <AlignJustify size={14} />
            </button>
            <span className="h-4 w-[1px] bg-slate-200 mx-0.5" />
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 flex items-center cursor-pointer">
              <PaintBucket size={13} />
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
            <button type="button" className="p-1 rounded hover:bg-slate-100 text-slate-700 flex items-center cursor-pointer">
              <Grid size={13} />
              <ChevronDown className="text-slate-400 ml-0.5" size={10} />
            </button>
          </div>
        </div>

        {/* Group 4: Heading Styles */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200 shrink-0">
          {[
            { id: 'Normal', label: 'Normal', cls: 'text-[12.5px] font-medium text-slate-800' },
            { id: 'Heading 1', label: 'Heading 1', cls: 'text-[15px] font-serif font-bold text-slate-900' },
            { id: 'Heading 2', label: 'Heading 2', cls: 'text-[14px] font-serif font-semibold text-[#1E3A8A]' },
            { id: 'Heading 3', label: 'Heading 3', cls: 'text-[13px] font-serif font-semibold text-slate-700' },
          ].map((st) => {
            const isSelected = activeStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setActiveStyle(st.id)}
                className={`h-14 px-4 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-2 border-slate-400 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className={st.cls}>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Group 5: Find / Replace / Select */}
        <div className="flex flex-col justify-between space-y-1 text-[11.5px] text-slate-700 pl-1 shrink-0">
          <button type="button" className="flex items-center justify-between gap-4 hover:text-slate-900 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Search className="text-slate-500" size={12} />
              <span>Find</span>
            </span>
            <ChevronDown className="text-slate-400" size={10} />
          </button>
          <button type="button" className="flex items-center justify-between gap-4 hover:text-slate-900 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Replace className="text-slate-500" size={12} />
              <span>Replace</span>
            </span>
            <ChevronDown className="text-slate-400" size={10} />
          </button>
          <button type="button" className="flex items-center justify-between gap-4 hover:text-slate-900 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <MousePointer className="text-slate-500" size={12} />
              <span>Select</span>
            </span>
            <ChevronDown className="text-slate-400" size={10} />
          </button>
        </div>
      </div>

      {/* 4. MAIN 3-COLUMN WORKSPACE (LEFT PAGES | CENTER RULER+A4 | RIGHT AI COPILOT) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT PANEL: Pages Thumbnails */}
        <aside className="w-[155px] bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
            <span className="text-[13.5px] font-bold text-slate-800">Pages</span>
            <button type="button" className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {[1, 2, 3].map((pageNum) => {
              const isCurrent = activePage === pageNum;
              return (
                <div
                  key={pageNum}
                  onClick={() => setActivePage(pageNum)}
                  className="flex flex-col items-center cursor-pointer group select-none"
                >
                  <div
                    className={`w-[108px] h-[142px] bg-white rounded-lg p-2 relative overflow-hidden transition-all ${
                      isCurrent
                        ? 'border-2 border-[#2563EB] shadow-xs ring-2 ring-blue-500/10'
                        : 'border border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Top-right Navy Corner Accent */}
                    <div className="absolute top-0 right-0 w-9 h-4 bg-[#0F1E46] rounded-bl-full" />

                    {/* Mini Header */}
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <div className="h-1 w-8 bg-slate-300 rounded-full" />
                    </div>

                    {/* Mini Heading */}
                    <div className="h-1.5 w-14 bg-slate-800 rounded-full mx-auto mt-2.5 mb-2" />

                    {/* Mini Body Wireframe */}
                    {pageNum === 1 ? (
                      <div className="space-y-1.5">
                        <div className="border border-slate-200 rounded-[2px] p-0.5 space-y-1">
                          <div className="h-1 w-full bg-slate-200 rounded-full" />
                          <div className="h-1 w-5/6 bg-slate-200 rounded-full" />
                          <div className="h-1 w-4/5 bg-slate-200 rounded-full" />
                        </div>
                        <div className="space-y-1 pt-1">
                          <div className="h-1 w-10 bg-slate-400 rounded-full" />
                          <div className="h-1 w-full bg-slate-200 rounded-full" />
                          <div className="h-1 w-11/12 bg-slate-200 rounded-full" />
                        </div>
                        <div className="border border-slate-200 rounded-[2px] p-0.5 space-y-1 mt-1">
                          <div className="h-1 w-full bg-blue-100 rounded-full" />
                          <div className="h-1 w-full bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 mt-2">
                        <div className="h-1 w-12 bg-slate-400 rounded-full" />
                        <div className="h-1 w-full bg-slate-200 rounded-full" />
                        <div className="h-1 w-11/12 bg-slate-200 rounded-full" />
                        <div className="h-1 w-4/5 bg-slate-200 rounded-full" />
                        <div className="h-1 w-10 bg-slate-400 rounded-full mt-2" />
                        <div className="h-1 w-full bg-slate-200 rounded-full" />
                        <div className="h-1 w-5/6 bg-slate-200 rounded-full" />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11.5px] mt-1.5 ${
                      isCurrent ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
                    }`}
                  >
                    {pageNum}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* CENTER PANEL: Horizontal Ruler + Scrollable A4 Document Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#EBEEF3]">
          {/* Horizontal Top Ruler */}
          <div className="h-6 bg-[#F4F6F9] border-b border-slate-200/90 flex items-center justify-center shrink-0">
            <div className="w-[740px] h-4 bg-white border-x border-slate-300/80 px-8 flex items-center justify-between text-[9px] text-slate-400 font-mono relative">
              {[1, 2, 3, 4, 5, 6, 7].map((inch) => (
                <div key={inch} className="flex items-center gap-3">
                  <span>{inch}</span>
                  {inch < 7 && (
                    <div className="flex items-center gap-2 text-[7px] text-slate-300">
                      <span>|</span>
                      <span>|</span>
                      <span>|</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable A4 Sheet Container */}
          <div className="flex-1 overflow-y-auto py-5 px-6 flex justify-center">
            <div
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="w-[740px] min-h-[960px] bg-white shadow-md border border-slate-200/90 px-14 py-11 select-text transition-transform duration-150"
            >
              {/* A4 Club Letterhead Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-slate-300">
                <div className="flex items-center gap-3">
                  <DualClubEmblem />
                  <div>
                    <div className="font-serif font-bold text-[17px] text-[#0F1E46] leading-tight">
                      Coding Club
                    </div>
                    <div className="text-[12.5px] text-slate-600 font-medium mt-0.5">
                      SVNIT Surat
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11.5px] text-slate-600 leading-snug font-medium">
                  <div>Innovate</div>
                  <div>Collaborate</div>
                  <div>Create</div>
                </div>
              </div>

              {/* Formal Document Title & Subtitle */}
              <div className="text-center mt-6 mb-6">
                <h1
                  contentEditable
                  suppressContentEditableWarning
                  className="font-serif font-bold text-[25px] tracking-wide text-[#0F1E46] focus:outline-none"
                >
                  EVENT PROPOSAL
                </h1>
                <p
                  contentEditable
                  suppressContentEditableWarning
                  className="font-serif text-[15.5px] text-[#1E3A8A] mt-0.5 focus:outline-none"
                >
                  Web Development Workshop
                </p>
              </div>

              {/* Section 1: Event Details */}
              <div className="mb-6">
                <h2 className="font-serif font-bold text-[15.5px] text-slate-900 mb-2.5">
                  1. Event Details
                </h2>

                <table className="w-full border-collapse border border-slate-300 font-serif text-[13.5px]">
                  <tbody>
                    {[
                      { label: 'Event Name', value: 'Web Development Workshop' },
                      { label: 'Dates', value: '14 – 15 October 2026 (2 days)' },
                      { label: 'Venue', value: 'Seminar Hall, SVNIT Surat' },
                      {
                        label: 'Target Audience',
                        value: 'Undergraduate Students (All Branches)',
                      },
                      { label: 'Expected Participants', value: 'Around 120 students' },
                      { label: 'Organizing Club', value: 'Coding Club, SVNIT Surat' },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-slate-300">
                        <td className="w-[34%] bg-[#EAEEF7] px-3.5 py-2 font-bold text-slate-900 border-r border-slate-300">
                          {row.label}
                        </td>
                        <td
                          contentEditable
                          suppressContentEditableWarning
                          className="px-3.5 py-2 text-slate-800 focus:outline-none focus:bg-blue-50/30"
                        >
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section 2: Objectives */}
              <div className="mb-6">
                <h2 className="font-serif font-bold text-[15.5px] text-slate-900 mb-2">
                  2. Objectives
                </h2>
                <ul className="list-disc pl-6 space-y-1.5 font-serif text-[13.5px] text-slate-800">
                  {objectives.map((obj, idx) => (
                    <li
                      key={idx}
                      contentEditable
                      suppressContentEditableWarning
                      className="focus:outline-none focus:bg-blue-50/30"
                    >
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Event Plan */}
              <div className="mb-6">
                <h2 className="font-serif font-bold text-[15.5px] text-slate-900 mb-2.5">
                  3. Event Plan
                </h2>

                <table className="w-full border-collapse border border-slate-300 font-serif text-[13.5px] text-center">
                  <thead>
                    <tr className="bg-[#EAEEF7] border-b border-slate-300 font-bold text-slate-900">
                      <th className="py-2 px-3 border-r border-slate-300 w-[14%]">Day</th>
                      <th className="py-2 px-3 border-r border-slate-300 w-[26%]">Date</th>
                      <th className="py-2 px-3 border-r border-slate-300 w-[40%]">Topics</th>
                      <th className="py-2 px-3 w-[20%]">Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300 text-slate-800">
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3 border-r border-slate-300">
                        Day 1
                      </td>
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3 border-r border-slate-300">
                        14 October 2026
                      </td>
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3 border-r border-slate-300">
                        HTML, CSS, JavaScript Basics
                      </td>
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3">
                        Hands-on
                      </td>
                    </tr>
                    <tr className="text-slate-800">
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3 border-r border-slate-300">
                        Day 2
                      </td>
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3 border-r border-slate-300">
                        15 October 2026
                      </td>
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3 border-r border-slate-300">
                        React.js and Mini Project
                      </td>
                      <td contentEditable suppressContentEditableWarning className="py-2 px-3">
                        Hands-on
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Optional Dynamic Section 4: Budget Section (Injected via Copilot) */}
              {hasBudgetSection && (
                <div className="mb-6 animate-fadeIn">
                  <h2 className="font-serif font-bold text-[15.5px] text-slate-900 mb-2.5">
                    4. Budget Breakdown (Estimated)
                  </h2>
                  <table className="w-full border-collapse border border-slate-300 font-serif text-[13.5px]">
                    <thead>
                      <tr className="bg-[#EAEEF7] border-b border-slate-300 font-bold text-slate-900">
                        <th className="py-2 px-3 border-r border-slate-300 text-left w-[12%]">Sr.</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-left w-[48%]">Particulars</th>
                        <th className="py-2 px-3 border-r border-slate-300 text-right w-[20%]">Quantity</th>
                        <th className="py-2 px-3 text-right w-[20%]">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="py-1.5 px-3 border-r border-slate-300">1</td>
                        <td className="py-1.5 px-3 border-r border-slate-300">Guest Honorarium</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-right">2 Sessions</td>
                        <td className="py-1.5 px-3 text-right">₹6,000</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="py-1.5 px-3 border-r border-slate-300">2</td>
                        <td className="py-1.5 px-3 border-r border-slate-300">Participant Refreshments</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-right">120 Nos</td>
                        <td className="py-1.5 px-3 text-right">₹9,500</td>
                      </tr>
                      <tr className="font-bold bg-[#F8FAFC]">
                        <td colSpan={3} className="py-2 px-3 border-r border-slate-300 text-right">Total Estimated Expenditure:</td>
                        <td className="py-2 px-3 text-right text-blue-700">₹15,500</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Optional Dynamic Section 5: Conclusion & Signatories */}
              {hasConclusionSection && (
                <div className="mt-8 pt-4 border-t border-slate-200 animate-fadeIn text-[13px] font-serif text-slate-800 space-y-8">
                  <p>
                    The proposed Web Development Workshop will provide tangible skill enhancements for
                    participating engineering students. Your kind administrative endorsement is formally requested.
                  </p>
                  <div className="grid grid-cols-2 gap-8 text-center pt-4">
                    <div>
                      <div className="h-8 border-b border-slate-400 mx-auto w-36" />
                      <p className="font-bold text-slate-900 mt-1">Lead Student Coordinator</p>
                      <p className="text-[11px] text-slate-500 font-sans">Coding Club, SVNIT</p>
                    </div>
                    <div>
                      <div className="h-8 border-b border-slate-400 mx-auto w-36" />
                      <p className="font-bold text-slate-900 mt-1">Dr. M. A. Zaveri</p>
                      <p className="text-[11px] text-slate-500 font-sans">Faculty Advisor, ACM Chapter</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Copilot Sidebar */}
        <aside className="w-[315px] bg-white border-l border-slate-200 flex flex-col justify-between shrink-0">
          <div className="p-4 overflow-y-auto space-y-4">
            {/* Copilot Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-[#2563EB]" size={18} />
                <span className="text-[15px] font-bold text-slate-900">
                  AI Copilot
                </span>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Collapse Panel"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat / Suggestions Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200 text-[12.5px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveCopilotTab('Chat')}
                className={`pb-2 text-center transition-colors cursor-pointer relative ${
                  activeCopilotTab === 'Chat'
                    ? 'text-[#1D63DC]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chat
                {activeCopilotTab === 'Chat' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1D63DC]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveCopilotTab('Suggestions')}
                className={`pb-2 text-center rounded-t-lg transition-colors cursor-pointer ${
                  activeCopilotTab === 'Suggestions'
                    ? 'text-[#1D63DC] border-b-2 border-[#1D63DC]'
                    : 'text-slate-600 bg-slate-100/80 hover:bg-slate-200/60'
                }`}
              >
                Suggestions
              </button>
            </div>

            {/* Notification alert from action */}
            {copilotNotice && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 size={14} className="text-blue-600 shrink-0" />
                <span>{copilotNotice}</span>
              </div>
            )}

            {/* Greeting Card */}
            <div className="bg-[#F8FAFC] border border-slate-200/70 rounded-2xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div className="text-[12px] leading-relaxed">
                <div className="font-bold text-slate-900 text-[13px]">
                  Hello, {currentUser.name.split(' ')[0] || 'Kristal'}!
                </div>
                <p className="text-slate-600 mt-0.5">
                  I can help you edit, improve or generate content for this document.
                </p>
              </div>
            </div>

            {/* Try Asking Prompt Chips */}
            <div>
              <div className="text-[12px] font-semibold text-slate-700 mb-2.5">
                Try asking:
              </div>
              <div className="space-y-2">
                {COPILOT_PROMPTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleCopilotQuickAction(item)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-400 hover:bg-blue-50/20 text-left flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <span className="flex items-center gap-2.5 text-[12px] font-medium text-slate-700 group-hover:text-slate-900">
                      <CheckCircle2 className="text-slate-500 shrink-0" size={14} />
                      <span>{item}</span>
                    </span>
                    <ChevronRight className="text-slate-400 group-hover:text-blue-600" size={14} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Copilot Input Box */}
          <div className="p-3.5 border-t border-slate-200 bg-white">
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-2 focus-within:border-blue-500 focus-within:bg-white transition-all">
              <textarea
                rows={2}
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask anything about this document..."
                className="flex-1 bg-transparent text-[12px] text-slate-800 placeholder:text-slate-400 resize-none focus:outline-none px-1.5 py-0.5"
              />
              <button
                type="button"
                onClick={() => {
                  if (copilotInput.trim()) {
                    handleCopilotQuickAction(copilotInput);
                    setCopilotInput('');
                  }
                }}
                className="w-9 h-9 rounded-xl bg-[#1D63DC] hover:bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm transition-colors cursor-pointer"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 5. BOTTOM STATUS BAR */}
      <footer className="h-8 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[11.5px] text-slate-600 shrink-0">
        {/* Left Page & Word Count */}
        <div className="flex items-center gap-4">
          <span>Page {activePage} of 3</span>
          <span className="text-slate-300">|</span>
          <span>{267 + (hasBudgetSection ? 48 : 0) + (hasConclusionSection ? 35 : 0)} words</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5">
            <Globe className="text-slate-500" size={13} />
            <span>English (India)</span>
          </span>
        </div>

        {/* Right Layout Toggles & Zoom Slider */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500">
            <button type="button" className="p-1 hover:text-slate-800 rounded cursor-pointer">
              <BookOpen size={13} />
            </button>
            <button type="button" className="p-1 text-blue-600 bg-blue-50 rounded cursor-pointer">
              <FileText size={13} />
            </button>
            <button type="button" className="p-1 hover:text-slate-800 rounded cursor-pointer">
              <Layout size={13} />
            </button>
            <button type="button" className="p-1 hover:text-slate-800 rounded cursor-pointer">
              <Maximize2 size={13} />
            </button>
          </div>

          <span className="text-slate-300">|</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              className="p-0.5 hover:text-slate-900 cursor-pointer"
            >
              <Minus size={12} />
            </button>
            <input
              type="range"
              min={70}
              max={130}
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-24 accent-[#1D63DC] h-1 bg-slate-200 rounded-lg cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              className="p-0.5 hover:text-slate-900 cursor-pointer"
            >
              <Plus size={12} />
            </button>
            <span className="w-9 text-right font-medium text-slate-700">
              {zoomLevel}%
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
