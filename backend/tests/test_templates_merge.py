"""Integration tests: the templates module mounted in this app, together with the documents API."""
from tests.conftest import FULL_PROPOSAL, login

MINIMAL = {
    "title": "Quick Note",
    "category": "Administration",
    "html": "<p>{{eventTitle}}</p>",
    "fields": [{"key": "eventTitle", "label": "Event title", "required": True}],
}


async def test_catalog_is_served_without_html_in_the_list(client, as_role):
    h = await as_role("member")
    body = (await client.get("/api/templates", headers=h)).json()
    assert body["total"] == 17 and len(body["items"]) == 17
    first = body["items"][0]
    assert first["key"] == "event-proposal" and "html" not in first and first["requiredFieldCount"] > 0
    assert (await client.get("/api/templates?category=Publicity", headers=h)).json()["total"] == 1
    cats = (await client.get("/api/templates/categories", headers=h)).json()["items"]
    assert cats[0] == {"category": "All", "count": 17}


async def test_get_one_and_by_type(client, as_role):
    h = await as_role("member")
    by_type = (await client.get("/api/templates/by-type/Event Proposal", headers=h)).json()
    one = (await client.get(f"/api/templates/{by_type['id']}", headers=h)).json()
    assert "{{eventTitle}}" in one["html"] and any(f["official"] for f in one["fields"])
    assert (await client.get("/api/templates/not-an-id", headers=h)).status_code == 404


async def test_requires_sign_in_and_uses_the_shared_error_shape(client, as_role):
    r = await client.get("/api/templates")
    assert r.status_code == 401 and r.json()["error"]["code"] == "unauthenticated"
    member = await as_role("member")
    r = await client.post("/api/templates", json=MINIMAL, headers=member)
    assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"


async def test_documents_can_be_created_from_template_key_or_id(client, as_role):
    h = await as_role("member")
    tpl = (await client.get("/api/templates/by-type/Event Proposal", headers=h)).json()
    by_key = await client.post("/api/documents", json=FULL_PROPOSAL, headers=h)
    by_id = await client.post("/api/documents", json={**FULL_PROPOSAL, "templateId": tpl["id"]}, headers=h)
    assert by_key.status_code == 201 and by_id.status_code == 201
    assert by_key.json()["templateId"] == by_id.json()["templateId"] == tpl["id"]


async def test_usage_count_follows_documents(client, as_role):
    h = await as_role("member")
    def used(items):
        return next(t for t in items if t["key"] == "event-proposal")["usedCount"]
    before = used((await client.get("/api/templates", headers=h)).json()["items"])
    await client.post("/api/documents", json=FULL_PROPOSAL, headers=h)
    after = used((await client.get("/api/templates", headers=h)).json()["items"])
    assert after == before + 1
    # a deleted document no longer counts
    did = (await client.post("/api/documents", json=FULL_PROPOSAL, headers=h)).json()["id"]
    await client.delete(f"/api/documents/{did}", headers=h)
    assert used((await client.get("/api/templates", headers=h)).json()["items"]) == after


async def test_admin_manages_templates_and_documents_follow(client, as_role):
    admin, member = await as_role("admin"), await as_role("member")
    created = await client.post("/api/templates", json=MINIMAL, headers=admin)
    assert created.status_code == 201
    tpl = created.json()
    assert tpl["version"] == 1 and tpl["isSystem"] is False and tpl["templateType"] == "Quick Note"

    doc = await client.post(
        "/api/documents",
        json={"title": "Note 1", "templateId": tpl["id"], "fields": {"eventTitle": "Hack Night"}, "content": "<p>x</p>"},
        headers=member,
    )
    assert doc.status_code == 201 and doc.json()["templateType"] == "Quick Note"

    # the required field is enforced from the template's own definition
    missing = await client.post(
        "/api/documents", json={"title": "Note 2", "templateId": tpl["id"], "fields": {}, "content": "<p>x</p>"}, headers=member
    )
    assert missing.status_code == 422 and missing.json()["error"]["fields"] == ["eventTitle"]

    # edits bump the version and a stale baseVersion conflicts
    ok = await client.patch(f"/api/templates/{tpl['id']}", json={"description": "d", "baseVersion": 1}, headers=admin)
    assert ok.status_code == 200
    html = await client.patch(
        f"/api/templates/{tpl['id']}", json={"html": "<p>{{eventTitle}} again</p>", "baseVersion": 1}, headers=admin
    )
    assert html.status_code == 200 and html.json()["version"] == 2
    stale = await client.patch(f"/api/templates/{tpl['id']}", json={"description": "x", "baseVersion": 1}, headers=admin)
    assert stale.status_code == 409 and stale.json()["error"]["code"] == "version_conflict"


async def test_deleted_templates_cannot_start_new_documents(client, as_role):
    admin, member = await as_role("admin"), await as_role("member")
    tpl = (await client.post("/api/templates", json=MINIMAL, headers=admin)).json()
    assert (await client.delete(f"/api/templates/{tpl['id']}", headers=admin)).status_code == 204
    body = {"title": "N", "templateId": tpl["id"], "fields": {"eventTitle": "x"}, "content": "<p>x</p>"}
    r = await client.post("/api/documents", json=body, headers=member)
    assert r.status_code == 422
    assert (await client.get(f"/api/templates/{tpl['id']}", headers=member)).status_code == 404


async def test_validate_and_preview(client, as_role):
    admin, member = await as_role("admin"), await as_role("member")
    bad = await client.post(
        "/api/templates/validate",
        json={"html": "<p>{{eventTitle}} {{unknownKey}}</p>", "fields": [{"key": "eventTitle", "label": "Event title"}]},
        headers=admin,
    )
    assert bad.status_code == 200 and bad.json()["valid"] is False
    assert (await client.post("/api/templates/validate", json={"html": "<p>x</p>"}, headers=member)).status_code == 403

    tpl = (await client.get("/api/templates/by-type/Event Notice", headers=member)).json()
    prev = (await client.post(f"/api/templates/{tpl['id']}/preview", json={"values": {"eventTitle": "Tech Fest"}}, headers=member)).json()
    assert 'data-field="eventTitle">Tech Fest<' in prev["html"]


async def test_templates_are_scoped_per_club_and_seed_lazily(client, as_role, db):
    from app.security import hash_password

    other = str((await db.clubs.insert_one({"name": "Other Club"})).inserted_id)
    await db.users.insert_one({"name": "Eve", "email": "eve@other.org", "role": "Club Admin",
                               "passwordHash": hash_password("longenough1"), "clubId": other})
    tok = (await client.post("/api/auth/login", json={"email": "eve@other.org", "password": "longenough1"})).json()["token"]
    eve = {"Authorization": f"Bearer {tok}"}
    member = await as_role("member")
    mine = (await client.get("/api/templates/by-type/Event Proposal", headers=member)).json()

    theirs = (await client.get("/api/templates", headers=eve)).json()
    assert theirs["total"] == 17  # the catalog is seeded for the new club on first use
    assert mine["id"] not in {t["id"] for t in theirs["items"]}
    assert (await client.get(f"/api/templates/{mine['id']}", headers=eve)).status_code == 403
    # a document cannot be started from another club's template
    body = {**FULL_PROPOSAL, "templateId": mine["id"]}
    assert (await client.post("/api/documents", json=body, headers=eve)).status_code == 422
