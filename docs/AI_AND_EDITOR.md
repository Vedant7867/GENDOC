# AI generation, editor and export: setup and behaviour

## 1. Turn the AI on (server side only)
1. Get a Gemini API key from Google AI Studio.
2. `backend/.env` (copy `backend/.env.example`; the real file is git-ignored):
   ```
   GENDOC_LLM_PROVIDER=gemini
   GEMINI_API_KEY=your-key
   # GENDOC_LLM_MODEL=   (empty = gemini-2.5-flash; set it if Google renames or retires a model)
   ```
   With Docker: export `GEMINI_API_KEY` in your shell (or an `.env` next to `docker-compose.yml`) before `docker compose up`.
3. Restart the backend. The key is read only by the server; the browser never receives it.

No key? The app still starts. "Describe your event", "Draft with AI", free-form forms and Copilot answer with a clear
"AI is not configured" message; forms, templates, documents, the editor and export keep working.
A rejected key, a rate limit or an unknown model each produce their own readable message (never the key itself).
Claude can be used instead with `GENDOC_LLM_PROVIDER=anthropic`, `ANTHROPIC_API_KEY` and `pip install anthropic`.

## 2. Run everything
```
cd backend && docker compose up --build        # API on :8000, MongoDB, seeded club/templates/demo users
npm install && npm run dev                      # frontend on :5173 (VITE_API_URL defaults to http://localhost:8000/api)
```
Demo sign-in: `kristal.patel@svnit.acm.org` / `Password123!` (Club Member). `admin@`, `coordinator@`, `faculty@` use the same password.

## 3. What each screen does now
- **Templates** (from MongoDB via `/api/templates`): real list, categories, usage counts, real preview and required-field list.
  Club Admin: Add (copy of the selected template), Edit details, Delete. Others: browse and use.
- **Describe your event**: text -> `/generator/extract` -> review what was found (marked) -> fill missing required details
  -> `/generator/generate` -> `POST /documents`. Official details (names, IDs, money, contacts) come only from what you wrote or
  type yourself; they are never invented. One sentence can create several documents at once.
- **Fill a form / Use template**: the form is built from the template's real fields. "Draft with AI" is offered only for
  non-official text fields; AI text is highlighted and blocks export until accepted.
- **Free-form**: the AI designs a form from your description; it is shown for review. A Club Admin saves it as a template
  before a document can be created from it (other roles are told to ask an admin).
- **Editor** (TipTap): opens a document by id, autosaves a working copy every 30 s, Save creates a numbered version,
  version history and restore, conflict detection, read-only for Completed documents and for roles that cannot edit,
  leave-with-unsaved-changes dialog, tables, lists, alignment, zoom, PDF/DOCX download of the latest saved version.
- **Copilot** (right panel): suggestions only. You accept or reject each one; accepting applies it to the open document
  (undo with Ctrl+Z). Server-side guards reject suggestions that add new figures, touch tables, or change filled-in values.

## 4. Export
`GET /api/documents/{id}/export?format=pdf|docx` exports the latest **saved** version, never the unsaved draft, and is
blocked (409 `unaccepted_ai_text`) while AI-drafted text remains. PDF: WeasyPrint with club colours, font, header and
footer. DOCX: Pandoc. The Dockerfile installs both (pango + pandoc). The PDF is the reference rendering; the DOCX is a
faithful but not pixel-identical copy and does not yet carry the club header/footer (needs a club `reference.docx`).

## 5. Tests
- Backend: `cd backend && python -m pytest -q` (82 tests; AI is faked, MongoDB is mocked in memory).
- Frontend: `npm test` (editor round-trip on real rendered templates, Copilot apply rules).
- Live end to end (real frontend client + editor against the real API with an in-memory database and a scripted AI):
  `cd backend && python -m scripts.e2e_server` in one terminal, then `npm run test:e2e`.

## 6. Known limits (please read)
- Not tested here: a real Gemini call, a real MongoDB server, a real browser session. Run the Docker flow once with your key.
- The model name `gemini-2.5-flash` is the default; Google may retire it, so it is configurable.
- Empty optional fields are not kept as markers once a document is saved from the editor (an editor cannot hold an empty mark).
  Filled-in values keep their `data-field` marker.
- A template's body (layout) cannot be edited in the UI yet; admins can copy, rename, re-categorise and delete templates.
- The editor keeps what the backend allows: no code blocks, links, images or merged table cells. Cell widths set in a template are not kept.
- Club Settings and the Events tab still contain demo content that was not part of this work.
- `ENFORCE_REQUIRED_FIELDS` is `"false"` in `docker-compose.yml`; switch to `"true"` when you want the server to refuse incomplete documents.
