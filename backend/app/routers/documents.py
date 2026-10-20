"""Documents API (contract section 6). Export is a stub until step 4 of the build order."""
import re
from typing import Literal, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Query, Request, Response
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from .. import exporter
from ..config import get_settings
from ..deps import CurrentUser
from ..errors import ApiError
from ..models import ContentIn, DocumentCreateIn, DocumentPatchIn, DraftIn, Status
from ..permissions import can_create, can_delete, can_edit, check_transition
from ..sanitize import sanitize_html
from ..serializers import (
    SUMMARY_KEYS,
    serialize_document,
    serialize_version_meta,
    summary_updates_from_fields,
)
from ..utils import has_ai_draft, parse_oid, to_iso, utcnow

router = APIRouter(prefix="/documents", tags=["documents"])

SORTS = {
    "updatedAt": [("updatedAt", 1)],
    "-updatedAt": [("updatedAt", -1)],
    "createdAt": [("createdAt", 1)],
    "-createdAt": [("createdAt", -1)],
    "title": [("title", 1)],
    "-title": [("title", -1)],
}


# ---------- helpers ----------

def _db(request: Request):
    return request.app.state.db


async def _load(db, user: dict, doc_id: str) -> dict:
    """Other clubs' documents are reported as 404, never 403, so IDs cannot be probed."""
    oid = parse_oid(doc_id)
    doc = await db.documents.find_one({"_id": oid, "clubId": user["clubId"], "deletedAt": None})
    if doc is None:
        raise ApiError(404, "not_found", "Document not found")
    return doc


def _ensure_editable(user: dict, doc: dict) -> None:
    if not can_edit(user, doc):
        raise ApiError(403, "forbidden", "You do not have permission to edit this document")
    if doc["status"] == "Completed":
        raise ApiError(409, "document_locked", "Completed documents are read-only. Reopen it to Draft first.")


async def _find_template(db, user: dict, template_id: str) -> Optional[dict]:
    """Templates are looked up by their id (an ObjectId string) or by their stable `key` (for example
    "event-proposal"). Deleted templates cannot be used for new documents."""
    base = {"clubId": user["clubId"], "deletedAt": None}
    try:
        found = await db.templates.find_one({**base, "_id": ObjectId(template_id)})
        if found:
            return found
    except (InvalidId, TypeError):
        pass
    return await db.templates.find_one({**base, "key": template_id})


async def _version(db, doc_id: str, version: int) -> Optional[dict]:
    return await db.document_versions.find_one({"documentId": doc_id, "version": version})


async def _detail(db, doc: dict) -> dict:
    doc_id = str(doc["_id"])
    latest = await _version(db, doc_id, doc["currentVersion"])
    out = serialize_document(doc)
    out["fields"] = (latest or {}).get("fields", {})
    out["content"] = doc.get("draftContent") or (latest or {}).get("content", "")
    out["hasUnacceptedAiText"] = has_ai_draft(out["content"])
    if doc.get("draftSavedAt"):
        out["draftSavedAt"] = to_iso(doc["draftSavedAt"])
    return out


async def _version_conflict(db, doc: dict) -> ApiError:
    fresh = await db.documents.find_one({"_id": doc["_id"], "deletedAt": None})
    return ApiError(
        409,
        "version_conflict",
        "This document changed since you opened it. Reload to see the latest version.",
        currentVersion=(fresh or doc)["currentVersion"],
    )


