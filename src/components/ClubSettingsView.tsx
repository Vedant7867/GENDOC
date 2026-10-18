import React, { useState } from 'react';
import {
  Palette,
  ShieldAlert,
  Sparkles,
  BookMarked,
  Users,
  Globe,
  CheckCircle2,
  Plus,
  Trash2,
  Mail,
  FileSpreadsheet,
  HardDrive,
  RotateCcw,
  Save,
  FileText,
} from 'lucide-react';
import { GendocStarLogo } from './BrandLogo';

// --- Custom SVGs Matching GENDOC / ACM- NIT SURAT Brand Identity ---

export const DualClubEmblem = ({
  primaryColor = '#0F1E46',
  accentColor = '#93C5FD',
}: {
  primaryColor?: string;
  accentColor?: string;
}) => (
  <svg width="36" height="32" viewBox="0 0 42 38" fill="none">
    <path
      d="M12 6C12 12.5 16.5 17 23 17C16.5 17 12 21.5 12 28C12 21.5 7.5 17 1 17C7.5 17 12 12.5 12 6Z"
      fill={accentColor}
    />
    <path
      d="M24 2C24 11 30 17 39 17C30 17 24 23 24 32C24 23 18 17 9 17C18 17 24 11 24 2Z"
      fill={primaryColor}
    />
    <path
      d="M36 6C36 8.2 37.8 10 40 10C37.8 10 36 11.8 36 14C36 11.8 34.2 10 32 10C34.2 10 36 8.2 36 6Z"
      fill={accentColor}
    />
  </svg>
);

export const DocumentCornerWave = ({
  primaryColor = '#0B132B',
  secondaryColor = '#1D4ED8',
}: {
  primaryColor?: string;
  secondaryColor?: string;
}) => (
  <svg
    viewBox="0 0 180 65"
    fill="none"
    className="absolute top-0 right-0 w-[58%] h-auto pointer-events-none"
    preserveAspectRatio="none"
  >
    <path
      d="M0 0H180V55C145 65 115 35 75 28C35 21 15 30 0 0Z"
      fill={secondaryColor}
      fillOpacity="0.85"
    />
    <path
      d="M35 0H180V42C140 50 110 18 70 15C48 13 38 10 35 0Z"
      fill="#3B82F6"
      fillOpacity="0.65"
    />
    <path
      d="M85 0H180V62C155 64 130 48 105 32C92 24 87 10 85 0Z"
      fill={primaryColor}
    />
  </svg>
);

// --- Types & Initial Data ---

export type SettingsTab =
  | 'branding'
  | 'ai-guardrails'
  | 'clauses'
  | 'roles-workflow'
  | 'integrations';

export interface GlobalVariable {
  key: string;
  label: string;
  value: string;
}

export interface ReusableClause {
  id: string;
  title: string;
  shortcode: string;
  category: string;
  content: string;
}

export interface RoleMember {
  id: string;
  name: string;
  email: string;
  role: 'Club Admin' | 'Faculty Advisor' | 'Core Coordinator' | 'Club Member';
  permissions: string;
}

interface ClubSettingsViewProps {
  searchQuery?: string;
}

