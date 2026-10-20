"""GENDOC generator: natural language / form -> document HTML (contract s.3 'Generator').

    from app.modules import templates, generator
    templates.install(app, get_db=get_db, get_current_user=get_current_user)
    generator.install(app, get_db=get_db, get_current_user=get_current_user)   # llm optional

Flow:  POST /generator/extract  ->  (user answers `missing`)  ->  POST /generator/draft (optional)
       ->  POST /generator/generate  ->  client sends `response.document` unchanged to POST /documents.
"""
from __future__ import annotations

from typing import Callable

from fastapi import FastAPI

from ..templates import deps
from ..templates.errors import TemplateError, template_error_handler
from .llm import LLM, AnthropicLLM, GeminiLLM, LLMNotConfigured, make_llm

__all__ = ["install", "LLM", "AnthropicLLM", "GeminiLLM", "make_llm"]


def install(app: FastAPI, *, get_db: Callable, get_current_user: Callable,
            llm: LLM | None = None, llm_factory: Callable[[], LLM] | None = None,
            prefix: str = "/api") -> None:
    """`llm` injects a ready provider (tests). `llm_factory` builds one on first use, so the API starts and
    all non-AI endpoints work even when no key is configured."""
    from .router import build_router

    holder: dict = {"llm": llm}

    def get_llm() -> LLM:
        if holder["llm"] is None:
            try:
                holder["llm"] = (llm_factory or make_llm)()
            except LLMNotConfigured as e:
                raise TemplateError(503, "llm_unavailable", str(e))
        return holder["llm"]

    db_dep, caller = deps.build_dependencies(get_db, get_current_user)
    app.add_exception_handler(TemplateError, template_error_handler)  # same handler as the templates module
    app.include_router(build_router(get_llm, db_dep, caller), prefix=prefix)
