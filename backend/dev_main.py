import os
from fastapi import FastAPI, Header, HTTPException
from app.modules import templates

if os.getenv("MONGODB_URI"):
    from motor.motor_asyncio import AsyncIOMotorClient
    db = AsyncIOMotorClient(os.environ["MONGODB_URI"])["gendoc"]
else:
    from mongomock_motor import AsyncMongoMockClient   # in-memory, no install needed
    db = AsyncMongoMockClient()["gendoc"]

USERS = {
    "admin":  {"id": "u1", "name": "Admin",  "clubId": "club1", "role": "Club Admin"},
    "member": {"id": "u2", "name": "Member", "clubId": "club1", "role": "Club Member"},
}

async def get_current_user(authorization: str = Header(default="")):
    u = USERS.get(authorization.removeprefix("Bearer "))
    if not u:
        raise HTTPException(401)
    return u

app = FastAPI()
templates.install(app, get_db=lambda: db, get_current_user=get_current_user)