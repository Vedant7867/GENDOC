"""Optional AI wording for NON-official text fields. The result is always
rendered inside <span data-ai="draft"> so export is blocked until accepted."""
from __future__ import annotations

import json
import re
from typing import Any

from ..templates.errors import TemplateError
from .llm import LLM

SYSTEM = """You write short, formal wording for an official student-club document.
Rules:
- Use ONLY facts present in KNOWN VALUES. Do not add names, dates, numbers, amounts, venues or claims that are not there.
- Plain, polite, institutional English. No markdown. Keep each text under 60 words unless a list is requested.
- list fields: an array of 3 to 5 short strings. text fields: one string.
Return ONLY JSON: {"drafts": {"<fieldKey>": <string or array of strings>}}"""

_NUM = re.compile(r"\d[\d,./]*")


def _numbers(s: str) -> set[str]:
    return {n.strip(",./").replace(",", "") for n in _NUM.findall(s)} - {""}


async def draft_fields(llm: LLM, fields: list[dict], values: dict[str, Any], keys: list[str]) -> dict:
    by_key = {f["key"]: f for f in fields}
    for k in keys:
        f = by_key.get(k)
        if f is None:
            raise TemplateError(422, "validation_error", f"Unknown field '{k}'")
        if f.get("official"):
            raise TemplateError(422, "validation_error", f"'{k}' is an official field and cannot be AI-drafted")
        if f.get("type") in ("table", "select", "date", "number", "currency"):
            raise TemplateError(422, "validation_error", f"'{k}' ({f['type']}) cannot be AI-drafted")
    known = {k: v for k, v in values.items() if v not in (None, "", [], {})}
    user = (f"KNOWN VALUES:\n{json.dumps(known, ensure_ascii=False)}\n\nWRITE THESE FIELDS:\n"
            f"{json.dumps([{'key': k, 'label': by_key[k]['label'], 'type': by_key[k].get('type', 'text')} for k in keys], ensure_ascii=False)}")
    res = (await llm.complete_json(SYSTEM, user, max_tokens=1500)).get("drafts", {})
    allowed_numbers = _numbers(json.dumps(known, ensure_ascii=False))
    drafts, rejected = {}, {}
    for k in keys:
        v = res.get(k)
        if by_key[k].get("type") == "list":
            v = [str(x).strip() for x in v if str(x).strip()] if isinstance(v, list) else None
        elif isinstance(v, str):
            v = v.strip()
        else:
            v = None
        if not v:
            rejected[k] = "no draft produced"
        elif not _numbers(json.dumps(v, ensure_ascii=False)) <= allowed_numbers:
            rejected[k] = "draft contained figures not present in your details"
        else:
            drafts[k] = v
    return {"drafts": drafts, "rejected": rejected}