export const ClubSettingsView: React.FC<ClubSettingsViewProps> = ({
  searchQuery = '',
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('branding');
  const [savedToast, setSavedToast] = useState(false);

  // 1. Club Branding & Letterhead State
  const [clubDisplayName, setClubDisplayName] = useState('ACM- NIT SURAT');
  const [clubShortCode, setClubShortCode] = useState('GENDOC');
  const [instituteName, setInstituteName] = useState(
    'Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat'
  );
  const [headerMotto, setHeaderMotto] = useState('Innovate • Collaborate • Create');
  const [footerText, setFooterText] = useState(
    'Official Club Document • Generated via GENDOC (ACM- NIT SURAT) • SVNIT Surat'
  );
  const [primaryColor, setPrimaryColor] = useState('#0F1E46');
  const [accentColor, setAccentColor] = useState('#1D63DC');
  const [headingFont, setHeadingFont] = useState('Times New Roman');
  const [bodyFont, setBodyFont] = useState('Times New Roman');
  const [showCornerWave, setShowCornerWave] = useState(true);

  // 2. AI Extraction & Anti-Fabrication Guardrails State
  const [strictMissingInfoPrompt, setStrictMissingInfoPrompt] = useState(true);
  const [autoDetectDocType, setAutoDetectDocType] = useState(true);
  const [crossDocSync, setCrossDocSync] = useState(true);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([
    {
      key: '{{organizing_club}}',
      label: 'Organizing Club Name',
      value: 'ACM Student Chapter, SVNIT Surat',
    },
    {
      key: '{{faculty_advisor}}',
      label: 'Faculty Advisor',
      value: 'Dr. R. K. Sharma (Dept. of CSE)',
    },
    {
      key: '{{dean_sw}}',
      label: 'Dean (Student Welfare)',
      value: 'Prof. S. N. Patel, SVNIT Surat',
    },
    {
      key: '{{club_chairperson}}',
      label: 'Club Chairperson',
      value: 'Kristal Patel',
    },
    {
      key: '{{default_venue}}',
      label: 'Default Seminar Venue',
      value: 'Seminar Hall, CSE Department, SVNIT Surat',
    },
  ]);

  // 3. Reusable Clauses State
  const [clauses, setClauses] = useState<ReusableClause[]>([
    {
      id: 'c1',
      title: 'Venue & Discipline Undertaking',
      shortcode: '{{clause_venue_discipline}}',
      category: 'Permission Letter',
      content:
        'The organizing committee of ACM- NIT SURAT undertakes full responsibility for maintaining discipline, cleanliness, and adherence to institute timings in the allotted venue.',
    },
    {
      id: 'c2',
      title: 'Student Attendance / OD Relief Clause',
      shortcode: '{{clause_attendance_od}}',
      category: 'Event Notice',
      content:
        'Registered participants attending both sessions will be eligible for official On-Duty (OD) attendance consideration subject to Faculty Advisor verification.',
    },
    {
      id: 'c3',
      title: 'Budget & Bill Utilization Certificate',
      shortcode: '{{clause_budget_audit}}',
      category: 'Budget Estimate',
      content:
        'All expenditures listed above strictly follow SVNIT Student Activity Center (SAC) financial norms and original GST invoices will be submitted within 7 working days.',
    },
  ]);

  // 4. Roles, Signatures & Approval Workflow State
  const [requireFacultyApproval, setRequireFacultyApproval] = useState(true);
  const [enableDigitalSignature, setEnableDigitalSignature] = useState(true);
  const [members] = useState<RoleMember[]>([
    {
      id: 'm1',
      name: 'Kristal Patel',
      email: 'kristal.patel@acmsvnit.org',
      role: 'Club Admin',
      permissions: 'Full Access • Edit Templates & Branding',
    },
    {
      id: 'm2',
      name: 'Dr. R. K. Sharma',
      email: 'rksharma@coed.svnit.ac.in',
      role: 'Faculty Advisor',
      permissions: 'Approve Documents • Digital Signatory',
    },
    {
      id: 'm3',
      name: 'Aarav Mehta',
      email: 'aarav.m@acmsvnit.org',
      role: 'Core Coordinator',
      permissions: 'Generate & Review Documents • Batch Export',
    },
  ]);

  // 5. Integrations & Language State
  const [integrations, setIntegrations] = useState({
    googleDrive: true,
    googleSheets: true,
    emailDistribution: false,
  });
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    'English (India)',
    'Hindi',
  ]);

  const handleSaveSettings = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'branding', label: 'Branding & Letterhead', icon: <Palette size={15} /> },
    {
      id: 'ai-guardrails',
      label: 'AI Guardrails & Variables',
      icon: <ShieldAlert size={15} />,
    },
    { id: 'clauses', label: 'Reusable Clauses', icon: <BookMarked size={15} /> },
    {
      id: 'roles-workflow',
      label: 'Roles & Approval Workflow',
      icon: <Users size={15} />,
    },
    {
      id: 'integrations',
      label: 'Integrations & Language',
      icon: <Globe size={15} />,
    },
  ];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Page Header & Save CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
            Club Settings
          </h1>
          <p className="text-[13.5px] text-slate-500 mt-0.5">
            Configure club branding, anti-fabrication AI guardrails, reusable clauses, and approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {savedToast && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 size={14} />
              Branding & Rules Synced
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              setClubDisplayName('ACM- NIT SURAT');
              setClubShortCode('GENDOC');
              setHeaderMotto('Innovate • Collaborate • Create');
              setPrimaryColor('#0F1E46');
              setAccentColor('#1D63DC');
              setHeadingFont('Times New Roman');
              setBodyFont('Times New Roman');
              setShowCornerWave(true);
            }}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-[13px] font-semibold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw size={15} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveSettings}
            className="bg-[#1D63DC] hover:bg-blue-700 text-white text-[13.5px] font-semibold px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-[12.5px] font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#C7DDFD] text-[#1D4ED8] shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MAIN 2-COLUMN WORKSPACE: LEFT SETTINGS CARDS | RIGHT LIVE A4 BRAND PREVIEW */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">
        {/* LEFT COLUMN: Configuration Sections */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* SECTION 1: CLUB BRANDING & LETTERHEAD ENGINE */}
          {(activeTab === 'branding' || searchQuery.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Palette size={19} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900">
                      Club Identity & Standardized Letterhead
                    </h2>
                    <p className="text-[12px] text-slate-500">
                      Automatically applied to all generated DOCX and PDF templates.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Mandatory Branding Active
                </span>
              </div>

              {/* Club Identity Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    System / Workspace Code
                  </label>
                  <input
                    type="text"
                    value={clubShortCode}
                    onChange={(e) => setClubShortCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-[13px] font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Official Club Title (Letterhead Header)
                  </label>
                  <input
                    type="text"
                    value={clubDisplayName}
                    onChange={(e) => setClubDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-[13px] font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Institute / Organization Name
                  </label>
                  <input
                    type="text"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Right Header Motto / Tagline
                  </label>
                  <input
                    type="text"
                    value={headerMotto}
                    onChange={(e) => setHeaderMotto(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    Standard Document Font Family
                  </label>
                  <select
                    value={headingFont}
                    onChange={(e) => {
                      setHeadingFont(e.target.value);
                      setBodyFont(e.target.value);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-[13px] text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Times New Roman">
                      Times New Roman (Official Academic Serif)
                    </option>
                    <option value="Georgia">Georgia (Modern Serif)</option>
                    <option value="Inter">Inter (Clean Sans-Serif)</option>
                  </select>
                </div>
              </div>

              {/* Color Palette & Wave Ribbon */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">
                      Primary Navy Hex
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {primaryColor}
                    </div>
                  </div>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 bg-white p-0.5"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">
                      Brand Accent Blue
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {accentColor}
                    </div>
                  </div>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-9 h-9 rounded-lg cursor-pointer border border-slate-300 bg-white p-0.5"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-semibold text-slate-800">
                      Top-Right Corner Wave
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      SVNIT Template Ribbon
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showCornerWave}
                    onChange={(e) => setShowCornerWave(e.target.checked)}
                    className="w-4 h-4 accent-[#1D63DC] rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Standardized Footer Text */}
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  Official Footer Stamp (Preserved Across Pages)
                </label>
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-2 text-[12.5px] text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* SECTION 2: AI EXTRACTION GUARDRAILS & GLOBAL CLUB VARIABLES */}
          {(activeTab === 'ai-guardrails' ||
            activeTab === 'branding' ||
            searchQuery.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShieldAlert size={19} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900">
                      AI Extraction Guardrails & Global Variables
                    </h2>
                    <p className="text-[12px] text-slate-500">
                      Prevents AI hallucination of official details and keeps data consistent across all documents.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                  Zero-Fabrication Lock
                </span>
              </div>

              {/* 3 Guardrail Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/30 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12.5px] font-bold text-slate-900">
                      Strict Missing-Field Prompt
                    </span>
                    <input
                      type="checkbox"
                      checked={strictMissingInfoPrompt}
                      onChange={(e) =>
                        setStrictMissingInfoPrompt(e.target.checked)
                      }
                      className="w-4 h-4 accent-[#1D63DC] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Never fabricate missing dates, budgets, or chief guests. Prompt the user before generating.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12.5px] font-bold text-slate-900">
                      Auto-Recommend Doc Types
                    </span>
                    <input
                      type="checkbox"
                      checked={autoDetectDocType}
                      onChange={(e) => setAutoDetectDocType(e.target.checked)}
                      className="w-4 h-4 accent-[#1D63DC] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Automatically recommend Proposal + Permission Letter + Notice from natural language input.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12.5px] font-bold text-slate-900">
                      Cross-Document Sync
                    </span>
                    <input
                      type="checkbox"
                      checked={crossDocSync}
                      onChange={(e) => setCrossDocSync(e.target.checked)}
                      className="w-4 h-4 accent-[#1D63DC] mt-0.5 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    Updating source event dates or venue automatically updates linked club documents.
                  </p>
                </div>
              </div>

              {/* Global Club Variables Table */}
              <div className="pt-1">
                <div className="text-[12.5px] font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Global Template Variables (Auto-Injected)</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    Editable without code changes
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {globalVariables.map((v, idx) => (
                    <div
                      key={v.key}
                      className="grid grid-cols-12 items-center px-3.5 py-2.5 bg-white hover:bg-slate-50/70 text-[12.5px]"
                    >
                      <div className="col-span-4 font-mono text-[11.5px] text-blue-700 font-semibold truncate pr-2">
                        {v.key}
                      </div>
                      <div className="col-span-3 text-slate-600 font-medium">
                        {v.label}
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={v.value}
                          onChange={(e) => {
                            const updated = [...globalVariables];
                            updated[idx].value = e.target.value;
                            setGlobalVariables(updated);
                          }}
                          className="w-full bg-[#F8FAFC] border border-slate-200/90 rounded-lg px-2.5 py-1 text-[12px] font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: REUSABLE CLAUSES & STANDARD BLOCKS */}
          {(activeTab === 'clauses' || searchQuery.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <BookMarked size={19} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900">
                      Reusable Clauses & Dynamic Sections
                    </h2>
                    <p className="text-[12px] text-slate-500">
                      Pre-approved paragraphs that can be inserted into any template via shortcode.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setClauses([
                      ...clauses,
                      {
                        id: `c-${Date.now()}`,
                        title: 'Guest Speaker Honorarium Clause',
                        shortcode: '{{clause_speaker_honorarium}}',
                        category: 'Event Proposal',
                        content:
                          'Travel allowance and honorarium for the external industry speaker will be processed via NEFT upon submission of the session completion report.',
                      },
                    ])
                  }
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Clause</span>
                </button>
              </div>

              <div className="space-y-3">
                {clauses.map((clause) => (
                  <div
                    key={clause.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-[#F8FAFC] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-bold text-slate-900">
                          {clause.title}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-semibold">
                          {clause.shortcode}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[10.5px] font-semibold">
                          {clause.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setClauses(clauses.filter((c) => c.id !== clause.id))
                        }
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove Clause"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">
                      {clause.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: ROLE-BASED ACCESS CONTROL & APPROVAL WORKFLOW */}
          {(activeTab === 'roles-workflow' || searchQuery.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users size={19} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900">
                      Role-Based Access Control (RBAC) & Digital Signatures
                    </h2>
                    <p className="text-[12px] text-slate-500">
                      Manage Draft → Needs Review → Approved workflow and official signatory blocks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-900">
                      Mandatory Faculty Advisor Review
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Marks new Permission Letters as "Needs Review" until approved
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={requireFacultyApproval}
                    onChange={(e) =>
                      setRequireFacultyApproval(e.target.checked)
                    }
                    className="w-4 h-4 accent-[#1D63DC] cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex items-center justify-between">
                  <div>
                    <div className="text-[12.5px] font-bold text-slate-900">
                      Embed Digital Signatures on Approved PDF
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Auto-stamps Chairperson & Faculty Advisor signature block
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDigitalSignature}
                    onChange={(e) =>
                      setEnableDigitalSignature(e.target.checked)
                    }
                    className="w-4 h-4 accent-[#1D63DC] cursor-pointer"
                  />
                </div>
              </div>

              {/* Role Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-4 py-3 bg-white text-[12.5px]"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11.5px] text-slate-500">{m.email}</div>
                    </div>
                    <div className="text-slate-600 text-[12px]">
                      {m.permissions}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {m.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 5: INTEGRATIONS & MULTILINGUAL SUPPORT */}
          {(activeTab === 'integrations' ||
            activeTab === 'branding' ||
            searchQuery.length > 0) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Globe size={19} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900">
                      Workspace Integrations & Multilingual Support
                    </h2>
                    <p className="text-[12px] text-slate-500">
                      Connect Google Drive/Sheets, automated email distribution, and regional language templates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[12.5px] text-slate-900">
                      <HardDrive className="text-blue-600" size={16} />
                      <span>Google Drive Sync</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={integrations.googleDrive}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          googleDrive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#1D63DC] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Auto-saves generated DOCX & PDF files to `/ACM_SVNIT_Docs/2026`.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[12.5px] text-slate-900">
                      <FileSpreadsheet className="text-emerald-600" size={16} />
                      <span>Google Sheets Import</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={integrations.googleSheets}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          googleSheets: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#1D63DC] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Enables batch generation of Participation Certificates & Bills.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-[12.5px] text-slate-900">
                      <Mail className="text-amber-600" size={16} />
                      <span>Email Distribution</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={integrations.emailDistribution}
                      onChange={(e) =>
                        setIntegrations({
                          ...integrations,
                          emailDistribution: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#1D63DC] cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    One-click dispatch of approved notices to SVNIT student mailing lists.
                  </p>
                </div>
              </div>

              {/* Multilingual Document Output Pills */}
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-slate-700">
                  Supported Document Languages:
                </span>
                <div className="flex items-center gap-2">
                  {['English (India)', 'Hindi (राजभाषा)', 'Gujarati'].map(
                    (lang) => {
                      const active = selectedLanguages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1 rounded-lg text-[11.5px] font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-blue-50 text-blue-700 border-blue-300'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {active ? `✓ ${lang}` : lang}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Live A4 Letterhead & Brand Preview Inspector */}
        <aside className="w-full xl:w-[370px] shrink-0 bg-white rounded-2xl border border-slate-200/85 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#1D63DC]" size={16} />
              <span className="text-[14px] font-bold text-slate-900">
                Live Brand & Letterhead Preview
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10.5px] font-semibold">
              Real-Time Sync
            </span>
          </div>

          {/* A4 Sheet Live Preview */}
          <div className="bg-[#F8FAFC] rounded-xl border border-slate-200/70 p-3">
            <div
              style={{ fontFamily: headingFont }}
              className="relative bg-white rounded-lg shadow-sm border border-slate-200/80 px-5 pt-4 pb-4 overflow-hidden min-h-[340px] flex flex-col justify-between"
            >
              {/* Top-Right Dynamic Corner Wave */}
              {showCornerWave && (
                <DocumentCornerWave
                  primaryColor={primaryColor}
                  secondaryColor={accentColor}
                />
              )}

              <div>
                {/* Letterhead Header */}
                <div className="flex items-start justify-between pb-2.5 border-b border-slate-200 relative z-10">
                  <div className="flex items-center gap-2">
                    <DualClubEmblem accentColor="#93C5FD" primaryColor={primaryColor} />
                    <div className="leading-tight">
                      <div
                        style={{ color: primaryColor }}
                        className="text-[12px] font-bold"
                      >
                        {clubDisplayName}
                      </div>
                      <div className="text-[8.5px] text-slate-500 font-sans font-medium">
                        SVNIT Surat
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[7.5px] text-slate-600 font-sans leading-tight max-w-[95px] bg-white/80 px-1 rounded">
                    {headerMotto}
                  </div>
                </div>

                {/* Sample Document Heading */}
                <div className="text-center mt-3 mb-2.5">
                  <div
                    style={{ color: primaryColor }}
                    className="text-[12px] font-bold tracking-wide uppercase"
                  >
                    EVENT PROPOSAL
                  </div>
                  <div
                    style={{ color: accentColor }}
                    className="text-[9px] font-medium"
                  >
                    Web Development Workshop
                  </div>
                </div>

                {/* Sample Auto-Filled Global Variables Table */}
                <div className="border border-slate-200 rounded overflow-hidden text-[8.5px] font-sans">
                  <div className="grid grid-cols-12 border-b border-slate-200">
                    <div className="col-span-5 bg-[#EAEEF7] px-2 py-1 font-semibold text-slate-800 border-r border-slate-200">
                      Organizing Club
                    </div>
                    <div className="col-span-7 px-2 py-1 text-slate-700 truncate">
                      {globalVariables[0]?.value}
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-b border-slate-200">
                    <div className="col-span-5 bg-[#EAEEF7] px-2 py-1 font-semibold text-slate-800 border-r border-slate-200">
                      Faculty Advisor
                    </div>
                    <div className="col-span-7 px-2 py-1 text-slate-700 truncate">
                      {globalVariables[1]?.value}
                    </div>
                  </div>
                  <div className="grid grid-cols-12">
                    <div className="col-span-5 bg-[#EAEEF7] px-2 py-1 font-semibold text-slate-800 border-r border-slate-200">
                      Default Venue
                    </div>
                    <div className="col-span-7 px-2 py-1 text-slate-700 truncate">
                      {globalVariables[4]?.value}
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Signatures & Standardized Footer Stamp */}
              <div className="mt-4 pt-2 border-t border-slate-200 font-sans">
                {enableDigitalSignature && (
                  <div className="flex items-center justify-between text-[7.5px] text-slate-600 mb-2 px-1">
                    <div>
                      <div className="font-serif italic text-[9px] text-blue-800">
                        Kristal Patel
                      </div>
                      <div className="font-semibold text-slate-800">
                        Club Chairperson
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-serif italic text-[9px] text-blue-800">
                        Dr. R. K. Sharma
                      </div>
                      <div className="font-semibold text-slate-800">
                        Faculty Advisor, SVNIT
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-[7px] text-center text-slate-400 truncate">
                  {footerText}
                </div>
              </div>
            </div>
          </div>

          {/* Export & Guardrail Summary */}
          <div className="pt-2 border-t border-slate-100 space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Preserved Formats</span>
              <span className="font-semibold text-slate-800">
                DOCX & PDF (1:1 Layout)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Missing Data Policy</span>
              <span className="font-semibold text-emerald-700">
                {strictMissingInfoPrompt
                  ? 'Ask User (Never Fabricate)'
                  : 'Draft Placeholder'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Approval Pipeline</span>
              <span className="font-semibold text-slate-800">
                {requireFacultyApproval
                  ? 'Draft → Review → Approved'
                  : 'Direct Publish'}
              </span>
            </div>
          </div>

          {/* Track 1 Workflow Health & Compliance Card */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[12px] font-bold text-slate-900">
                Track 1 Workflow Health & Compliance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl border border-slate-100 bg-[#F8FAFC]">
                <div className="text-[9.5px] text-slate-500 font-medium">AI Guardrail</div>
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                  <span className="truncate">Zero-Fabrication</span>
                </div>
              </div>
              <div className="p-2 rounded-xl border border-slate-100 bg-[#F8FAFC]">
                <div className="text-[9.5px] text-slate-500 font-medium">Render Engine</div>
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} className="text-blue-600 shrink-0" />
                  <span className="truncate">DOCX & PDF</span>
                </div>
              </div>
              <div className="p-2 rounded-xl border border-slate-100 bg-[#F8FAFC]">
                <div className="text-[9.5px] text-slate-500 font-medium">Governance</div>
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} className="text-indigo-600 shrink-0" />
                  <span className="truncate">RBAC Pipeline</span>
                </div>
              </div>
              <div className="p-2 rounded-xl border border-slate-100 bg-[#F8FAFC]">
                <div className="text-[9.5px] text-slate-500 font-medium">Cloud Archive</div>
                <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={12} className={integrations.googleDrive ? 'text-emerald-600 shrink-0' : 'text-slate-400 shrink-0'} />
                  <span className="truncate">Google Drive</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ClubSettingsView;
