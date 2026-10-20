"""Which required fields still need an answer from the user?"""
from __future__ import annotations

from typing import Any

from ..templates.render import default_values


def club_prefills(fields: list[dict], club: dict | None) -> dict[str, Any]:
    """Apply `prefill` hints ('club.name', 'signatory:<Title>') from the club record."""
    if not club:
        return {}
    sig = {(s.get("title") or "").lower(): s.get("name") for s in club.get("signatories", [])}
    out = {}
    for f in fields:
        p = f.get("prefill")
        if p == "club.name" and club.get("name"):
            out[f["key"]] = club["name"]
        elif p and p.startswith("signatory:") and sig.get(p[10:].strip().lower()):
            out[f["key"]] = sig[p[10:].strip().lower()]
    return out


def resolve_values(fields: list[dict], given: dict[str, Any], club: dict | None) -> dict[str, Any]:
    """Priority: user-given > club record > template default."""
    return {**default_values(fields), **club_prefills(fields, club),
            **{k: v for k, v in given.items() if v not in (None, "", [], {})}}


def missing_fields(fields: list[dict], values: dict[str, Any]) -> list[dict]:
    keys = ("key", "label", "type", "official", "group", "options", "columns", "helpText", "placeholder", "example")
    return [{k: f[k] for k in keys if k in f} for f in fields
            if f.get("required") and values.get(f["key"]) in (None, "", [], {})]
