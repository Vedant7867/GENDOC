from __future__ import annotations

from fastapi import APIRouter, Depends

from ..templates.errors import TemplateError
from . import service
from .schemas import CopilotBody, DraftBody, ExtractBody, FreeformBody, GenerateBody


def build_router(get_llm, db_dep, caller) -> APIRouter:
    r = APIRouter(prefix="/generator", tags=["generator"])
    DB = Depends(db_dep)

    def need_creator(who) -> None:
        if who.role == "Faculty Advisor":
            raise TemplateError(403, "forbidden", "Faculty Advisors cannot create documents")

    @r.post("/extract")
    async def extract(body: ExtractBody, who=Depends(caller), db=DB):
        need_creator(who)
        return await service.extract(db, who, get_llm(), body)

    @r.post("/draft")
    async def draft(body: DraftBody, who=Depends(caller), db=DB):
        need_creator(who)
        return await service.draft(db, who, get_llm(), body)

    @r.post("/generate")
    async def generate(body: GenerateBody, who=Depends(caller), db=DB):
        need_creator(who)
        return await service.generate(db, who, body)

    @r.post("/freeform")
    async def freeform(body: FreeformBody, who=Depends(caller), db=DB):
        need_creator(who)
        return await service.freeform(db, who, get_llm(), body.prompt)

    @r.post("/copilot")
    async def copilot(body: CopilotBody, who=Depends(caller), db=DB):
        need_creator(who)
        return await service.copilot(db, who, get_llm(), body)

    return r
