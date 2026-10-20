# Generator module (`backend/app/modules/generator/`)

Mounted from `backend/app/main.py` (`generator_module.install(...)`) at `/api/generator/*`. Requires sign-in; Faculty Advisors get 403.

## Why templates + AI, not "AI writes the HTML"
The five official forms must look identical every time, so they stay fixed templates. The AI only
(1) reads the user's sentence into field values and (2) optionally drafts wording for non-official text fields.
Free-form mode is the only place the AI designs layout, and its output goes through the same sanitizer and validator.

## Flow
1. `POST /api/generator/extract` `{templateIds:[...], text, values?}` -> `{templates, values, extractedKeys, missing:{templateId:[field...]}}`.
   One sentence can feed several documents (proposal + permission letter) because field keys are shared.
   Club-record prefills (`club.name`, `signatory:<Title>`) and template defaults are applied, so the user is not asked for them.
2. optional `POST /api/generator/draft` `{templateId, values, keys}` -> `{drafts, rejected}`. Official fields are refused;
   drafts containing figures that are not in the user's details are rejected.
3. `POST /api/generator/generate` `{templateId, values, aiKeys, title?}` -> `{document, templateType, aiDraftFields, requiresTemplateSave}`.
   `document` is exactly the body of `POST /api/documents`; send it unchanged. Incomplete input -> `422 missing_required_fields`
   with `error.fields`. Nothing is saved by the generator.
4. Free-form: `POST /api/generator/freeform` `{prompt}` -> `{template (unsaved), values, missing}`; then call `generate` with
   `template:` instead of `templateId:`. The result has `requiresTemplateSave: true`: an admin keeps the template with
   `POST /api/templates` first, because `POST /api/documents` needs a stored template.

## Safety rules enforced in code
- Official values (names, IDs, money, contacts) are kept only if they appear verbatim in the user's text; otherwise they become "missing".
- Unknown keys, wrong shapes and invalid select options are dropped. Free-form fields whose key/label looks official are forced `official`.
- AI text is wrapped in `<span data-ai="draft">`; the documents API reports `hasUnacceptedAiText` and export returns `unaccepted_ai_text`.
- The user's text is passed as quoted data to the model. LLM/network failure -> `502 llm_error`; no key -> `503 llm_unavailable`.

## Configuration
Gemini is the default provider: `GEMINI_API_KEY`, `GENDOC_LLM_PROVIDER=gemini`, optional `GENDOC_LLM_MODEL`. See `docs/AI_AND_EDITOR.md`. Pass `llm=` to `create_app` / `install` to inject another provider.

## Open decisions
- Free-form documents need their template saved first (admin only). Alternative: auto-save them as hidden custom templates.
- PDF/DOCX export remains the documents owner's endpoint.
