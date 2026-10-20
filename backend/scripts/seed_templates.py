"""Seed / sync the built-in templates.  Safe to run repeatedly.

    python -m scripts.seed_templates --club-id <id>            # one club
    python -m scripts.seed_templates --all-clubs               # every doc in `clubs`
    python -m scripts.seed_templates --club-id <id> --sync     # refresh untouched built-ins

Env: MONGODB_URI (default mongodb://localhost:27017), MONGODB_DB (default gendoc).
The backend owner's seed script can instead just call:
    await templates.seed_templates(db, str(club_id))
"""
import argparse
import asyncio
import os

from motor.motor_asyncio import AsyncIOMotorClient

from app.modules.templates import seed_templates


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--club-id")
    ap.add_argument("--all-clubs", action="store_true")
    ap.add_argument("--sync", action="store_true")
    a = ap.parse_args()
    if not a.club_id and not a.all_clubs:
        ap.error("give --club-id or --all-clubs")
    db = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))[os.getenv("MONGODB_DB", "gendoc")]
    ids = [a.club_id] if a.club_id else [str(c["_id"]) async for c in db.clubs.find({}, {"_id": 1})]
    for cid in ids:
        print(cid, await seed_templates(db, cid, sync=a.sync))


if __name__ == "__main__":
    asyncio.run(main())
