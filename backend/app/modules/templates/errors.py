from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class TemplateError(Exception):
    """Raised by this module; rendered in the contract's error shape:
    {"error": {"code": ..., "message": ...}} (+ optional "details")."""

    def __init__(self, status: int, code: str, message: str, details: list | None = None, **extra):
        super().__init__(message)
        self.status, self.code, self.message, self.details, self.extra = status, code, message, details, extra


async def template_error_handler(_: Request, exc: TemplateError) -> JSONResponse:
    body: dict = {"code": exc.code, "message": exc.message}
    if exc.details:
        body["details"] = exc.details
    body.update(exc.extra)
    return JSONResponse(status_code=exc.status, content={"error": body})
