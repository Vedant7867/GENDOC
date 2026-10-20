"""Seed a dev database: one club, the template catalog, demo users and four sample documents.

    python -m app.seed            # add the seed data if the database is empty
    python -m app.seed --reset    # wipe the GENDOC collections first

The templates come from the templates module's own catalog (app/modules/templates/seed).
Demo accounts all use the password below. DEV ONLY: do not use this seed in production.
"""
import argparse
import asyncio
from datetime import datetime, timezone

from .config import get_settings
from .main import ensure_indexes
from .modules.templates import seed_templates
from .modules.templates.render import render_html
from .security import hash_password

DEMO_PASSWORD = "Password123!"

CLUB = {
    "name": "ACM NIT Surat Student Chapter",
    "logo": "",
    "colors": {"primary": "#1D63DC", "accent": "#0B132B"},
    "fontFamily": "Inter, Arial, sans-serif",
    "headerHtml": "<strong>ACM NIT Surat Student Chapter</strong>",
    "footerHtml": "Sardar Vallabhbhai National Institute of Technology, Surat",
    "signatories": [],  # fill in from Club Settings; never invented
}

DEMO_USERS = [
    ("Kristal Patel", "kristal.patel@svnit.acm.org", "Club Member"),
    ("Demo Coordinator", "coordinator@svnit.acm.org", "Core Coordinator"),
    ("Demo Admin", "admin@svnit.acm.org", "Club Admin"),
    ("Demo Faculty Advisor", "faculty@svnit.acm.org", "Faculty Advisor"),
]

# Sample documents mirror the frontend's INITIAL_DOCUMENTS. Official fields are left blank, not invented.
# (title, template key, status, last edited, field values)
SAMPLE_DOCS = [
    ("Web Development Workshop - Event Proposal", "event-proposal", "Completed",
     datetime(2026, 10, 17, 10, 30, tzinfo=timezone.utc),
     {"eventTitle": "Web Development Workshop", "eventDate": "14-15 October 2026",
      "venue": "Seminar Hall, SVNIT Surat", "expectedAttendance": "120"}),
    ("Permission Letter - Seminar Hall", "permission-letter", "Needs Review",
     datetime(2026, 10, 16, 15, 0, tzinfo=timezone.utc),
     {"eventTitle": "Web Development Workshop", "eventDate": "14-15 October 2026",
      "venue": "Seminar Hall, SVNIT Surat", "expectedAttendance": "120"}),
    ("Tech Fest 2026 - Event Notice", "event-notice", "Completed",
     datetime(2026, 10, 8, 13, 12, tzinfo=timezone.utc),
     {"eventTitle": "Tech Fest 2026", "eventDate": "October 2026", "venue": "SVNIT Surat"}),
    ("Cultural Event - Budget Estimate", "budget-estimate", "Draft",
     datetime(2026, 10, 2, 11, 20, tzinfo=timezone.utc),
     {"eventTitle": "Cultural Event 2026"}),
]

COLLECTIONS = ("users", "clubs", "templates", "documents", "document_versions")
SUMMARY_KEYS = ("venue", "eventDate", "expectedAttendance", "budgetTotal", "summary", "organizer")


async def seed(db, reset: bool = False) -> bool:
    """Returns True if data was written."""
    if reset:
        for name in COLLECTIONS:
            await db[name].delete_many({})
    if await db.clubs.find_one({}):
        return False

    now = datetime.now(timezone.utc)
    club_id = str((await db.clubs.insert_one(dict(CLUB))).inserted_id)

    user_ids = {}
    for name, email, role in DEMO_USERS:
        res = await db.users.insert_one(
            {"name": name, "email": email, "role": role, "passwordHash": hash_password(DEMO_PASSWORD),
             "clubId": club_id, "createdAt": now}
        )
        user_ids[role] = str(res.inserted_id)

    await seed_templates(db, club_id)

    for title, key, status, edited, fields in SAMPLE_DOCS:
        tpl = await db.templates.find_one({"clubId": club_id, "key": key})
        content = render_html(tpl["html"], tpl["fields"], fields)
        doc = {
            "title": title, "templateId": str(tpl["_id"]),
            "templateType": tpl.get("templateType") or tpl["title"], "status": status,
            "ownerId": user_ids["Club Member"], "clubId": club_id,
            **{k: fields[k] for k in SUMMARY_KEYS if k in fields},
            "currentVersion": 1, "hasAiDraft": False, "createdAt": edited, "updatedAt": edited, "deletedAt": None,
        }
        res = await db.documents.insert_one(doc)
        await db.document_versions.insert_one(
            {"documentId": str(res.inserted_id), "version": 1, "content": content, "fields": fields,
             "source": "generated", "note": None, "savedBy": user_ids["Club Member"], "savedAt": edited}
        )
    return True


async def _main(reset: bool) -> None:
    from motor.motor_asyncio import AsyncIOMotorClient

    s = get_settings()
    client = AsyncIOMotorClient(s.mongo_uri, tz_aware=True)
    db = client[s.db_name]
    await ensure_indexes(db)
    wrote = await seed(db, reset=reset)
    print("Seeded demo data." if wrote else "Database already has data; use --reset to start over.")
    client.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--reset", action="store_true")
    asyncio.run(_main(ap.parse_args().reset))
