import re
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from .errors import ApiError


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:  # Mongo returns naive UTC unless tz_aware is on
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def parse_oid(value: str, what: str = "Document") -> ObjectId:
    """Malformed IDs are reported as 404 so IDs cannot be probed."""
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise ApiError(404, "not_found", f"{what} not found")


_AI_DRAFT_RE = re.compile(r"""data-ai\s*=\s*["']draft["']""", re.IGNORECASE)


def has_ai_draft(html: str) -> bool:
    return bool(_AI_DRAFT_RE.search(html or ""))
