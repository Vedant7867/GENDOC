"""Templates business logic. Collection: `templates` (contract s.5).

Extra stored fields beyond the contract (all optional for readers):
  clubId, key, isSystem, customized, catalogVersion, sortOrder, previewHeading,
  wireframeVariant, formats, createdBy, createdByName, createdAt, updatedAt, deletedAt
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError

from .deps import Caller
from .errors import TemplateError
from .html_rules import (
    extract_placeholders,
    placeholder_is_sole_child,
    table_placeholder_ok,
    sanitize_html,
)
from .render import default_values, example_values, render_html
from .seed import CATALOG, catalog_entry

COL = "templates"
DOC_COL = "documents"


def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def oid(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise TemplateError(404, "not_found", "Template not found")


# ---------------------------------------------------------------- indexes
async def ensure_indexes(db) -> None:
    await db[COL].create_index([("clubId", 1), ("key", 1)], unique=True)
    await db[COL].create_index([("clubId", 1), ("templateType", 1)])


# ------------------------------------------------------------- validation
def validate_content(html: str, fields: list[dict]) -> tuple[str, list[dict], list[dict]]:
    """Returns (clean_html, errors, warnings). Errors block saving."""
    errors: list[dict] = []
    warnings: list[dict] = []
    clean = sanitize_html(html, allow_ai_marks=False)

    keys = [f["key"] for f in fields]
    for k in {k for k in keys if keys.count(k) > 1}:
        errors.append({"field": k, "message": f"Duplicate field key '{k}'"})

    by_key = {f["key"]: f for f in fields}
    for f in fields:
        f.setdefault("type", "text")
        if f["type"] == "select" and not f.get("options"):
            errors.append({"field": f["key"], "message": "Select fields need options"})
        if f["type"] == "table" and not f.get("columns"):
            errors.append({"field": f["key"], "message": "Table fields need columns"})
        if f.get("options") and f["type"] != "select":
            errors.append({"field": f["key"], "message": "Only select fields take options"})
        if f.get("columns") and f["type"] != "table":
            errors.append({"field": f["key"], "message": "Only table fields take columns"})
        if f.get("prefill") and not re.match(r"^(club\.name|signatory:.+)$", f["prefill"]):
            errors.append({"field": f["key"], "message": "prefill must be 'club.name' or 'signatory:<Title>'"})

    used = extract_placeholders(clean)
    for k in used:
        if k not in by_key:
            errors.append({"field": k, "message": f"Placeholder {{{{{k}}}}} has no matching field"})
    for f in fields:
        k = f["key"]
        if k not in used:
            (errors if f.get("required") else warnings).append(
                {"field": k, "message": f"Field '{k}' is never used in the html"}
            )
        elif f["type"] == "list" and not placeholder_is_sole_child(clean, k, ("ul", "ol")):
            errors.append({"field": k, "message": "List placeholders must be the only content of a <ul> or <ol>"})
        elif f["type"] == "table" and not table_placeholder_ok(clean, k):
            errors.append({"field": k, "message": "Table placeholders must be a one-cell row: <tr><td>{{key}}</td></tr>"})
    return clean, errors, warnings


def _raise_if(errors: list[dict]) -> None:
    if errors:
        raise TemplateError(422, "validation_error", errors[0]["message"], errors)


def _dump_fields(fields) -> list[dict]:
    return [f if isinstance(f, dict) else f.model_dump(exclude_none=True) for f in fields]


# -------------------------------------------------------------- shaping
def _label(doc: dict) -> str:
    return f"v{doc.get('version', 1)}"


def shape(doc: dict, usage: int = 0, *, detail: bool, most_used: bool = False) -> dict:
    out = {
        "id": str(doc["_id"]),
        "key": doc.get("key"),
        "title": doc["title"],
        "category": doc["category"],
        "description": doc.get("description", ""),
        "iconName": doc.get("iconName", "FileText"),
        "theme": doc.get("theme", "blue"),
        "suggestedPrompt": doc.get("suggestedPrompt", ""),
        "templateType": doc.get("templateType") or doc["title"],
        "version": doc.get("version", 1),
        "versionLabel": _label(doc),
        "previewHeading": doc.get("previewHeading") or doc["title"].upper(),
        "wireframeVariant": doc.get("wireframeVariant", "letter"),
        "formats": doc.get("formats", ["DOCX", "PDF"]),
        "usedCount": usage,
        "isMostUsed": most_used,
        "isSystem": bool(doc.get("isSystem")),
        "customized": bool(doc.get("customized")),
        "createdBy": doc.get("createdByName") or "Club Admin",
        "createdAt": iso(doc.get("createdAt")),
        "updatedAt": iso(doc.get("updatedAt")),
        "fieldCount": len(doc.get("fields", [])),
        "requiredFieldCount": sum(1 for f in doc.get("fields", []) if f.get("required")),
    }
    if detail:
        out["html"] = doc["html"]
        out["fields"] = doc.get("fields", [])
    return out


async def usage_counts(db, club_id: str) -> dict[str, int]:
    """Derived from `documents` (clubId, templateId, deletedAt) so the
    documents code needs no hook to keep the counter."""
    pipe = [
        {"$match": {"clubId": club_id, "deletedAt": None}},
        {"$group": {"_id": "$templateId", "n": {"$sum": 1}}},
    ]
    return {str(r["_id"]): r["n"] async for r in db[DOC_COL].aggregate(pipe)}


# --------------------------------------------------------------- seeding
def _seed_doc(club_id: str, entry: dict, order: int, created_by: str) -> dict:
    ts = now()
    html, errors, _ = validate_content(entry["html"], entry["fields"])
    assert not errors, f"catalog template {entry['key']} invalid: {errors}"
    return {
        **{k: entry[k] for k in (
            "key", "title", "category", "description", "iconName", "theme",
            "suggestedPrompt", "templateType", "previewHeading", "wireframeVariant", "fields",
        )},
        "html": html,
        "formats": ["DOCX", "PDF"],
        "version": 1,
        "catalogVersion": entry.get("catalogVersion", 1),
        "sortOrder": order,
        "clubId": club_id,
        "isSystem": True,
        "customized": False,
        "createdBy": created_by,
        "createdByName": "Club Admin",
        "createdAt": ts,
        "updatedAt": ts,
        "deletedAt": None,
    }


async def seed_templates(db, club_id: str, *, sync: bool = False, created_by: str = "system") -> dict:
    """Idempotent. Inserts missing catalog templates for a club.

    Never overwrites admin edits. With sync=True, templates that were never
    customized are refreshed when the catalog's catalogVersion is newer.
    Soft-deleted templates stay deleted (use restore_defaults to bring back).
    """
    await ensure_indexes(db)
    inserted, updated = [], []
    for order, entry in enumerate(CATALOG, 1):
        existing = await db[COL].find_one({"clubId": club_id, "key": entry["key"]})
        if existing is None:
            try:
                await db[COL].insert_one(_seed_doc(club_id, entry, order, created_by))
                inserted.append(entry["key"])
            except DuplicateKeyError:
                pass  # concurrent seeding; fine
        elif sync and not existing.get("customized") and not existing.get("deletedAt") \
                and existing.get("catalogVersion", 1) < entry.get("catalogVersion", 1):
            fresh = _seed_doc(club_id, entry, order, created_by)
            for k in ("createdAt", "createdBy", "clubId", "key"):
                fresh.pop(k)
            fresh["version"] = existing.get("version", 1) + 1
            await db[COL].update_one({"_id": existing["_id"]}, {"$set": fresh})
            updated.append(entry["key"])
    return {"inserted": inserted, "updated": updated}


async def _ensure_seeded(db, club_id: str) -> None:
    if await db[COL].count_documents({"clubId": club_id}, limit=1) == 0:
        await seed_templates(db, club_id)


# ------------------------------------------------------------------ reads
_SORTS = {
    "order": lambda d: (d.get("sortOrder", 10_000), d["title"].lower()),
    "title": lambda d: d["title"].lower(),
    "recent": lambda d: d.get("updatedAt") or datetime.min.replace(tzinfo=timezone.utc),
}


async def list_templates(db, who: Caller, *, q=None, category=None, sort="order") -> list[dict]:
    await _ensure_seeded(db, who.club_id)
    docs = [d async for d in db[COL].find({"clubId": who.club_id, "deletedAt": None})]
    usage = await usage_counts(db, who.club_id)
    top = {i for i, n in sorted(usage.items(), key=lambda kv: -kv[1])[:3] if n > 0}
    if category and category != "All":
        docs = [d for d in docs if d["category"].lower() == category.lower()]
    if q:
        needle = q.strip().lower()
        docs = [d for d in docs if needle in " ".join(
            [d["title"], d.get("description", ""), d["category"], d.get("templateType", "")]).lower()]
    if sort == "mostUsed":
        docs.sort(key=lambda d: (-usage.get(str(d["_id"]), 0), d["title"].lower()))
    elif sort == "recent":
        docs.sort(key=_SORTS["recent"], reverse=True)
    else:
        docs.sort(key=_SORTS.get(sort, _SORTS["order"]))
    return [shape(d, usage.get(str(d["_id"]), 0), detail=False, most_used=str(d["_id"]) in top) for d in docs]


async def category_counts(db, who: Caller) -> list[dict]:
    await _ensure_seeded(db, who.club_id)
    out: dict[str, int] = {}
    order: list[str] = []
    async for d in db[COL].find({"clubId": who.club_id, "deletedAt": None}).sort("sortOrder", 1):
        if d["category"] not in out:
            order.append(d["category"])
        out[d["category"]] = out.get(d["category"], 0) + 1
    return [{"category": "All", "count": sum(out.values())}] + [
        {"category": c, "count": out[c]} for c in order
    ]


async def _load(db, who: Caller, template_id: str) -> dict:
    doc = await db[COL].find_one({"_id": oid(template_id), "deletedAt": None})
    if doc is None:
        raise TemplateError(404, "not_found", "Template not found")
    if doc["clubId"] != who.club_id:
        raise TemplateError(403, "forbidden", "This template belongs to another club")
    return doc


async def get_template(db, who: Caller, template_id: str) -> dict:
    await _ensure_seeded(db, who.club_id)
    doc = await _load(db, who, template_id)
    usage = (await usage_counts(db, who.club_id)).get(template_id, 0)
    return shape(doc, usage, detail=True)


async def get_by_type(db, who: Caller, template_type: str) -> dict:
    await _ensure_seeded(db, who.club_id)
    doc = await db[COL].find_one(
        {"clubId": who.club_id, "deletedAt": None,
         "templateType": {"$regex": f"^{re.escape(template_type)}$", "$options": "i"}},
        sort=[("sortOrder", 1)],
    )
    if doc is None:
        raise TemplateError(404, "not_found", "No template with that type")
    return shape(doc, 0, detail=True)


# ----------------------------------------------------------------- writes
def require_admin(who: Caller) -> None:
    if who.role != "Club Admin":
        raise TemplateError(403, "forbidden", "Only a Club Admin can manage templates")


async def _unique_key(db, club_id: str, title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40] or "template"
    key, n = base, 2
    while await db[COL].find_one({"clubId": club_id, "key": key}, {"_id": 1}):
        key, n = f"{base}-{n}", n + 1
    return key


async def create_template(db, who: Caller, body) -> dict:
    require_admin(who)
    data = body.model_dump(exclude_none=True)
    fields = _dump_fields(data.pop("fields", []))
    html, errors, _ = validate_content(data.pop("html"), fields)
    _raise_if(errors)
    ts = now()
    doc = {
        **data,
        "templateType": data.get("templateType") or data["title"],
        "html": html, "fields": fields, "version": 1,
        "key": await _unique_key(db, who.club_id, data["title"]),
        "clubId": who.club_id, "isSystem": False, "customized": True,
        "sortOrder": 10_000, "createdBy": who.id, "createdByName": who.name or "Club Admin",
        "createdAt": ts, "updatedAt": ts, "deletedAt": None,
    }
    res = await db[COL].insert_one(doc)
    doc["_id"] = res.inserted_id
    return shape(doc, 0, detail=True)


async def update_template(db, who: Caller, template_id: str, patch) -> dict:
    require_admin(who)
    doc = await _load(db, who, template_id)
    changes = patch.model_dump(exclude_unset=True, exclude_none=True, exclude={"fields"})
    if patch.fields is not None:
        changes["fields"] = [f.model_dump(exclude_none=True) for f in patch.fields]
    base_version = changes.pop("baseVersion", None)
    if base_version is not None and base_version != doc.get("version", 1):
        raise TemplateError(409, "version_conflict",
                            "Template changed since you loaded it; reload and retry")
    if not changes:
        return shape(doc, 0, detail=True)
    fields = _dump_fields(changes.pop("fields")) if "fields" in changes else doc.get("fields", [])
    html = changes.pop("html") if "html" in changes else doc["html"]
    content_changed = "html" in patch.model_fields_set or "fields" in patch.model_fields_set
    update: dict[str, Any] = dict(changes)
    if content_changed:
        html, errors, _ = validate_content(html, fields)
        _raise_if(errors)
        update.update(html=html, fields=fields)
    new_version = doc.get("version", 1) + (1 if content_changed else 0)
    update.update(version=new_version, customized=True, updatedAt=now())
    res = await db[COL].find_one_and_update(
        {"_id": doc["_id"], "version": doc.get("version", 1)}, {"$set": update}, return_document=True
    )
    if res is None:
        raise TemplateError(409, "version_conflict", "Template changed while saving; retry")
    return shape(res, 0, detail=True)


async def delete_template(db, who: Caller, template_id: str) -> None:
    require_admin(who)
    doc = await _load(db, who, template_id)
    await db[COL].update_one({"_id": doc["_id"]}, {"$set": {"deletedAt": now(), "updatedAt": now()}})


async def duplicate_template(db, who: Caller, template_id: str) -> dict:
    require_admin(who)
    src = await _load(db, who, template_id)
    ts = now()
    title = f"{src['title']} (Copy)"[:80]
    copy = {k: v for k, v in src.items() if k not in ("_id", "catalogVersion")}
    copy.update(
        title=title, key=await _unique_key(db, who.club_id, title), version=1,
        isSystem=False, customized=True, sortOrder=10_000, createdBy=who.id,
        createdByName=who.name or "Club Admin", createdAt=ts, updatedAt=ts, deletedAt=None,
    )
    res = await db[COL].insert_one(copy)
    copy["_id"] = res.inserted_id
    return shape(copy, 0, detail=True)


async def reset_template(db, who: Caller, template_id: str) -> dict:
    """Restore a system template to the shipped catalog version."""
    require_admin(who)
    doc = await _load(db, who, template_id)
    entry = catalog_entry(doc.get("key", ""))
    if not doc.get("isSystem") or entry is None:
        raise TemplateError(422, "validation_error", "Only built-in templates can be reset")
    order = next(i for i, e in enumerate(CATALOG, 1) if e["key"] == entry["key"])
    fresh = _seed_doc(who.club_id, entry, order, "system")
    for k in ("createdAt", "createdBy", "clubId", "key"):
        fresh.pop(k)
    fresh["version"] = doc.get("version", 1) + 1
    res = await db[COL].find_one_and_update({"_id": doc["_id"]}, {"$set": fresh}, return_document=True)
    return shape(res, 0, detail=True)


async def restore_defaults(db, who: Caller) -> dict:
    """Bring back built-in templates that were deleted or never seeded."""
    require_admin(who)
    restored = []
    for order, entry in enumerate(CATALOG, 1):
        existing = await db[COL].find_one({"clubId": who.club_id, "key": entry["key"]})
        if existing is None:
            await db[COL].insert_one(_seed_doc(who.club_id, entry, order, "system"))
            restored.append(entry["key"])
        elif existing.get("deletedAt"):
            fresh = _seed_doc(who.club_id, entry, order, "system")
            for k in ("createdAt", "createdBy", "clubId", "key"):
                fresh.pop(k)
            fresh["version"] = existing.get("version", 1) + 1
            await db[COL].update_one({"_id": existing["_id"]}, {"$set": fresh})
            restored.append(entry["key"])
    return {"restored": restored}


# ------------------------------------------------------ dry run / preview
def validate_only(html: str, fields) -> dict:
    fdicts = _dump_fields(fields)
    clean, errors, warnings = validate_content(html, fdicts)
    return {"valid": not errors, "html": clean, "errors": errors, "warnings": warnings,
            "placeholders": extract_placeholders(clean)}


async def preview(db, who: Caller, template_id: str, values: dict, use_examples: bool) -> dict:
    doc = await _load(db, who, template_id)
    fields = doc.get("fields", [])
    given = {**default_values(fields), **{k: v for k, v in values.items() if v not in (None, "", [])}}
    effective = {**(example_values(fields) if use_examples else {}), **given}
    missing = [f["key"] for f in fields if f.get("required") and not given.get(f["key"])]
    return {"html": render_html(doc["html"], fields, effective, preview=True),
            "missingRequired": missing, "usedExamples": use_examples}
