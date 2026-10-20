# GENDOC merged backend

This folder combines the Documents backend and the full Templates module.

## Integration decisions
- The existing FastAPI app, Mongo connection, JWT authentication, club permissions, document/version API, and frontend compatibility code are retained.
- The full template catalog/CRUD module is registered at `/api/templates`. Its existing dependencies are injected from `app.deps`; no second auth or database implementation was added.
- The former minimal template reader is kept at `/api/legacy/templates` to avoid silently discarding it.
- Template module records are distinguished by a `key` field, so old seeded template records in the shared Mongo `templates` collection do not break category/catalog queries. Missing catalog templates are seeded idempotently.
- Document creation accepts both legacy string template IDs and ObjectId IDs from the new template module.
- Requirements and pytest configuration are combined; test fixture path setup is retained.

## Run
From `backend/`: `pip install -r requirements-dev.txt`, configure `.env`, then `uvicorn app.main:app --reload`.

Run tests from `backend/`: `pytest`.

## Generator module (added on top of the merge)
- `app/modules/generator/` is mounted at `/api/generator/*` from `main.py` with the same injected db and token
  dependency as the templates module. Endpoints: `extract`, `draft`, `generate`, `freeform`.
- `POST /api/generator/generate` returns `{document, templateType, aiDraftFields, requiresTemplateSave}`.
  `document` is exactly the body of the existing `POST /api/documents` (that endpoint stays the only writer).
- Missing required fields use the app's own shape: `422 missing_required_fields` with `error.fields`.
- AI-written passages are wrapped in `data-ai="draft"`, which the existing `has_ai_draft` / export check already honours.
- Official fields are never AI-written: values must appear verbatim in the user's text, otherwise they are asked for.
- `templates.install` / `generator.install` now build their dependencies per app (no module-level globals), so
  several apps in one process (tests, reloaders) no longer share a database.
- AI keys are optional at startup (Gemini by default, see `docs/AI_AND_EDITOR.md`). Without a key only `/generate` works (it needs no AI).
- Housekeeping: `backend/app/modules/templates.zip` is a leftover upload and can be deleted.

