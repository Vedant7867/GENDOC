"""GENDOC templates module (contract s.5 `templates`, s.6 /templates*).

Wiring (3 lines in the app factory; nothing else in the repo is touched):

    from app.modules import templates
    templates.install(app, get_db=get_db, get_current_user=get_current_user)

`get_db` -> Motor database; `get_current_user` -> the app's JWT dependency.
"""
from __future__ import annotations

from typing import Callable

from fastapi import FastAPI

from . import deps
from .errors import TemplateError, template_error_handler
from .html_rules import sanitize_html
from .render import render_html
from .service import ensure_indexes, restore_defaults, seed_templates

__all__ = ["install", "seed_templates", "ensure_indexes", "sanitize_html", "render_html",
           "TemplateError", "restore_defaults"]


def install(app: FastAPI, *, get_db: Callable, get_current_user: Callable,
            prefix: str = "/api") -> None:
    from .router import build_router

    db_dep, caller = deps.build_dependencies(get_db, get_current_user)
    app.add_exception_handler(TemplateError, template_error_handler)
    app.include_router(build_router(db_dep, caller), prefix=prefix)
