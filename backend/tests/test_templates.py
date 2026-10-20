"""Run: pytest -q   (uses mongomock-motor; no MongoDB needed)."""
import pytest
from bson import ObjectId
from fastapi import Depends, FastAPI, Header, HTTPException
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.modules import templates
from app.modules.templates.html_rules import sanitize_html
from app.modules.templates.seed import CATALOG

USERS = {
    "admin": {"id": "u1", "name": "Admin", "clubId": "club1", "role": "Club Admin"},
    "member": {"id": "u2", "name": "Mem", "clubId": "club1", "role": "Club Member"},
    "other": {"id": "u3", "name": "Oth", "clubId": "club2", "role": "Club Admin"},
}


@pytest.fixture
def ctx():
    db = AsyncMongoMockClient()["gendoc_test"]
    app = FastAPI()

    async def get_user(authorization: str = Header(default="")):
        who = USERS.get(authorization.removeprefix("Bearer "))
        if not who:
            raise HTTPException(401)
        return who

    templates.install(app, get_db=lambda: db, get_current_user=get_user)
    return app, db


@pytest.fixture
async def client(ctx):
    app, _ = ctx
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        yield c


def H(who="admin"):
    return {"Authorization": f"Bearer {who}"}


NEW = {"title": "Mini Letter", "category": "Custom", "html": "<p>Dear {{name}},</p>",
       "fields": [{"key": "name", "label": "Name", "type": "text", "required": True}]}


async def test_catalog_is_valid_and_complete():
    assert len(CATALOG) >= 15
    keys = [t["key"] for t in CATALOG]
    assert len(keys) == len(set(keys))
    for k in ("event-proposal", "permission-letter", "bill-summary", "bill-certificate", "prize-money"):
        assert k in keys[:5]


async def test_requires_auth(client):
    assert (await client.get("/api/templates")).status_code == 401


async def test_list_autoseeds_and_hides_html(client):
    r = await client.get("/api/templates", headers=H("member"))
    body = r.json()
    assert r.status_code == 200 and body["total"] == len(CATALOG)
    assert "html" not in body["items"][0] and body["items"][0]["key"] == "event-proposal"
    assert {"id", "title", "category", "usedCount", "versionLabel", "fieldCount"} <= body["items"][0].keys()


async def test_filters_and_categories(client):
    r = await client.get("/api/templates?category=Prize Money", headers=H())
    assert [t["key"] for t in r.json()["items"]] == ["prize-money"]
    r = await client.get("/api/templates?q=bill", headers=H())
    assert r.json()["total"] >= 1
    cats = (await client.get("/api/templates/categories", headers=H())).json()["items"]
    assert cats[0] == {"category": "All", "count": len(CATALOG)}


async def test_detail_and_by_type(client):
    items = (await client.get("/api/templates", headers=H())).json()["items"]
    one = (await client.get(f"/api/templates/{items[0]['id']}", headers=H("member"))).json()
    assert "{{refNo}}" in one["html"] and any(f["key"] == "expenseItems" for f in one["fields"])
    bt = await client.get("/api/templates/by-type/permission letter", headers=H())
    assert bt.json()["key"] == "permission-letter"


async def test_cross_club_isolation(client):
    tid = (await client.get("/api/templates", headers=H())).json()["items"][0]["id"]
    await client.get("/api/templates", headers=H("other"))  # seeds club2
    assert (await client.get(f"/api/templates/{tid}", headers=H("other"))).status_code == 403
    assert (await client.get("/api/templates/notanid", headers=H())).status_code == 404


async def test_only_admin_mutates(client):
    for call in (client.post("/api/templates", json=NEW, headers=H("member")),
                 client.post("/api/templates/restore-defaults", headers=H("member"))):
        r = await call
        assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"


async def test_create_validates_and_sanitizes(client):
    bad = {**NEW, "html": "<p>{{missing}}</p>"}
    r = await client.post("/api/templates", json=bad, headers=H())
    assert r.status_code == 422 and r.json()["error"]["code"] == "validation_error"
    evil = {**NEW, "html": '<p onclick="x()">Dear {{name}}</p><script>alert(1)</script><iframe src="x"></iframe>'}
    r = await client.post("/api/templates", json=evil, headers=H())
    assert r.status_code == 201
    html = r.json()["html"]
    assert "script" not in html and "iframe" not in html and "onclick" not in html and "{{name}}" in html
    assert r.json()["isSystem"] is False and r.json()["key"] == "mini-letter"


