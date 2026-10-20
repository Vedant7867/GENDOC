from __future__ import annotations

from typing import Any

from bson import ObjectId

from ..templates import service as tsvc
from ..templates.deps import Caller
from ..templates.errors import TemplateError
from ..templates.render import render_html
from .copilot import run_copilot
from .draft import draft_fields
from .extract import extract_values, merge_fields
from .freeform import design_template
from .llm import LLM, LLMError, LLMModelUnavailable, LLMNotConfigured, LLMRateLimited
from .missing import missing_fields, resolve_values

# keys that the contract's `documents` record keeps as summary fields
SUMMARY_KEYS = ("venue", "eventDate", "expectedAttendance", "budgetTotal", "summary", "organizer")


async def _club(db, who: Caller) -> dict | None:
    try:
        doc = await db["clubs"].find_one({"_id": ObjectId(who.club_id)})
    except Exception:
        doc = None
    return doc


async def _resolve(db, who: Caller, template_id: str | None, inline) -> dict:
    """-> {"id","title","templateType","html","fields"}; inline specs are re-validated."""
    if template_id:
        t = await tsvc.get_template(db, who, template_id)
        return {k: t[k] for k in ("id", "title", "templateType", "html", "fields")}
    spec = inline.model_dump()
    fields = [{"type": "text", **f} for f in spec["fields"]]
    html, errors, _ = tsvc.validate_content(spec["html"], fields)
    if errors:
        raise TemplateError(422, "validation_error", errors[0]["message"], errors)
    return {"id": None, "title": spec["title"], "templateType": spec.get("templateType") or spec["title"],
            "html": html, "fields": fields}


async def _llm_call(coro):
    """Run an AI call and turn every provider failure into the app's error shape. Non-AI endpoints never reach this."""
    try:
        return await coro
    except LLMNotConfigured as e:  # includes rejected keys
        raise TemplateError(503, "llm_unavailable", str(e))
    except LLMRateLimited as e:
        raise TemplateError(429, "llm_rate_limited", str(e))
    except LLMModelUnavailable as e:
        raise TemplateError(502, "llm_model_unavailable", str(e))
    except LLMError as e:
        raise TemplateError(502, "llm_error", str(e))
    except TemplateError:
        raise
    except Exception as e:  # unexpected provider/SDK failure; never leak internals
        raise TemplateError(502, "llm_error", f"The AI service failed ({type(e).__name__}).")


def _slim(t: dict) -> dict:
    return {"id": t["id"], "title": t["title"], "templateType": t["templateType"]}


async def extract(db, who: Caller, llm: LLM, body) -> dict:
    """One sentence about an event -> values for one or more documents."""
    if not body.templateIds and not body.template:
        raise TemplateError(422, "validation_error", "Give templateIds or a template")
    tpls = [await _resolve(db, who, i, None) for i in body.templateIds]
    if body.template:
        tpls.append(await _resolve(db, who, None, body.template))
    union = merge_fields(tpls)
    found = await _llm_call(extract_values(llm, union, body.text))
    club = await _club(db, who)
    values = {**found, **{k: v for k, v in body.values.items() if v not in (None, "", [], {})}}
    resolved = {t["id"] or "inline": resolve_values(t["fields"], values, club) for t in tpls}
    merged = {}
    for r in resolved.values():
        merged.update(r)
    return {
        "templates": [_slim(t) for t in tpls],
        "values": merged,
        "extractedKeys": sorted(found),
        "missing": {(t["id"] or "inline"): missing_fields(t["fields"], resolved[t["id"] or "inline"]) for t in tpls},
    }


async def draft(db, who: Caller, llm: LLM, body) -> dict:
    t = await _resolve(db, who, body.templateId, body.template)
    return await _llm_call(draft_fields(llm, t["fields"], body.values, body.keys))


# Column limits of the documents API (DocumentCreateIn); values are trimmed so the body is always accepted.
_SUMMARY_LIMITS = {"venue": 300, "eventDate": 200, "expectedAttendance": 100, "budgetTotal": 100,
                   "summary": 2000, "organizer": 200}


async def generate(db, who: Caller, body) -> dict:
    """Render the document. `document` is EXACTLY the body of POST /documents (that endpoint stays the only
    writer of documents); nothing is saved here. Incomplete input -> 422 missing_required_fields."""
    t = await _resolve(db, who, body.templateId, body.template)
    values = resolve_values(t["fields"], body.values, await _club(db, who))
    miss = missing_fields(t["fields"], values)
    if miss:
        raise TemplateError(422, "missing_required_fields",
                            "Some required fields are missing. Ask the user for them; they are never guessed.",
                            fields=[m["key"] for m in miss])
    official = {f["key"] for f in t["fields"] if f.get("official")}
    ai = {k for k in body.aiKeys if k in values and k not in official}  # official fields are never AI text
    html = render_html(t["html"], t["fields"], values, ai_keys=ai)
    title = body.title or " – ".join(x for x in (t["templateType"], values.get("eventTitle")) if x)
    document = {"title": title[:200], "templateId": t["id"], "fields": values, "content": html}
    for k, limit in _SUMMARY_LIMITS.items():
        v = values.get(k)
        if isinstance(v, (str, int, float)) and not isinstance(v, bool) and str(v).strip():
            document[k] = str(v).strip()[:limit]
    return {"document": document, "templateType": t["templateType"], "aiDraftFields": sorted(ai),
            # free-form templates are unsaved: POST /documents needs a stored template, so an admin saves it first
            "requiresTemplateSave": t["id"] is None}


async def freeform(db, who: Caller, llm: LLM, prompt: str) -> dict:
    spec = await _llm_call(design_template(llm, prompt))
    extracted = await _llm_call(extract_values(llm, spec["fields"], prompt))
    values = resolve_values(spec["fields"], extracted, await _club(db, who))
    return {"template": spec, "values": values, "extractedKeys": sorted(extracted),
            "missing": missing_fields(spec["fields"], values)}


async def copilot(db, who: Caller, llm: LLM, body) -> dict:
    blocks = [b.model_dump() for b in body.blocks]
    if sum(len(b["text"]) for b in blocks) > 60_000:
        raise TemplateError(422, "validation_error", "This document is too long for the assistant; select a section instead.")
    sel = body.selection.model_dump() if body.selection else None
    return await _llm_call(run_copilot(llm, body.instruction, blocks, sel))
