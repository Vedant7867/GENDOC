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

    @r.get("/status")
    async def status(who=Depends(caller)):
        """Is the AI configured? (No network call.) The UI/ops can use this to explain why AI features are off."""
        try:
            llm = get_llm()
        except TemplateError as e:
            return {"configured": False, "problem": e.message}
        return {"configured": True, "provider": type(llm).__name__, "model": getattr(llm, "model", None)}

    @r.post("/status/test")
    async def status_test(who=Depends(caller)):
        """One tiny real call to the provider (Club Admin only) to prove the key and model work."""
        if who.role != "Club Admin":
            raise TemplateError(403, "forbidden", "Only a Club Admin can test the AI connection")
        llm = get_llm()
        await service.ping(llm)
        return {"ok": True, "provider": type(llm).__name__, "model": getattr(llm, "model", None)}

    @r.post("/copilot")
    async def copilot(body: CopilotBody, who=Depends(caller), db=DB):
        need_creator(who)
        return await service.copilot(db, who, get_llm(), body)

    return r
