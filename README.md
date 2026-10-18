# GENDOC — ACM- NIT SURAT 📄✨

> **Smart Automated Document Generation & Governance Platform**  
> Tailored for the **ACM Student Chapter**, Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat.

---

## 📌 Overview

**GENDOC** is an enterprise-grade web application designed to eliminate administrative friction in student club operations. Built for **ACM- NIT SURAT**, it empowers club coordinators, faculty advisors, and members to generate, review, format, and sign official academic proposals, SAC budget estimates, permission letters, and notices in seconds.

With **Zero-Fabrication AI Guardrails**, standardized institute letterhead formatting, and multi-tier approval workflows, GENDOC ensures every exported document (DOCX & PDF) strictly adheres to SVNIT institutional standards.

---

## 🚀 Key Features

### 🔐 1. Stage 1: Authentication Gate & RBAC
- Role-based session management (`Club Admin`, `Faculty Advisor`, `Core Coordinator`, `Club Member`).
- Persistent session storage in `localStorage` with one-click demo credentials.
- Strict signatory access control for faculty advisor sign-offs and digital stamp authorizations.

### ⚡ 2. Dual-Engine Generation
- **Natural Language Event Extraction:** Paste raw event ideas or WhatsApp coordinator blurbs — the AI automatically extracts event dates, objectives, venues, and budgets without hallucinating missing fields.
- **Guided Form Wizard:** Structured multi-step modal to build end-to-end proposals with SAC-compliant financial tables.

### 📝 3. Document Template Gallery
Pre-approved, compliant academic templates equipped with dynamic mini-A4 previews and top-right SVNIT ribbon headers:
- 📋 **Event Proposal & SAC Approval**
- 🏛️ **Venue Allotment & Permission Letter**
- 💰 **SAC Budget Estimate & Expenditure Sheet**
- 📢 **Official Circular & Event Notice**
- 🎓 **Student On-Duty (OD) Attendance Relief Notice**
- 🤝 **External Speaker Invitation & Honorarium Undertaking**
- 📜 **Student Participation Certificate**

### ✍️ 4. Full Document Editor & AI Copilot
- **Word-Processor Ribbon Toolbar:** Rich typography, headings, lists, tables, alignment, and zoom controls.
- **Pixel-Accurate A4 Canvas:** Real-time editable document canvas styled with official letterhead, dual-emblem SVNIT/ACM branding, and signatory blocks.
- **AI Copilot Sidebar:** In-context assistant to polish tone, rewrite formal clauses, check SAC policy compliance, and insert approved institute shortcodes.

### ⚙️ 5. Club Settings & Governance Hub
- **Standardized Letterhead Branding:** Custom color palettes (Primary Navy `#0F1E46`, Accent `#1D63DC`), academic font pairing (*Times New Roman / Georgia / Inter*), and dynamic SVG corner ribbons.
- **Live A4 Letterhead Preview Inspector:** Sticky real-time synchronized sheet reflecting changes to club mottos, digital signatures, and global variables.
- **Zero-Fabrication Guardrails:** Hard limits preventing AI hallucination of unconfirmed dates, venues, or budgets.
- **Global Variables Registry:** Single-source-of-truth mapping for `{{faculty_advisor}}`, `{{dean_sw}}`, `{{organizing_club}}`, and more.
- **Reusable Clauses Library:** Pre-approved disciplinary undertakings, OD relief statements, and SAC GST reimbursement clauses inserted via shortcode.
- **Cloud Integrations & Multilingual Support:** Automated export to Google Drive, batch certificate sync via Google Sheets, and multilingual draft generation (English, Hindi, Gujarati).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) |
| **Build Tool & Server** | [Vite](https://vitejs.dev/) |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/) + PostCSS + Custom Academic Themes |
| **Iconography** | [Lucide React](https://lucide.dev/) + Custom Brand SVGs |
| **State & Persistence** | React Hooks (`useState`, `useRef`, `useEffect`) + Browser `localStorage` |

---

## 📂 Project Architecture

```
e:\GENDOC/
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind design tokens & themes
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite server configuration
├── src/
│   ├── main.tsx                # React DOM render entry
│   ├── index.css               # Global CSS, print styles & typography
│   ├── App.tsx                 # Master routing, authentication & state coordination
│   ├── types/
│   │   └── index.ts            # Data models, Document, Template, User & Role types
│   ├── utils/
│   │   └── storage.ts          # LocalStorage persistence utilities & seed datasets
│   └── components/
│       ├── BrandLogo.tsx              # Glowing 4-point star SVG & club emblems
│       ├── Sidebar.tsx                # Left navy navigation bar (`#0B132B`)
│       ├── Header.tsx                 # Search bar, notifications, and profile dropdown
│       ├── HeroSection.tsx            # Dashboard hero greeting & quick stats
│       ├── DualActionCards.tsx        # "Describe event" + "Fill a form" launchers
│       ├── RecentDocumentsCard.tsx    # Recent documents list with status pills
│       ├── BrowseTemplatesCard.tsx    # Horizontal template carousel with preview
│       ├── DocumentsView.tsx          # Full documents screen with folder views & filters
│       ├── TemplatesView.tsx          # Full template library with category filter pills
│       ├── DocumentEditorView.tsx     # Fullscreen A4 editor with ribbon & AI Copilot
│       ├── ClubSettingsView.tsx       # 5-tab settings & live A4 letterhead inspector
│       ├── AuthModal.tsx              # Stage 1 login / sign-up modal gate
│       ├── ExtractionModal.tsx        # AI natural language extraction workflow modal
│       ├── FormWizardModal.tsx        # Multi-step proposal creation modal wizard
│       ├── DocumentPreviewModal.tsx   # Document preview & export modal
│       ├── TemplateQuickStartModal.tsx# Template inspection & quick-start modal
│       ├── NotificationsModal.tsx     # Activity drawer & review alerts
│       └── HelpSupportModal.tsx       # FAQ & academic guidelines modal
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vedant7867/GENDOC.git
   cd GENDOC
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔑 Demo Access Credentials

To test the role-based workflows immediately:

| Role | Name | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **Club Admin** | Kristal Patel | `kristal.patel@acmsvnit.org` | Full access, settings & branding edits |
| **Faculty Advisor** | Dr. R. K. Sharma | `rksharma@coed.svnit.ac.in` | Document approvals, digital signature block |
| **Core Coordinator** | Aarav Mehta | `aarav.m@acmsvnit.org` | Create, edit drafts, export documents |

---

## 📄 License & Attribution

Developed with ❤️ for **ACM Student Chapter**, Department of Computer Science & Engineering, Sardar Vallabhbhai National Institute of Technology (SVNIT), Surat.
