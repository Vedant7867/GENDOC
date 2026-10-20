# Templates module: integration notes

Everything lives in `backend/app/modules/templates/`. **No existing file needs editing** except one
`install(...)` call. Only `deps.py` knows about the rest of the app.

## Wire-up (3 lines)
```python
from app.modules import templates
templates.install(app, get_db=get_db, get_current_user=get_current_user)  # prefix defaults to /api
```
* `get_db()` returns the Motor database (plain callable, sync or async).
* `get_current_user` is your JWT dependency; it may return a dict or an object with `id`, `clubId`/`club_id`, `role`, `name`.
* `pip install nh3` (see `requirements-templates.txt`). Optionally add the CSS in `print.templates.css` to the shared `print.css`.
* First `GET /templates` for a club auto-seeds the 17 built-ins, so signup and the club seed need no change.
  Or call `await templates.seed_templates(db, club_id)` from your seed script, or `python -m scripts.seed_templates --all-clubs`.

## Endpoints (all under /api, club taken from the token)
| Method + path | Who | Notes |
|---|---|---|
| `GET /templates?q&category&sort=order\|title\|mostUsed\|recent` | any | list, **no html**; `{items,total}` |
| `GET /templates/categories` | any | tab counts incl. `All` |
| `GET /templates/{id}` | any | full template with `html` + `fields` |
| `GET /templates/by-type/{templateType}` | any | for the generator |
| `POST /templates/{id}/preview` | any | body `{values, useExamples}` -> `{html, missingRequired}` |
| `POST /templates` , `PATCH /templates/{id}` , `DELETE /templates/{id}` | Club Admin | PATCH takes optional `baseVersion` (409 `version_conflict`); DELETE is soft |
| `POST /templates/{id}/duplicate` | Club Admin | "customise a copy" |
| `POST /templates/{id}/reset` | Club Admin | restore a built-in to shipped version |
| `POST /templates/restore-defaults` | Club Admin | bring back deleted/missing built-ins |
| `POST /templates/validate` | Club Admin | dry-run for a template editor: sanitized html, errors, warnings |

List item JSON already matches the frontend's `TemplateItem` (`usedCount`, `isMostUsed`, `versionLabel`,
`previewHeading`, `wireframeVariant`, `formats`, `createdBy`, `updatedAt`) plus the contract's
`DocumentTemplate` fields (`iconName`, `theme`, `suggestedPrompt`, `templateType`).
`usedCount` is counted live from `documents.templateId` (non-deleted, same club): **no hook in documents code.**

## Template authoring rules (enforced on every save)
* HTML is sanitized with the contract s.4 allow-list (`html_rules.sanitize_html`; the documents owner can import it too).
* Every `{{key}}` must be a defined field; every **required** field must appear in the html.
* `list` fields sit alone in a list: `<ul>{{key}}</ul>`. `table` fields are one row: `<tr><td>{{key}}</td></tr>`
  (HTML parsers eject bare text from `<tbody>`). Rendering expands them to `<li data-field>` / `<tr data-field>`.
* Inline values render as `<span data-field="key">value</span>` (values are HTML-escaped).
* `render.render_html()` is reusable by the generator so previews and real documents wrap values identically.

## Please write these into the contract (it says to change it before coding)
1. `templates` gains: `clubId`, `key` (slug, unique per club), `isSystem`, `customized`, `catalogVersion`, `sortOrder`,
   `previewHeading`, `wireframeVariant`, `formats`, `createdBy`, `createdByName`, `createdAt`, `updatedAt`, `deletedAt`.
   Index: unique `(clubId, key)`.
2. Field items gain optional `group`, `helpText`, `placeholder`, `defaultValue`, `example`, `options` (select),
   `columns` (table), `autoNumber`, `prefill` (`club.name` or `signatory:<Title>`, a hint so the generator asks less).
   Types: `text, textarea, date, number, currency, select, list, table`.
3. New endpoints in the table above; errors may carry an optional `details` array next to `code`/`message`.
4. The contract PDF lost its hyphens in text extraction: I assumed the data attributes are **`data-field`** and **`data-ai`**.
5. `colspan`/`rowspan` are not in the allowed attributes, so no template uses them. Consider allowing them for tables.
6. Shared field vocabulary (`seed/common.py`): the same key means the same thing in every template
   (`eventTitle, eventDate, venue, summary, expectedAttendance, budgetTotal, studentHead*, facultyChairman*`...).
   The generator can fill one event sentence into all documents. Summary fields of `documents` reuse its names.

## Merge-safety
* New files only, under one folder + `scripts/seed_templates.py` + tests. Nothing in `src/` (frontend) is touched.
* Seeding never overwrites admin edits (`customized`); `--sync` only refreshes untouched built-ins with a newer `catalogVersion`.
* Defaults for the F&SW chairman / Associate Dean / Dean names come from your sample PDF and are editable fields, not hard-coded text.

## Not done (left for later)
Template version history, per-template permissions beyond Club Admin, computed totals (sum of table rows) and a
template editor UI (`/validate` and `/preview` are there for it).