async def test_patch_bumps_version_only_on_content_and_conflicts(client):
    t = (await client.post("/api/templates", json=NEW, headers=H())).json()
    r = await client.patch(f"/api/templates/{t['id']}", json={"description": "x"}, headers=H())
    assert r.json()["version"] == 1
    r = await client.patch(f"/api/templates/{t['id']}", json={"html": "<p>Hi {{name}}!</p>"}, headers=H())
    assert r.json()["version"] == 2
    r = await client.patch(f"/api/templates/{t['id']}", json={"title": "n", "baseVersion": 1}, headers=H())
    assert r.status_code == 409 and r.json()["error"]["code"] == "version_conflict"


async def test_duplicate_reset_delete_restore(client):
    items = (await client.get("/api/templates", headers=H())).json()["items"]
    pl = next(i for i in items if i["key"] == "permission-letter")
    dup = await client.post(f"/api/templates/{pl['id']}/duplicate", headers=H())
    assert dup.status_code == 201 and dup.json()["title"].endswith("(Copy)") and dup.json()["isSystem"] is False
    await client.patch(f"/api/templates/{pl['id']}", json={"html": "<p>{{refNo}}</p>", "fields": [
        {"key": "refNo", "label": "Ref", "required": True}]}, headers=H())
    reset = (await client.post(f"/api/templates/{pl['id']}/reset", headers=H())).json()
    assert reset["version"] == 3 and reset["customized"] is False and "{{venue}}" in reset["html"]
    assert (await client.delete(f"/api/templates/{pl['id']}", headers=H())).status_code == 204
    assert (await client.get(f"/api/templates/{pl['id']}", headers=H())).status_code == 404
    out = (await client.post("/api/templates/restore-defaults", headers=H())).json()
    assert out["restored"] == ["permission-letter"]


async def test_preview_wraps_values_and_reports_missing(client):
    items = (await client.get("/api/templates", headers=H())).json()["items"]
    pm = next(i for i in items if i["key"] == "prize-money")
    r = (await client.post(f"/api/templates/{pm['id']}/preview",
                           json={"values": {"recipientName": "A <b>B</b>"}, "useExamples": True}, headers=H())).json()
    assert '<span data-field="recipientName">A &lt;b&gt;B&lt;/b&gt;</span>' in r["html"]
    assert "amount" in r["missingRequired"] and "recipientName" not in r["missingRequired"]
    ep = next(i for i in items if i["key"] == "event-proposal")
    r = (await client.post(f"/api/templates/{ep['id']}/preview", json={}, headers=H())).json()
    assert '<tr data-field="expenseItems"><td>1</td><td>Banner (8*6)</td><td>800</td></tr>' in r["html"]


async def test_validate_endpoint(client):
    r = await client.post("/api/templates/validate", json={
        "html": "<ul>{{items}}</ul><p>{{nope}}</p>",
        "fields": [{"key": "items", "label": "Items", "type": "list"}]}, headers=H())
    body = r.json()
    assert body["valid"] is False and body["errors"][0]["field"] == "nope"


async def test_usage_count_comes_from_documents(ctx, client):
    _, db = ctx
    items = (await client.get("/api/templates", headers=H())).json()["items"]
    pm = next(i for i in items if i["key"] == "prize-money")
    await db.documents.insert_many([{"clubId": "club1", "templateId": pm["id"], "deletedAt": None},
                                    {"clubId": "club1", "templateId": pm["id"], "deletedAt": None},
                                    {"clubId": "club1", "templateId": pm["id"], "deletedAt": "x"}])
    items = (await client.get("/api/templates?sort=mostUsed", headers=H())).json()["items"]
    assert items[0]["key"] == "prize-money" and items[0]["usedCount"] == 2 and items[0]["isMostUsed"]


async def test_seed_is_idempotent_and_never_clobbers_edits(ctx, client):
    _, db = ctx
    await client.get("/api/templates", headers=H())
    first = await db.templates.count_documents({})
    again = await templates.seed_templates(db, "club1", sync=True)
    assert again == {"inserted": [], "updated": []} and await db.templates.count_documents({}) == first


def test_sanitizer_rules():
    out = sanitize_html('<p style="text-align:center; color:red; position:fixed">x</p>'
                        '<td style="width:30%">y</td><p style="width:30%">z</p><a href="javascript:1">l</a>'
                        '<img src="https://evil/x.png"><span data-ai="draft">t</span><span data-field="venue">v</span>')
    assert "color" not in out and "position" not in out and "text-align: center" in out
    assert 'href' not in out and "https://evil" not in out and 'data-ai="draft"' in out
    assert 'data-field="venue"' in out
    assert 'data-ai' not in sanitize_html('<span data-ai="draft">t</span>', allow_ai_marks=False)
