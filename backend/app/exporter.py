"""PDF / DOCX export of a SAVED version (contract s.4): the HTML content plus club branding read at render time.

PDF: WeasyPrint with print CSS (A4, club colours/font, header and footer from the club record).
DOCX: Pandoc (HTML -> docx). Branding header/footer are not carried into DOCX yet (needs a club reference.docx);
the PDF is the reference rendering.
Both tools are optional at import time: a missing tool gives a clear 501 instead of breaking the app.
"""
from __future__ import annotations

import asyncio
import re
import shutil
import tempfile
from pathlib import Path

from .errors import ApiError
from .modules.templates.html_rules import sanitize_html

_BASE_CSS = """
@page { size: A4; margin: 24mm 18mm 22mm 18mm;
        @top-center { content: element(hdr); } @bottom-center { content: element(ftr); } }
#hdr { position: running(hdr); font-size: 9pt; text-align: center; }
#ftr { position: running(ftr); font-size: 8.5pt; text-align: center; color: #555; }
#hdr img { max-height: 16mm; }
body { font-family: %(font)s; font-size: 11pt; line-height: 1.35; color: #111; }
h1 { font-size: 16pt; color: %(primary)s; } h2 { font-size: 13pt; color: %(primary)s; } h3 { font-size: 11.5pt; color: %(accent)s; }
.page-break { break-after: page; border: 0; height: 0; margin: 0; }
table { width: 100%%; border-collapse: collapse; margin: 6pt 0; }
th, td { border: 0.75pt solid #444; padding: 4pt 6pt; vertical-align: top; text-align: left; }
thead th { background: #eef2f7; } tr { break-inside: avoid; }
table.sig-table, table.sig-table td { border: 0; } table.sig-table td { width: 50%%; padding: 18pt 6pt 6pt; }
"""
_SAFE_FONT = re.compile(r"[^A-Za-z0-9 ,'\-]")
_SAFE_COLOR = re.compile(r"^#[0-9a-fA-F]{3,8}$")


def build_html(content: str, club: dict | None) -> str:
    club = club or {}
    colors = club.get("colors") or {}
    primary = colors.get("primary") if _SAFE_COLOR.match(str(colors.get("primary", ""))) else "#0B132B"
    accent = colors.get("accent") if _SAFE_COLOR.match(str(colors.get("accent", ""))) else "#1d4ed8"
    font = _SAFE_FONT.sub("", str(club.get("fontFamily") or "")) or "Georgia"
    css = _BASE_CSS % {"font": f"'{font}', serif", "primary": primary, "accent": accent}
    header = sanitize_html(club.get("headerHtml") or "", allow_ai_marks=False)
    footer = sanitize_html(club.get("footerHtml") or "", allow_ai_marks=False)
    logo = club.get("logo") or ""
    if isinstance(logo, str) and logo.startswith("data:image/") and "svg" not in logo[:30]:
        header = f'<img src="{logo}" alt="">' + header
    body = sanitize_html(content, allow_ai_marks=False)  # defence in depth; content was sanitized on save too
    return (f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>'
            f'<div id="hdr">{header}</div><div id="ftr">{footer}</div>{body}</body></html>')


async def to_pdf(content: str, club: dict | None) -> bytes:
    try:
        from weasyprint import HTML
    except Exception:  # not installed, or system libraries (pango) missing
        raise ApiError(501, "not_implemented", "PDF export is not available on this server (WeasyPrint is not installed).")
    html = build_html(content, club)
    try:
        return await asyncio.to_thread(lambda: HTML(string=html).write_pdf())
    except Exception:
        raise ApiError(500, "export_failed", "The PDF could not be generated.")


async def to_docx(content: str, club: dict | None) -> bytes:
    if not shutil.which("pandoc"):
        raise ApiError(501, "not_implemented", "DOCX export is not available on this server (Pandoc is not installed).")
    body = sanitize_html(content, allow_ai_marks=False)
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "out.docx"
        proc = await asyncio.create_subprocess_exec(
            "pandoc", "-f", "html", "-t", "docx", "-o", str(out),
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        try:
            await asyncio.wait_for(proc.communicate(f"<html><body>{body}</body></html>".encode()), timeout=60)
        except asyncio.TimeoutError:
            proc.kill()
            raise ApiError(500, "export_failed", "The DOCX conversion timed out.")
        if proc.returncode != 0 or not out.exists():
            raise ApiError(500, "export_failed", "The DOCX could not be generated.")
        return out.read_bytes()
