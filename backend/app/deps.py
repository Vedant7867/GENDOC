from typing import Annotated

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .errors import ApiError
from .security import decode_token

_bearer = HTTPBearer(auto_error=False)


def get_db(request: Request):
    return request.app.state.db


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db=Depends(get_db),
) -> dict:
    if creds is None:
        raise ApiError(401, "unauthenticated", "Sign in required")
    user_id = decode_token(creds.credentials)
    if user_id is None:
        raise ApiError(401, "unauthenticated", "Your session is invalid or has expired")
    try:
        oid = ObjectId(user_id)
    except (InvalidId, TypeError):
        raise ApiError(401, "unauthenticated", "Your session is invalid or has expired")
    user = await db.users.find_one({"_id": oid})
    if user is None:
        raise ApiError(401, "unauthenticated", "Your session is invalid or has expired")
    user["id"] = str(user["_id"])
    return user


CurrentUser = Annotated[dict, Depends(get_current_user)]
