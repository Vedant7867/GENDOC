"""Minimal {{field}} -> HTML renderer, used by the seed script.

The real rendering (extraction, missing-info checks, AI drafting) belongs to the generator.
It follows the same convention: every field value is wrapped in <span data-field="key">.
"""
import html
import re
from typing import Any

_PLACEHOLDER = re.compile(r"\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}")


def _as_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        return ", ".join(str(v) for v in value)
    return str(value)


def render_template_html(template_html: str, fields: dict[str, Any]) -> str:
    def repl(m: re.Match) -> str:
        key = m.group(1)
        return f'<span data-field="{key}">{html.escape(_as_text(fields.get(key)))}</span>'

    return _PLACEHOLDER.sub(repl, template_html)
