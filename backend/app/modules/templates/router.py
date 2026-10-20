from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Query, Response

from . import deps, service
from .schemas import PreviewBody, SortKey, TemplateCreate, TemplatePatch, ValidateBody


def build_router(db_dep, caller) -> APIRouter:
    r = APIRouter(prefix="/templates", tags=["templates"])
    DB = Depends(db_dep)

    @r.get("")
    async def list_(q: str | None = None, category: str | None = None,
                    sort: SortKey = "order", who=Depends(caller), db=DB):
        items = await service.list_templates(db, who, q=q, category=category, sort=sort)
        return {"items": items, "total": len(items)}

    @r.get("/categories")
    async def categories(who=Depends(caller), db=DB):
        return {"items": await service.category_counts(db, who)}

    @r.post("/validate")
    async def validate(body: ValidateBody, who=Depends(caller)):
        service.require_admin(who)
        return service.validate_only(body.html, body.fields)

    @r.post("/restore-defaults")
    async def restore_defaults(who=Depends(caller), db=DB):
        return await service.restore_defaults(db, who)

    @r.get("/by-type/{template_type}")
    async def by_type(template_type: str, who=Depends(caller), db=DB):
        return await service.get_by_type(db, who, template_type)

    @r.get("/{template_id}")
    async def get_one(template_id: str, who=Depends(caller), db=DB):
        return await service.get_template(db, who, template_id)

    @r.post("", status_code=201)
    async def create(body: TemplateCreate, who=Depends(caller), db=DB):
        return await service.create_template(db, who, body)

    @r.patch("/{template_id}")
    async def patch(template_id: str, body: TemplatePatch, who=Depends(caller), db=DB):
        return await service.update_template(db, who, template_id, body)

    @r.delete("/{template_id}", status_code=204)
    async def delete(template_id: str, who=Depends(caller), db=DB):
        await service.delete_template(db, who, template_id)
        return Response(status_code=204)

    @r.post("/{template_id}/duplicate", status_code=201)
    async def duplicate(template_id: str, who=Depends(caller), db=DB):
        return await service.duplicate_template(db, who, template_id)

    @r.post("/{template_id}/reset")
    async def reset(template_id: str, who=Depends(caller), db=DB):
        return await service.reset_template(db, who, template_id)

    @r.post("/{template_id}/preview")
    async def preview(template_id: str, body: PreviewBody, who=Depends(caller), db=DB):
        return await service.preview(db, who, template_id, body.values, body.useExamples)

    return r
