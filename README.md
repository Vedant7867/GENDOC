# GENDOC

**GENDOC** helps a student club (built for the ACM NIT Surat Student Chapter) create official documents quickly: event proposals, permission letters, certificates, bill summaries, minutes and more.

You describe your event in plain English, or fill in a form. GENDOC builds a properly formatted document from a template, lets you edit it, keeps every saved version, and exports it as PDF or Word.

---

## Part 1: What it does (plain words)

### The big idea

Official club documents must look the same every time. So GENDOC does **not** let an AI invent the layout or the facts. Instead:

1. The documents are built from fixed **templates** (the "blanks to fill in").
2. The AI only **reads your sentence** and works out which details go in which blank, and (optionally) **drafts wording** for non-official text.
3. Official details (names, IDs, money amounts, contacts) are **never invented**. If you did not write one, GENDOC asks you to type it.

### What you can do

| Feature | What it means for you |
| --- | --- |
| **Describe your event** | Type something like *"Two-day Web Development Workshop on 14–15 October in Seminar Hall for around 120 students."* GENDOC picks out the details, shows you what it found, asks for anything missing, then creates the document(s). One sentence can create several documents at once (for example a proposal and a permission letter). |
| **Fill a form** | Pick a template and answer its questions step by step. No AI needed. |
| **Draft with AI** | On normal text fields (not official ones) you can ask the AI for a first draft. AI text is highlighted and you must accept it before you can export. |
| **Free-form** | Describe a document that has no template; the AI designs a form for it. A Club Admin must save it as a template before a document can be made from it. |
| **Templates** | Ready-made catalog of 17 templates. Club Admins can copy, rename, re-categorise or delete them. |
| **Documents page** | List, search, folders, rename, change status, duplicate, delete. |
| **Editor** | Edit the document in the browser (tables, lists, alignment, zoom). |
| **Copilot** | A side panel that *suggests* edits. Nothing changes until you accept a suggestion. |
| **Versions** | Every Save makes a numbered version. You can look at old versions and restore one. |
| **Export** | Download the latest saved version as PDF or Word (DOCX). |
| **Club Settings** | Club name, colours, font, header and footer used on exports. |

### How it works, step by step

```
You type a sentence ──► Backend asks the AI to find the details
                                   │
                                   ▼
                 Details are checked: official ones must appear
                 word-for-word in what you wrote, otherwise "missing"
                                   │
                                   ▼
                 You review, then fill in anything missing
                                   │
                                   ▼
        Template + your details ──► document HTML (cleaned by a sanitizer)
                                   │
                                   ▼
              Saved as a document (Version 1) in the database
                                   │
                                   ▼
        Edit in the editor ──► Save = new version ──► Export PDF / DOCX
```

Key points:

- **Nothing is saved by the generator itself.** It only prepares the document; the normal Documents API saves it.
- **Autosave:** while editing, a working copy is saved every 30 seconds. It is *not* a version until you press Save.
- **Export uses saved versions only**, never the autosaved copy.
- **Export is blocked while AI-drafted text is unaccepted.** Accept or remove it first.
- **Conflicts:** if someone else saved while you were editing, you are warned instead of silently overwriting.
- **Completed documents are locked** (read-only).

### Who can do what (roles)

| Role | Summary |
| --- | --- |
| **Club Member** | Create documents; edit, send for review and delete (only drafts) their **own** documents. |
| **Core Coordinator** | Edit any document, send for review, mark Completed, reopen, delete non-completed documents. |
| **Club Admin** | Everything a Coordinator can, plus delete any document and manage templates. |
| **Faculty Advisor** | Review only: can send a document back to Draft or mark it Completed. Cannot create or edit, and cannot use the generator. |

Document status goes **Draft → Needs Review → Completed**. Needs Review can go back to Draft; Completed can be reopened to Draft by a Coordinator or Admin.

New sign-ups are always **Club Member**. There is no screen yet for changing someone's role.

---

## Part 2: For developers

### Tech used

- **Backend:** Python 3.11, FastAPI, MongoDB (via Motor), JWT login, Argon2 password hashing.
- **Sanitizing:** `nh3` cleans all document HTML against an allow-list.
- **AI:** Google Gemini by default (`google-genai`); Claude (Anthropic) optional.
- **Export:** WeasyPrint (PDF) and Pandoc (DOCX).
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TipTap editor.

### Project layout

```
GENDOC
├── backend
│   ├── app
│   │   ├── main.py            App setup; plugs in the modules below
│   │   ├── config.py          Settings read from environment / .env
│   │   ├── deps.py            Login check (who is the current user)
│   │   ├── security.py        Passwords and JWT tokens
│   │   ├── permissions.py     Role rules and status changes
│   │   ├── exporter.py        PDF and DOCX export
│   │   ├── sanitize.py        Thin wrapper over the shared HTML sanitizer
│   │   ├── seed.py            Demo data (dev only)
│   │   ├── routers/           auth, club, documents (and a small legacy templates reader)
│   │   └── modules
│   │       ├── templates/     Template catalog, admin CRUD, preview, validate, usage counts
│   │       │   └── seed/      The 17 built-in templates
│   │       └── generator/     extract, draft, generate, free-form, Copilot, AI providers
│   ├── scripts/               e2e_server.py, seed_templates.py
│   ├── tests/                 Backend tests
│   ├── Dockerfile, docker-compose.yml
│   └── requirements*.txt
├── docs                       Detailed notes: AI_AND_EDITOR, GENERATOR_MODULE, TEMPLATES_MODULE
├── src                        Frontend
│   ├── api/                   client.ts (all server calls), types, permissions
│   ├── components/            Screens and pop-ups; components/generator/ is the creation wizard
│   ├── editor/                TipTap setup, block helpers, editor tests + sample templates
│   └── e2e/                   Live end-to-end test
└── frontend-changes           Older copy of changed frontend files (see "Housekeeping")
```