async def _save_version(
    db,
    doc: dict,
    user: dict,
    *,
    content: str,
    fields: dict,
    source: str,
    note: Optional[str],
    base_version: int,
) -> dict:
    """Atomically claim the next version number, then store it."""
    now = utcnow()
    changes = {"updatedAt": now, "hasAiDraft": has_ai_draft(content), **summary_updates_from_fields(fields)}
    claimed = await db.documents.find_one_and_update(
        {"_id": doc["_id"], "clubId": doc["clubId"], "deletedAt": None, "currentVersion": base_version},
        {"$set": changes, "$unset": {"draftContent": "", "draftSavedAt": ""}, "$inc": {"currentVersion": 1}},
        return_document=ReturnDocument.AFTER,
    )
    if claimed is None:
        raise await _version_conflict(db, doc)
    try:
        await db.document_versions.insert_one(
            {
                "documentId": str(doc["_id"]),
                "version": claimed["currentVersion"],
                "content": content,
                "fields": fields,
                "source": source,
                "note": note,
                "savedBy": user["id"],
                "savedAt": now,
            }
        )
    except DuplicateKeyError:
        raise await _version_conflict(db, doc)
    return claimed


# ---------- list / folders ----------

@router.get("")
async def list_documents(
    request: Request,
    user: CurrentUser,
    q: Optional[str] = Query(default=None, max_length=100),
    status: Optional[Status] = None,
    templateType: Optional[str] = Query(default=None, max_length=100),
    sort: Literal["updatedAt", "-updatedAt", "createdAt", "-createdAt", "title", "-title"] = "-updatedAt",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
):
    db = _db(request)
    query: dict = {"clubId": user["clubId"], "deletedAt": None}
    if status:
        query["status"] = status
    if templateType:
        query["templateType"] = templateType
    if q and q.strip():
        rx = {"$regex": re.escape(q.strip()), "$options": "i"}
        query["$or"] = [{"title": rx}, {"venue": rx}, {"summary": rx}, {"templateType": rx}]

    total = await db.documents.count_documents(query)
    cursor = (
        db.documents.find(query)
        .sort(SORTS[sort] + [("_id", -1)])
        .skip((page - 1) * limit)
        .limit(limit)
    )
    items = [serialize_document(d) async for d in cursor]
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.get("/folders")
async def folders(request: Request, user: CurrentUser):
    db = _db(request)
    pipeline = [
        {"$match": {"clubId": user["clubId"], "deletedAt": None}},
        {"$group": {"_id": "$templateType", "count": {"$sum": 1}}},
    ]
    rows = [{"templateType": r["_id"], "count": r["count"]} async for r in db.documents.aggregate(pipeline)]
    rows.sort(key=lambda r: r["templateType"])
    return {"folders": rows, "total": sum(r["count"] for r in rows)}


# ---------- create / read / update / delete ----------

@router.post("", status_code=201)
async def create_document(body: DocumentCreateIn, request: Request, user: CurrentUser):
    if not can_create(user):
        raise ApiError(403, "forbidden", "Your role cannot create documents")
    db = _db(request)

    template = await _find_template(db, user, body.templateId)
    if template is None:
        raise ApiError(422, "validation_error", "Unknown template", details=[{"field": "templateId", "message": "Unknown template"}])

    if get_settings().enforce_required_fields:
        missing = [
            f["key"]
            for f in template.get("fields", [])
            if f.get("required") and body.fields.get(f["key"]) in (None, "", [], {})
        ]
        if missing:
            raise ApiError(
                422,
                "missing_required_fields",
                "Some required fields are missing. Ask the user for them; they are never guessed.",
                fields=missing,
            )

    content = sanitize_html(body.content)
    now = utcnow()
    summary = {k: getattr(body, k) for k in SUMMARY_KEYS if getattr(body, k) is not None}
    for key, value in summary_updates_from_fields(body.fields).items():
        summary.setdefault(key, value)

    doc = {
        "title": body.title,
        "templateId": str(template["_id"]),  # the templates module counts usage by this string
        "templateType": template.get("templateType") or template["title"],
        "status": "Draft",
        "ownerId": user["id"],
        "clubId": user["clubId"],
        **summary,
        "currentVersion": 1,
        "hasAiDraft": has_ai_draft(content),
        "createdAt": now,
        "updatedAt": now,
        "deletedAt": None,
    }
    res = await db.documents.insert_one(doc)
    doc["_id"] = res.inserted_id
    try:
        await db.document_versions.insert_one(
            {
                "documentId": str(res.inserted_id),
                "version": 1,
                "content": content,
                "fields": body.fields,
                "source": "generated",
                "note": None,
                "savedBy": user["id"],
                "savedAt": now,
            }
        )
    except Exception:
        await db.documents.delete_one({"_id": res.inserted_id})
        raise
    return await _detail(db, doc)


