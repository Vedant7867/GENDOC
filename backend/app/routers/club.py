from bson import ObjectId
from fastapi import APIRouter, Request

from ..deps import CurrentUser
from ..errors import ApiError
from ..serializers import serialize_club

router = APIRouter(tags=["club"])


@router.get("/club")
async def get_club(request: Request, user: CurrentUser):
    club = await request.app.state.db.clubs.find_one({"_id": ObjectId(user["clubId"])})
    if club is None:
        raise ApiError(404, "not_found", "Club not found")
    return serialize_club(club)
