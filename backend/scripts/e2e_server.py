"""Run the real API against an IN-MEMORY database with a scripted fake AI (no MongoDB, no API key).

    python -m scripts.e2e_server            # http://127.0.0.1:8765/api   (demo accounts from app/seed.py)

Used by the frontend end-to-end test (npm run test:e2e) and handy for demos. NOT for production:
the data disappears when the process stops and the "AI" only returns canned answers.
"""
import asyncio
import json
import re

import uvicorn
from mongomock_motor import AsyncMongoMockClient

from app.main import create_app, ensure_indexes
from app.seed import seed


class ScriptedLLM:
    """Deterministic stand-in for Gemini: just enough behaviour to exercise every endpoint."""

    async def complete_json(self, system: str, user: str, *, max_tokens: int = 2000) -> dict:
        if "assistant inside an official student-club document editor" in system:
            req = json.loads(user.split("DOCUMENT AND REQUEST:\n", 1)[1])
            hit = next((b for b in req["blocks"] if b["type"] == "paragraph" and len(b["text"]) > 20), None)
            if not hit or "inconsisten" in req["instruction"].lower():
                return {"message": "The dates and venue look consistent.", "proposals": []}
            keep = " ".join(hit.get("protected", []))
            return {"message": "Here is a more formal version.", "proposals": [
                {"action": "replace", "blockId": hit["id"], "html": f"<p>Kindly note: {hit['text']} {keep}</p>", "reason": "more formal"}]}
        if "short, formal wording" in system:
            keys = re.findall(r'"key": "(\w+)"', user)
            return {"drafts": {k: "A well organised event for club members." for k in keys}}
        if "extract structured data" in system:
            return {"values": {"eventTitle": "Web Dev Workshop", "venue": "Seminar Hall", "eventDate": "14 October 2026",
                               "eventTime": "6:00 PM", "expectedAttendance": "120", "studentHeadName": "Ansh Gupta"}}
        return {"title": "Lab Access Form", "category": "Custom", "html": "<h1>Lab Access</h1><p>{{labName}}</p>",
                "fields": [{"key": "labName", "label": "Lab", "required": True}]}


def build():
    db = AsyncMongoMockClient()["gendoc_e2e"]

    async def prepare() -> None:
        await ensure_indexes(db)
        await seed(db)

    asyncio.run(prepare())  # seed before serving; the injected database skips the app's own startup seeding
    return create_app(db=db, llm=ScriptedLLM())


if __name__ == "__main__":
    uvicorn.run(build(), host="127.0.0.1", port=8765, log_level="warning")
