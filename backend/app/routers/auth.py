from fastapi import APIRouter, Request

from ..config import get_settings
from ..deps import CurrentUser
from ..errors import ApiError
from ..models import LoginIn, SignupIn
from ..security import create_token, hash_password, verify_password
from ..serializers import serialize_user
from ..utils import utcnow

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", status_code=201)
async def signup(body: SignupIn, request: Request):
    db = request.app.state.db
    settings = get_settings()
    email = body.email.lower()

    role = "Club Member"
    if body.role and body.role != "Club Member":
        if not settings.allow_role_self_select:
            raise ApiError(
                403,
                "forbidden",
                "New accounts start as Club Member. A Club Admin can change roles.",
            )
        role = body.role

    club = await db.clubs.find_one({}, sort=[("_id", 1)])
    if club is None:
        raise ApiError(503, "not_seeded", "No club exists yet. Run: python -m app.seed")

    if await db.users.find_one({"email": email}):
        raise ApiError(409, "email_taken", "An account with this email already exists")

    user = {
        "name": body.name,
        "email": email,
        "role": role,
        "passwordHash": hash_password(body.password),
        "clubId": str(club["_id"]),
        "createdAt": utcnow(),
    }
    res = await db.users.insert_one(user)
    user["_id"] = res.inserted_id
    return {"token": create_token(str(res.inserted_id)), "user": serialize_user(user)}


@router.post("/login")
async def login(body: LoginIn, request: Request):
    db = request.app.state.db
    user = await db.users.find_one({"email": body.email.lower()})
    # Same message for unknown email and wrong password.
    if user is None or not verify_password(user["passwordHash"], body.password):
        raise ApiError(401, "unauthenticated", "Invalid email or password")
    return {"token": create_token(str(user["_id"])), "user": serialize_user(user)}


@router.get("/me")
async def me(user: CurrentUser):
    return serialize_user(user)
