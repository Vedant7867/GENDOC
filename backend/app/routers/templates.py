from fastapi import APIRouter, Request

from ..deps import CurrentUser
from ..errors import ApiError
from ..serializers import serialize_template

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("")
async def list_templates(request: Request, user: CurrentUser):
    cursor = request.app.state.db.templates.find({"clubId": user["clubId"]}).sort("_id", 1)
    return {"items": [serialize_template(t, include_html=False) async for t in cursor]}


@router.get("/{template_id}")
async def get_template(template_id: str, request: Request, user: CurrentUser):
    tpl = await request.app.state.db.templates.find_one({"_id": template_id, "clubId": user["clubId"]})
    if tpl is None:
        raise ApiError(404, "not_found", "Template not found")
    return serialize_template(tpl, include_html=True)