@router.get("/{doc_id}")
async def get_document(doc_id: str, request: Request, user: CurrentUser):
    db = _db(request)
    return await _detail(db, await _load(db, user, doc_id))


@router.patch("/{doc_id}")
async def patch_document(doc_id: str, body: DocumentPatchIn, request: Request, user: CurrentUser):
    db = _db(request)
    doc = await _load(db, user, doc_id)
    changed = body.model_fields_set

    if "title" in changed and body.title is None:
        raise ApiError(422, "validation_error", "Title cannot be empty", details=[{"field": "title", "message": "Title cannot be empty"}])

    updates = {k: getattr(body, k) for k in changed if k != "status"}
    if updates:
        _ensure_editable(user, doc)

    if "status" in changed and body.status is not None and body.status != doc["status"]:
        verdict = check_transition(user, doc, body.status)
        if verdict == "forbidden":
            raise ApiError(403, "forbidden", f"Your role cannot move this document to {body.status}")
        if verdict == "invalid":
            raise ApiError(409, "invalid_transition", f"A {doc['status']} document cannot become {body.status}")
        updates["status"] = body.status

    if not updates:
        return serialize_document(doc)

    updates["updatedAt"] = utcnow()
    updated = await db.documents.find_one_and_update(
        {"_id": doc["_id"], "deletedAt": None},
        {"$set": updates},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise ApiError(404, "not_found", "Document not found")
    return serialize_document(updated)


@router.delete("/{doc_id}", status_code=204)
async def delete_document(doc_id: str, request: Request, user: CurrentUser):
    db = _db(request)
    doc = await _load(db, user, doc_id)
    if not can_delete(user, doc):
        raise ApiError(403, "forbidden", "You cannot delete this document")
    now = utcnow()
    await db.documents.update_one({"_id": doc["_id"]}, {"$set": {"deletedAt": now, "updatedAt": now}})
    return Response(status_code=204)


@router.post("/{doc_id}/duplicate", status_code=201)
async def duplicate_document(doc_id: str, request: Request, user: CurrentUser):
    if not can_create(user):
        raise ApiError(403, "forbidden", "Your role cannot create documents")
    db = _db(request)
    src = await _load(db, user, doc_id)
    latest = await _version(db, str(src["_id"]), src["currentVersion"])
    content = (latest or {}).get("content", "")
    now = utcnow()
    copy = {k: src[k] for k in ("templateId", "templateType", *SUMMARY_KEYS) if src.get(k) is not None}
    copy.update(
        {
            "title": f"Copy of {src['title']}"[:200],
            "status": "Draft",
            "ownerId": user["id"],
            "clubId": user["clubId"],
            "currentVersion": 1,
            "hasAiDraft": has_ai_draft(content),
            "createdAt": now,
            "updatedAt": now,
            "deletedAt": None,
        }
    )
    res = await db.documents.insert_one(copy)
    copy["_id"] = res.inserted_id
    await db.document_versions.insert_one(
        {
            "documentId": str(res.inserted_id),
            "version": 1,
            "content": content,
            "fields": (latest or {}).get("fields", {}),
            "source": "manual",
            "note": f"Duplicated from {src['_id']}",
            "savedBy": user["id"],
            "savedAt": now,
        }
    )
    return await _detail(db, copy)


# ---------- editor: autosave, save, versions ----------

@router.put("/{doc_id}/draft")
async def save_draft(doc_id: str, body: DraftIn, request: Request, user: CurrentUser):
    """Autosave. Overwrites the working draft; creates no version."""
    db = _db(request)
    doc = await _load(db, user, doc_id)
    _ensure_editable(user, doc)
    content = sanitize_html(body.content)
    now = utcnow()
    res = await db.documents.update_one(
        {"_id": doc["_id"], "deletedAt": None, "currentVersion": body.baseVersion},
        {"$set": {"draftContent": content, "draftSavedAt": now, "updatedAt": now}},
    )
    if res.matched_count == 0:
        raise await _version_conflict(db, doc)
    return {"draftSavedAt": to_iso(now), "currentVersion": doc["currentVersion"]}


@router.put("/{doc_id}/content")
async def save_content(doc_id: str, body: ContentIn, request: Request, user: CurrentUser):
    """Explicit save: creates the next version and clears the draft."""
    db = _db(request)
    doc = await _load(db, user, doc_id)
    _ensure_editable(user, doc)
    content = sanitize_html(body.content)
    fields = body.fields
    if fields is None:
        prev = await _version(db, str(doc["_id"]), doc["currentVersion"])
        fields = (prev or {}).get("fields", {})
    claimed = await _save_version(
        db, doc, user, content=content, fields=fields, source="manual", note=body.note, base_version=body.baseVersion
    )
    return await _detail(db, claimed)


@router.get("/{doc_id}/versions")
async def list_versions(doc_id: str, request: Request, user: CurrentUser):
    db = _db(request)
    doc = await _load(db, user, doc_id)
    cursor = db.document_versions.find({"documentId": str(doc["_id"])}, {"content": 0, "fields": 0}).sort("version", -1)
    return {"items": [serialize_version_meta(v) async for v in cursor], "currentVersion": doc["currentVersion"]}


@router.get("/{doc_id}/versions/{n}")
async def get_version(doc_id: str, n: int, request: Request, user: CurrentUser):
    db = _db(request)
    doc = await _load(db, user, doc_id)
    v = await _version(db, str(doc["_id"]), n)
    if v is None:
        raise ApiError(404, "not_found", "Version not found")
    return {**serialize_version_meta(v), "content": v["content"], "fields": v.get("fields", {})}


@router.post("/{doc_id}/versions/{n}/restore")
async def restore_version(doc_id: str, n: int, request: Request, user: CurrentUser):
    db = _db(request)
    doc = await _load(db, user, doc_id)
    _ensure_editable(user, doc)
    v = await _version(db, str(doc["_id"]), n)
    if v is None:
        raise ApiError(404, "not_found", "Version not found")
    claimed = await _save_version(
        db,
        doc,
        user,
        content=v["content"],
        fields=v.get("fields", {}),
        source="restore",
        note=f"Restored from version {n}",
        base_version=doc["currentVersion"],
    )
    return await _detail(db, claimed)


# ---------- export ----------

_MEDIA = {"pdf": "application/pdf",
          "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}


@router.get("/{doc_id}/export")
async def export_document(
    doc_id: str,
    request: Request,
    user: CurrentUser,
    format: Literal["pdf", "docx"] = Query(...),
    version: Optional[int] = Query(default=None, ge=1),
):
    """Exports a SAVED version (never the autosaved draft). Blocked while AI-drafted passages remain (s.4)."""
    db = _db(request)
    doc = await _load(db, user, doc_id)
    v = await _version(db, str(doc["_id"]), version or doc["currentVersion"])
    if v is None:
        raise ApiError(404, "not_found", "Version not found")
    if has_ai_draft(v["content"]):
        raise ApiError(409, "unaccepted_ai_text", "Accept or remove the AI-drafted passages before exporting")
    try:
        club = await db["clubs"].find_one({"_id": ObjectId(user["clubId"])})
    except Exception:
        club = None
    data = await (exporter.to_pdf if format == "pdf" else exporter.to_docx)(v["content"], club)
    name = (re.sub(r"[^A-Za-z0-9]+", "_", doc["title"]).strip("_") or "document")[:80]
    return Response(content=data, media_type=_MEDIA[format],
                    headers={"Content-Disposition": f'attachment; filename="{name}.{format}"'})