### How the pieces fit together

- `main.py` builds the app and calls `templates_module.install(...)` and `generator_module.install(...)`. The modules **do not import** the app's login or database code; they are handed them. This keeps them independent.
- A document stores the template it came from (`templateId`). Template "used" counts are calculated from documents, so there is no counter to keep in sync.
- All HTML (templates, documents, Copilot suggestions, export) goes through the one sanitizer in `modules/templates/html_rules.py`.
- Filled-in values are wrapped as `<span data-field="key">`; AI text as `<span data-ai="draft">`.
- The AI sits behind one small interface (`complete_json`), so providers can be swapped and tests can use a fake.
- Copilot has code-level guards (not just prompt rules): it cannot edit tables, change filled-in values, or add figures that are not already in the document.
- Main API groups (all under `/api`): `/auth`, `/club`, `/documents`, `/templates`, `/generator`, plus `/health`. Interactive docs are at `/docs` when the server runs.

### Run it

**Backend with Docker (easiest)** - starts MongoDB, the API and demo data at http://localhost:8000 (docs at `/docs`):

```bash
cd backend
docker compose up --build
```

**Backend without Docker** (needs MongoDB running):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
# create backend/.env (see settings below)
python -m app.seed                 # add --reset to start over
uvicorn app.main:app --reload --port 8000
```

PDF/DOCX export needs WeasyPrint's system libraries (pango) and Pandoc. The Dockerfile installs them. If they are missing, export returns a clear `501` message and everything else still works.

**Frontend:**

```bash
npm install
npm run dev                        # http://localhost:5173
```

The frontend talks to `http://localhost:8000/api` by default. To change it, set `VITE_API_URL` (for example in `.env.local`).

### Settings (`backend/.env`)

The real `.env` is not committed (it holds secrets). Create it yourself with these names:

| Setting | Default | Meaning |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB address |
| `DB_NAME` | `gendoc` | Database name |
| `JWT_SECRET` | `dev-secret-change-me` | Login signing key. **Change this** |
| `JWT_EXPIRE_MINUTES` | `720` | Login lasts 12 hours |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend address(es), comma-separated |
| `ENFORCE_REQUIRED_FIELDS` | `true` | Refuse documents with missing required fields |
| `ALLOW_ROLE_SELF_SELECT` | `false` | Demo only: let sign-ups choose their role |
| `GENDOC_LLM_PROVIDER` | empty | `gemini`, `anthropic`, or empty (uses whichever key is set, Gemini first) |
| `GEMINI_API_KEY` | empty | Turns on AI with Gemini (key from Google AI Studio) |
| `GENDOC_LLM_MODEL` | empty | Override the model (default `gemini-2.5-flash`) |
| `ANTHROPIC_API_KEY` | empty | Only if using Claude (also `pip install anthropic`) |

**No AI key?** The app still starts. Only the AI features (Describe your event, Draft with AI, Free-form, Copilot) show "AI is not configured". Forms, templates, documents, editor and export keep working. The key stays on the server and is never sent to the browser.

Note: `docker-compose.yml` currently sets `ENFORCE_REQUIRED_FIELDS` to `"false"`. Switch it to `"true"` to have the server refuse incomplete documents.

### Demo accounts (dev only)

Password for all: `Password123!`

| Email | Role |
| --- | --- |
| kristal.patel@svnit.acm.org | Club Member |
| coordinator@svnit.acm.org | Core Coordinator |
| admin@svnit.acm.org | Club Admin |
| faculty@svnit.acm.org | Faculty Advisor |

### Tests

```bash
cd backend && python -m pytest -q     # backend (AI is faked; MongoDB is mocked in memory)
npm test                              # frontend: editor + Copilot rules
# live end-to-end:
cd backend && python -m scripts.e2e_server      # terminal 1
npm run test:e2e                                # terminal 2
```

The backend tests use an in-memory fake database, not a real MongoDB. Run the Docker flow once and click through the app before relying on it.

### Known limits

- A real Gemini call, a real MongoDB server and a real browser session were not covered by the automated tests.
- Gemini model names can be retired by Google; that is why the model is configurable.
- A template's layout cannot be edited in the UI yet (admins can copy, rename, re-categorise, delete).
- The editor allows only what the backend allows: no code blocks, links, images or merged table cells.
- DOCX export is close to, but not identical to, the PDF and does not yet include the club header/footer.
- Empty optional fields are not kept as markers once a document is saved from the editor.
- The Events tab and parts of Club Settings still show demo content.

### Differences from the original contract

| Contract | What the code does |
| --- | --- |
| Wrong club returns 403 | Documents return 404 (so IDs cannot be probed); templates return 403 |
| Strict status table | Also allows Needs Review → Draft |
| Role chosen at sign-up | Always Club Member |
| Text search index | Case-insensitive regex search |
| One timestamp format | Documents use milliseconds, templates whole seconds |

### Before going live

Set a long random `JWT_SECRET`, do not run the demo seed, use HTTPS, and set `ENFORCE_REQUIRED_FIELDS` to `true`.

### Housekeeping

- `frontend-changes/` and `backend/app/modules/templates.zip` look like leftovers from merging; they are not needed to run the app.
- `backend/dev_main.py` is a small dev-only server for trying the templates module on its own.

### More detail

See `docs/AI_AND_EDITOR.md`, `docs/GENERATOR_MODULE.md`, `docs/TEMPLATES_MODULE.md` and `backend/README_MERGE_NOTES.md`.