"""Fill a template's {{fieldKey}} placeholders with values.

Used by POST /templates/{id}/preview. The generator may reuse `render_html`
so previews and generated documents wrap values identically (contract s.4:
every value becomes <span data-field="key">...</span>).

 * inline types  -> <span data-field="k">value</span>
 * list          -> <li data-field="k">..</li> per item  (placeholder must be alone in <ul>/<ol>)
 * table         -> <tr data-field="k"><td>..</td></tr> per row; authored as <tr><td>{{k}}</td></tr>
"""
from __future__ import annotations

from html import escape
from typing import Any

from .html_rules import PLACEHOLDER_RE, table_marker_regex


def _text(v: Any) -> str:
    return escape("" if v is None else str(v)).replace("\n", "<br>")


def _is_empty(v: Any) -> bool:
    return v is None or v == "" or v == [] or v == {}


def render_html(
    html: str, fields: list[dict], values: dict[str, Any], *, preview: bool = False,
    ai_keys: frozenset[str] | set[str] = frozenset(),
) -> str:
    """ai_keys: field keys whose value was written by the AI; each is wrapped in
    <span data-ai="draft"> so export stays blocked until a person accepts it (contract s.4)."""
    by_key = {f["key"]: f for f in fields}

    def empty_marker(f: dict) -> str:
        label = escape(f["label"])
        return f'<span data-field="{f["key"]}" class="field-empty">[{label}]</span>'

    def mark(key: str, inner: str) -> str:
        return f'<span data-ai="draft">{inner}</span>' if key in ai_keys else inner

    def table_rows(f: dict, v: Any) -> str:
        key, cols = f["key"], f.get("columns") or []
        rows = [r for r in (v or []) if isinstance(r, dict)]
        if not rows:
            if not preview:
                return ""
            n = len(cols) + (1 if f.get("autoNumber") else 0)
            return f'<tr data-field="{key}">' + '<td class="field-empty">&nbsp;</td>' * n + "</tr>"
        out = []
        for i, r in enumerate(rows, 1):
            cells = [f"<td>{i}</td>"] if f.get("autoNumber") else []
            cells += [f"<td>{mark(key, _text(r.get(c['key'])))}</td>" for c in cols]
            out.append(f'<tr data-field="{key}">{"".join(cells)}</tr>')
        return "".join(out)

    for f in fields:  # table fields replace their whole marker row first
        if f.get("type") == "table":
            html = table_marker_regex(f["key"]).sub(lambda _m, f=f: table_rows(f, values.get(f["key"])), html)

    def sub(m):
        key = m.group(1)
        f = by_key.get(key)
        if f is None:
            return m.group(0)
        v = values.get(key)
        t = f.get("type", "text")
        if t == "list":
            items = v.split("\n") if isinstance(v, str) else (v or [])
            items = [str(i).strip() for i in items if str(i).strip()]
            if not items:
                return f'<li data-field="{key}" class="field-empty">[{escape(f["label"])}]</li>' if preview else ""
            return "".join(f'<li data-field="{key}">{mark(key, _text(i))}</li>' for i in items)
        if _is_empty(v):
            return empty_marker(f) if preview else f'<span data-field="{key}"></span>'
        return f'<span data-field="{key}">{mark(key, _text(v))}</span>'

    return PLACEHOLDER_RE.sub(sub, html)


def example_values(fields: list[dict]) -> dict[str, Any]:
    return {f["key"]: f["example"] for f in fields if f.get("example") is not None}


def default_values(fields: list[dict]) -> dict[str, Any]:
    return {f["key"]: f["defaultValue"] for f in fields if f.get("defaultValue")}
