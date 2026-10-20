"""The ONLY file that touches teammates' code.

`install()` (see __init__.py) stores two provider callables here, so this
module never imports the auth or database modules of the main app.

Auth provider contract: an async/sync FastAPI dependency returning the current
user as either a dict or an object exposing `id`, `clubId` (or `club_id`) and
`role` ("Club Member" | "Core Coordinator" | "Club Admin" | "Faculty Advisor").
"""
from __future__ import annotations

import inspect
from dataclasses import dataclass
from typing import Any, Callable

from fastapi import Depends

from .errors import TemplateError

ADMIN_ROLE = "Club Admin"


@dataclass(frozen=True)
class Caller:
    id: str
    club_id: str
    role: str
    name: str = ""


def _pick(u: Any, *names: str, default: Any = None) -> Any:
    for n in names:
        v = u.get(n) if isinstance(u, dict) else getattr(u, n, None)
        if v is not None:
            return v
    return default


def build_dependencies(get_db: Callable, get_current_user: Callable):
    """Create the db and caller dependencies for ONE app. Nothing is stored globally, so several apps
    (for example one per test) can be created in the same process without sharing a database."""

    async def db_dep():
        res = get_db()
        return await res if inspect.isawaitable(res) else res

    async def caller_dep(user=Depends(get_current_user)) -> Caller:
        if user is None:
            raise TemplateError(401, "unauthenticated", "Authentication required")
        return Caller(
            id=str(_pick(user, "id", "_id", default="")),
            club_id=str(_pick(user, "clubId", "club_id", default="")),
            role=str(_pick(user, "role", default="")),
            name=str(_pick(user, "name", default="")),
        )

    return db_dep, caller_dep
