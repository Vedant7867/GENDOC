import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.main import create_app, ensure_indexes
from app.modules.templates.render import default_values, example_values
from app.modules.templates.seed import catalog_entry
from app.seed import DEMO_PASSWORD, seed

EMAILS = {
    "member": "kristal.patel@svnit.acm.org",
    "coordinator": "coordinator@svnit.acm.org",
    "admin": "admin@svnit.acm.org",
    "faculty": "faculty@svnit.acm.org",
}


@pytest_asyncio.fixture
async def db():
    database = AsyncMongoMockClient()["gendoc_test"]
    await ensure_indexes(database)
    await seed(database)
    return database


@pytest_asyncio.fixture
async def client(db):
    app = create_app(db=db)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def login(client, role: str) -> dict:
    r = await client.post("/api/auth/login", json={"email": EMAILS[role], "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture
def as_role(client):
    async def _as(role: str) -> dict:
        return await login(client, role)

    return _as


def complete_fields(template_key: str) -> dict:
    """Every field of a catalog template filled from its own examples and defaults (nothing invented here)."""
    fields = catalog_entry(template_key)["fields"]
    return {**default_values(fields), **example_values(fields)}


FULL_PROPOSAL = {
    "title": "AI Workshop - Event Proposal",
    "templateId": "event-proposal",  # the template's stable key; the template id (ObjectId string) works too
    "fields": {
        **complete_fields("event-proposal"),
        "eventTitle": "AI Workshop",
        "eventDate": "20 November 2026",
        "venue": "Lab 3",
        "expectedAttendance": "80",
        "budgetTotal": "10000",
    },
    "content": '<h1>AI Workshop</h1><p><span data-field="venue">Lab 3</span></p>',
}
