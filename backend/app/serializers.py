"""MongoDB documents -> camelCase API dicts that match the frontend types."""
from .utils import to_iso

SUMMARY_KEYS = ("venue", "eventDate", "expectedAttendance", "budgetTotal", "summary", "organizer")

# When structured fields change, these mirror into the list/preview summary columns. The templates
# catalog deliberately reuses the document's own column names, so the mapping is one to one.
SUMMARY_FROM_FIELDS = {key: key for key in SUMMARY_KEYS}


def summary_updates_from_fields(fields: dict) -> dict:
    out = {}
    for field_key, doc_key in SUMMARY_FROM_FIELDS.items():
        value = fields.get(field_key)
        if isinstance(value, (str, int, float)) and not isinstance(value, bool) and str(value).strip():
            out[doc_key] = str(value).strip()[:2000]
    return out


def serialize_user(user: dict) -> dict:
    name = user.get("name", "")
    return {
        "id": str(user["_id"]),
        "name": name,
        "email": user["email"],
        "role": user["role"],
        "clubId": user["clubId"],
        "avatarInitial": name[:1].upper() if name else "?",
        "createdAt": to_iso(user.get("createdAt")),
    }


def serialize_club(club: dict) -> dict:
    return {
        "id": str(club["_id"]),
        "name": club["name"],
        "logo": club.get("logo", ""),
        "colors": club.get("colors", {}),
        "fontFamily": club.get("fontFamily", ""),
        "headerHtml": club.get("headerHtml", ""),
        "footerHtml": club.get("footerHtml", ""),
        "signatories": club.get("signatories", []),
    }


def serialize_template(tpl: dict, include_html: bool) -> dict:
    out = {
        "id": str(tpl["_id"]),
        "title": tpl["title"],
        "templateType": tpl["templateType"],
        "category": tpl.get("category", ""),
        "description": tpl.get("description", ""),
        "iconName": tpl.get("iconName", "FileText"),
        "theme": tpl.get("theme", "blue"),
        "suggestedPrompt": tpl.get("suggestedPrompt", ""),
        "fields": tpl.get("fields", []),
        "version": tpl.get("version", 1),
    }
    if include_html:
        out["html"] = tpl.get("html", "")
    return out


def serialize_document(doc: dict) -> dict:
    """List row / metadata: never includes content."""
    out = {
        "id": str(doc["_id"]),
        "title": doc["title"],
        "templateId": doc["templateId"],
        "templateType": doc["templateType"],
        "status": doc["status"],
        "ownerId": doc["ownerId"],
        "clubId": doc["clubId"],
        "currentVersion": doc["currentVersion"],
        "hasUnsavedDraft": bool(doc.get("draftContent")),
        "hasAiDraft": bool(doc.get("hasAiDraft", False)),
        "createdAt": to_iso(doc.get("createdAt")),
        "updatedAt": to_iso(doc.get("updatedAt")),
    }
    for key in SUMMARY_KEYS:
        if doc.get(key) is not None:
            out[key] = doc[key]
    return out


def serialize_version_meta(v: dict) -> dict:
    return {
        "version": v["version"],
        "source": v["source"],
        "note": v.get("note"),
        "savedBy": v["savedBy"],
        "savedAt": to_iso(v.get("savedAt")),
    }
