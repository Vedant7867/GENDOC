"""HTML content rules from contract section 4, applied to template bodies.

Kept dependency-light (nh3 only) so the documents owner can import
`sanitize_html` for POST /documents and the save endpoints too.
"""
from __future__ import annotations

import re

import nh3

ALLOWED_TAGS = {
    "h1", "h2", "h3", "p", "ul", "ol", "li", "table", "thead", "tbody", "tr",
    "th", "td", "strong", "em", "u", "br", "hr", "img", "span", "div",
    "blockquote",
}
REMOVE_WITH_CONTENT = {"script", "style", "iframe", "object", "embed", "noscript"}
ALLOWED_ATTRS = {
    "*": {"class", "style", "data-field", "data-ai"},
    "img": {"src", "alt"},
}
MAX_DATA_URI_BYTES = 500 * 1024
# Raster images only: an SVG data URI can carry script, so it is not accepted.
_DATA_IMAGE_RE = re.compile(r"^data:image/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=\s]+$")
_CLASS_RE = re.compile(r"^[A-Za-z0-9_\- ]{1,200}$")
_IMG_WITHOUT_SRC = re.compile(r"<img(?![^>]*\ssrc=)[^>]*>", re.IGNORECASE)

_STYLE_RULES = {
    "text-align": re.compile(r"^(left|right|center|justify)$"),
    "font-weight": re.compile(r"^(normal|bold|[1-9]00)$"),
    "font-style": re.compile(r"^(normal|italic)$"),
    "text-decoration": re.compile(r"^(none|underline)$"),
    "width": re.compile(r"^\d{1,4}(\.\d+)?(px|%|mm|cm|pt)$"),
}
_CELL_ONLY = {"width"}
FIELD_KEY_RE = re.compile(r"^[a-z][A-Za-z0-9]{0,39}$")
PLACEHOLDER_RE = re.compile(r"\{\{\s*([a-z][A-Za-z0-9]*)\s*\}\}")


def _clean_style(tag: str, value: str) -> str | None:
    kept = []
    for part in value.split(";"):
        if ":" not in part:
            continue
        prop, val = (p.strip().lower() for p in part.split(":", 1))
        rule = _STYLE_RULES.get(prop)
        if not rule or not rule.match(val):
            continue
        if prop in _CELL_ONLY and tag not in {"td", "th"}:
            continue
        kept.append(f"{prop}: {val}")
    return "; ".join(kept) or None


def sanitize_html(html: str, *, allow_ai_marks: bool = True) -> str:
    """Strip everything outside the contract's allow-list."""

    def attr_filter(tag: str, attr: str, value: str) -> str | None:
        if attr == "style":
            return _clean_style(tag, value)
        if attr == "data-field":
            return value if FIELD_KEY_RE.match(value) else None
        if attr == "data-ai":
            return "draft" if allow_ai_marks and value == "draft" else None
        if attr == "class":
            return value if _CLASS_RE.match(value) else None
        if attr == "src":  # only <img> can reach here
            ok = _DATA_IMAGE_RE.match(value) and len(value) <= MAX_DATA_URI_BYTES
            return value if ok else None
        return value

    cleaned = nh3.clean(
        html,
        tags=ALLOWED_TAGS,
        clean_content_tags=REMOVE_WITH_CONTENT,
        attributes=ALLOWED_ATTRS,
        attribute_filter=attr_filter,
        url_schemes={"data"},
        strip_comments=True,
        link_rel=None,
    )
    # An image whose src was rejected is removed instead of left as a broken icon.
    return _IMG_WITHOUT_SRC.sub("", cleaned)


def extract_placeholders(html: str) -> list[str]:
    seen: list[str] = []
    for m in PLACEHOLDER_RE.finditer(html):
        if m.group(1) not in seen:
            seen.append(m.group(1))
    return seen


def placeholder_is_sole_child(html: str, key: str, containers: tuple[str, ...]) -> bool:
    """True if every {{key}} sits alone inside one of the given container tags."""
    ph = r"\{\{\s*" + re.escape(key) + r"\s*\}\}"
    total = len(re.findall(ph, html))
    pat = r"<(" + "|".join(containers) + r")(?:\s[^>]*)?>\s*" + ph + r"\s*</\1>"
    return total > 0 and len(re.findall(pat, html)) == total


def _table_marker(key: str) -> str:
    ph = r"\{\{\s*" + re.escape(key) + r"\s*\}\}"
    return r"<tr(?:\s[^>]*)?>\s*<td(?:\s[^>]*)?>\s*" + ph + r"\s*</td>\s*</tr>"


def table_marker_regex(key: str) -> re.Pattern:
    return re.compile(_table_marker(key))


def table_placeholder_ok(html: str, key: str) -> bool:
    """Table fields are authored as a one-cell row: <tr><td>{{key}}</td></tr>.
    (HTML parsers throw bare text out of <tbody>, so the marker needs a cell.)"""
    total = len(re.findall(r"\{\{\s*" + re.escape(key) + r"\s*\}\}", html))
    return total > 0 and len(table_marker_regex(key).findall(html)) == total
