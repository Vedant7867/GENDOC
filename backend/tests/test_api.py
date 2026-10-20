import copy

from tests.conftest import FULL_PROPOSAL, login


# ---------- auth ----------

async def test_unauthenticated_requests_are_rejected(client):
    r = await client.get("/api/documents")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "unauthenticated"


async def test_login_me_and_bad_password(client, as_role):
    h = await as_role("member")
    me = await client.get("/api/auth/me", headers=h)
    assert me.json()["role"] == "Club Member" and me.json()["email"].startswith("kristal")
    assert "passwordHash" not in me.json()
    bad = await client.post("/api/auth/login", json={"email": "kristal.patel@svnit.acm.org", "password": "wrong-pass"})
    assert bad.status_code == 401
    nobody = await client.post("/api/auth/login", json={"email": "no@one.org", "password": "whatever1"})
    assert nobody.json() == bad.json()  # same message either way


async def test_signup_creates_member_and_blocks_role_escalation(client):
    ok = await client.post("/api/auth/signup", json={"name": "New Person", "email": "New@Person.org", "password": "longenough1"})
    assert ok.status_code == 201 and ok.json()["user"]["role"] == "Club Member"
    assert ok.json()["user"]["email"] == "new@person.org"
    dup = await client.post("/api/auth/signup", json={"name": "X", "email": "new@person.org", "password": "longenough1"})
    assert dup.status_code == 409
    esc = await client.post("/api/auth/signup", json={"name": "X", "email": "x@y.org", "password": "longenough1", "role": "Club Admin"})
    assert esc.status_code == 403
    short = await client.post("/api/auth/signup", json={"name": "X", "email": "z@y.org", "password": "short"})
    assert short.status_code == 422 and short.json()["error"]["code"] == "validation_error"


# ---------- list / folders ----------

async def test_list_filters_search_sort_paginate(client, as_role):
    h = await as_role("member")
    r = await client.get("/api/documents", headers=h)
    body = r.json()
    assert body["total"] == 4 and len(body["items"]) == 4 and body["page"] == 1
    assert "content" not in body["items"][0]
    assert body["items"][0]["title"] == "Web Development Workshop - Event Proposal"  # newest first

    assert (await client.get("/api/documents?status=Draft", headers=h)).json()["total"] == 1
    assert (await client.get("/api/documents?templateType=Event Notice", headers=h)).json()["total"] == 1
    assert (await client.get("/api/documents?q=seminar", headers=h)).json()["total"] == 2  # venue match, case-insensitive
    assert (await client.get("/api/documents?q=(", headers=h)).json()["total"] == 0  # regex chars are escaped

    page = (await client.get("/api/documents?limit=2&page=2&sort=title", headers=h)).json()
    assert page["total"] == 4 and len(page["items"]) == 2
    assert page["items"][0]["title"] < page["items"][1]["title"]
    assert (await client.get("/api/documents?limit=500", headers=h)).status_code == 422
    assert (await client.get("/api/documents?status=Bogus", headers=h)).status_code == 422


async def test_folders_counts(client, as_role):
    h = await as_role("member")
    body = (await client.get("/api/documents/folders", headers=h)).json()
    counts = {f["templateType"]: f["count"] for f in body["folders"]}
    assert body["total"] == 4 and counts["Event Proposal"] == 1 and counts["Budget Estimate"] == 1


# ---------- create ----------

async def test_create_requires_official_fields_and_never_guesses(client, as_role):
    h = await as_role("member")
    bad = copy.deepcopy(FULL_PROPOSAL)
    del bad["fields"]["studentHeadName"]
    bad["fields"]["budgetTotal"] = ""
    r = await client.post("/api/documents", json=bad, headers=h)
    assert r.status_code == 422
    err = r.json()["error"]
    assert err["code"] == "missing_required_fields" and set(err["fields"]) == {"studentHeadName", "budgetTotal"}
    assert (await client.get("/api/documents", headers=h)).json()["total"] == 4  # nothing saved


async def test_create_ok_mirrors_summary_and_starts_at_version_one(client, as_role):
    h = await as_role("member")
    r = await client.post("/api/documents", json=FULL_PROPOSAL, headers=h)
    assert r.status_code == 201
    doc = r.json()
    assert doc["status"] == "Draft" and doc["currentVersion"] == 1 and doc["templateType"] == "Event Proposal"
    assert doc["venue"] == "Lab 3" and doc["eventDate"] == "20 November 2026" and doc["expectedAttendance"] == "80"
    assert doc["budgetTotal"] == "10000"
    assert doc["fields"]["studentHeadName"]  # taken from the template example in the fixture
    tpl = (await client.get("/api/templates/by-type/Event Proposal", headers=h)).json()
    assert doc["templateId"] == tpl["id"] and doc["templateId"] != "event-proposal"  # stored as the template id
    versions = (await client.get(f"/api/documents/{doc['id']}/versions", headers=h)).json()["items"]
    assert [v["version"] for v in versions] == [1] and versions[0]["source"] == "generated"


async def test_create_unknown_template_and_role_gate(client, as_role):
    h = await as_role("member")
    bad = {**FULL_PROPOSAL, "templateId": "nope"}
    assert (await client.post("/api/documents", json=bad, headers=h)).status_code == 422
    fh = await as_role("faculty")
    assert (await client.post("/api/documents", json=FULL_PROPOSAL, headers=fh)).status_code == 403


async def test_create_sanitizes_content(client, as_role):
    h = await as_role("member")
    evil = {**FULL_PROPOSAL, "content": '<p onclick="x()">hi</p><script>alert(1)</script><span data-ai="draft">ai</span>'}
    doc = (await client.post("/api/documents", json=evil, headers=h)).json()
    assert "script" not in doc["content"] and "onclick" not in doc["content"]
    assert doc["hasAiDraft"] is True and doc["hasUnacceptedAiText"] is True


# ---------- editor: draft, save, conflict, versions ----------

async def _new_doc(client, h):
    return (await client.post("/api/documents", json=FULL_PROPOSAL, headers=h)).json()


async def test_autosave_then_save_creates_versions(client, as_role):
    h = await as_role("member")
    doc = await _new_doc(client, h)
    did = doc["id"]

    d = await client.put(f"/api/documents/{did}/draft", json={"content": "<p>draft text</p>", "baseVersion": 1}, headers=h)
    assert d.status_code == 200
    got = (await client.get(f"/api/documents/{did}", headers=h)).json()
    assert got["content"] == "<p>draft text</p>" and got["hasUnsavedDraft"] is True and got["currentVersion"] == 1
    assert len((await client.get(f"/api/documents/{did}/versions", headers=h)).json()["items"]) == 1  # autosave makes no version

    s = await client.put(f"/api/documents/{did}/content", json={"content": "<p>v2</p>", "baseVersion": 1, "note": "edited"}, headers=h)
    assert s.status_code == 200
    saved = s.json()
    assert saved["currentVersion"] == 2 and saved["hasUnsavedDraft"] is False and saved["content"] == "<p>v2</p>"
    assert saved["fields"]["venue"] == "Lab 3"  # fields carried over when omitted

    versions = (await client.get(f"/api/documents/{did}/versions", headers=h)).json()["items"]
    assert [v["version"] for v in versions] == [2, 1] and versions[0]["note"] == "edited"
    v1 = (await client.get(f"/api/documents/{did}/versions/1", headers=h)).json()
    assert "AI Workshop" in v1["content"]
    assert (await client.get(f"/api/documents/{did}/versions/9", headers=h)).status_code == 404


async def test_stale_base_version_conflicts(client, as_role):
    h = await as_role("member")
    did = (await _new_doc(client, h))["id"]
    await client.put(f"/api/documents/{did}/content", json={"content": "<p>v2</p>", "baseVersion": 1}, headers=h)
    stale = await client.put(f"/api/documents/{did}/content", json={"content": "<p>mine</p>", "baseVersion": 1}, headers=h)
    assert stale.status_code == 409
    err = stale.json()["error"]
    assert err["code"] == "version_conflict" and err["currentVersion"] == 2
    stale_draft = await client.put(f"/api/documents/{did}/draft", json={"content": "<p>x</p>", "baseVersion": 1}, headers=h)
    assert stale_draft.status_code == 409


async def test_saving_new_fields_updates_summary_columns(client, as_role):
    h = await as_role("member")
    did = (await _new_doc(client, h))["id"]
    fields = {**FULL_PROPOSAL["fields"], "venue": "Auditorium"}
    r = await client.put(f"/api/documents/{did}/content", json={"content": "<p>x</p>", "fields": fields, "baseVersion": 1}, headers=h)
    assert r.json()["venue"] == "Auditorium"


async def test_restore_makes_a_new_version(client, as_role):
    h = await as_role("member")
    did = (await _new_doc(client, h))["id"]
    await client.put(f"/api/documents/{did}/content", json={"content": "<p>v2</p>", "baseVersion": 1}, headers=h)
    await client.put(f"/api/documents/{did}/draft", json={"content": "<p>unsaved</p>", "baseVersion": 2}, headers=h)
    r = await client.post(f"/api/documents/{did}/versions/1/restore", headers=h)
    doc = r.json()
    assert r.status_code == 200 and doc["currentVersion"] == 3 and "AI Workshop" in doc["content"]
    assert doc["hasUnsavedDraft"] is False
    versions = (await client.get(f"/api/documents/{did}/versions", headers=h)).json()["items"]
    assert versions[0]["source"] == "restore" and versions[0]["note"] == "Restored from version 1"


# ---------- status, roles, delete, duplicate ----------

async def test_status_workflow_and_roles(client, as_role):
    member, coord, faculty = await as_role("member"), await as_role("coordinator"), await as_role("faculty")
    did = (await _new_doc(client, member))["id"]
    url = f"/api/documents/{did}"

    assert (await client.patch(url, json={"status": "Completed"}, headers=member)).status_code == 409  # Draft -> Completed invalid
    assert (await client.patch(url, json={"status": "Needs Review"}, headers=member)).json()["status"] == "Needs Review"
    assert (await client.patch(url, json={"status": "Completed"}, headers=member)).status_code == 403  # members cannot complete
    assert (await client.patch(url, json={"status": "Completed"}, headers=faculty)).json()["status"] == "Completed"

    # Completed is read-only
    locked = await client.put(f"{url}/content", json={"content": "<p>x</p>", "baseVersion": 1}, headers=coord)
    assert locked.status_code == 409 and locked.json()["error"]["code"] == "document_locked"
    assert (await client.patch(url, json={"title": "New"}, headers=coord)).status_code == 409
    assert (await client.patch(url, json={"status": "Draft"}, headers=member)).status_code == 403  # members cannot reopen
    assert (await client.patch(url, json={"status": "Draft"}, headers=faculty)).status_code == 403
    assert (await client.patch(url, json={"status": "Draft"}, headers=coord)).json()["status"] == "Draft"

    ok = await client.patch(url, json={"title": "Renamed", "summary": "New summary"}, headers=coord)
    assert ok.json()["title"] == "Renamed" and ok.json()["summary"] == "New summary"
    assert (await client.patch(url, json={"title": None}, headers=coord)).status_code == 422
    assert (await client.patch(url, json={"bogus": 1}, headers=coord)).status_code == 422


async def test_members_only_edit_their_own_and_faculty_never(client, as_role, db):
    member, coord, faculty = await as_role("member"), await as_role("coordinator"), await as_role("faculty")
    did = (await _new_doc(client, coord))["id"]  # owned by the coordinator
    assert (await client.patch(f"/api/documents/{did}", json={"title": "x"}, headers=member)).status_code == 403
    assert (await client.put(f"/api/documents/{did}/content", json={"content": "<p>x</p>", "baseVersion": 1}, headers=member)).status_code == 403
    assert (await client.put(f"/api/documents/{did}/content", json={"content": "<p>x</p>", "baseVersion": 1}, headers=faculty)).status_code == 403
    assert (await client.get(f"/api/documents/{did}", headers=faculty)).status_code == 200  # but everyone can view


async def test_delete_rules_and_soft_delete(client, as_role, db):
    member, coord = await as_role("member"), await as_role("coordinator")
    faculty, admin = await as_role("faculty"), await as_role("admin")
    own = (await _new_doc(client, member))["id"]
    assert (await client.delete(f"/api/documents/{own}", headers=faculty)).status_code == 403
    assert (await client.delete(f"/api/documents/{own}", headers=member)).status_code == 204
    assert (await client.get(f"/api/documents/{own}", headers=member)).status_code == 404
    assert (await client.get("/api/documents", headers=member)).json()["total"] == 4
    assert await db.documents.count_documents({"deletedAt": {"$ne": None}}) == 1  # soft delete: record still there

    completed = (await client.get("/api/documents?status=Completed", headers=member)).json()["items"][0]["id"]
    assert (await client.delete(f"/api/documents/{completed}", headers=member)).status_code == 403
    assert (await client.delete(f"/api/documents/{completed}", headers=coord)).status_code == 403
    assert (await client.delete(f"/api/documents/{completed}", headers=admin)).status_code == 204


async def test_duplicate_copies_latest_saved_version_as_draft(client, as_role):
    member, coord = await as_role("member"), await as_role("coordinator")
    did = (await _new_doc(client, member))["id"]
    await client.put(f"/api/documents/{did}/content", json={"content": "<p>v2 text</p>", "baseVersion": 1}, headers=member)
    r = await client.post(f"/api/documents/{did}/duplicate", headers=coord)
    copy_ = r.json()
    assert r.status_code == 201 and copy_["id"] != did
    assert copy_["title"].startswith("Copy of ") and copy_["status"] == "Draft" and copy_["currentVersion"] == 1
    assert copy_["content"] == "<p>v2 text</p>" and copy_["ownerId"] != (await client.get(f"/api/documents/{did}", headers=member)).json()["ownerId"]


# ---------- isolation & misc ----------

async def test_other_clubs_cannot_see_documents(client, as_role, db):
    from app.security import hash_password
    from bson import ObjectId

    other_club = str((await db.clubs.insert_one({"name": "Other Club"})).inserted_id)
    await db.users.insert_one({"name": "Eve", "email": "eve@other.org", "role": "Club Admin",
                               "passwordHash": hash_password("longenough1"), "clubId": other_club})
    tok = (await client.post("/api/auth/login", json={"email": "eve@other.org", "password": "longenough1"})).json()["token"]
    eve = {"Authorization": f"Bearer {tok}"}
    member = await as_role("member")
    did = (await _new_doc(client, member))["id"]
    assert (await client.get("/api/documents", headers=eve)).json()["total"] == 0
    assert (await client.get(f"/api/documents/{did}", headers=eve)).status_code == 404
    assert (await client.delete(f"/api/documents/{did}", headers=eve)).status_code == 404
    assert (await client.get("/api/documents/not-an-id", headers=member)).status_code == 404
    assert (await client.get(f"/api/documents/{ObjectId()}", headers=member)).status_code == 404


async def test_club_branding_endpoint(client, as_role):
    h = await as_role("member")
    club = (await client.get("/api/club", headers=h)).json()
    assert club["name"].startswith("ACM") and club["signatories"] == []


async def test_export_blocks_unaccepted_ai_text_and_rejects_bad_format(client, as_role):
    h = await as_role("member")
    ok = await _new_doc(client, h)
    r = await client.get(f"/api/documents/{ok['id']}/export?format=pdf", headers=h)
    # Real export since the stub was replaced: a PDF when WeasyPrint is installed, otherwise a clear 501.
    assert (r.status_code == 200 and r.content.startswith(b"%PDF")) or (
        r.status_code == 501 and r.json()["error"]["code"] == "not_implemented")
    ai = {**FULL_PROPOSAL, "content": '<p><span data-ai="draft">AI text</span></p>'}
    doc = (await client.post("/api/documents", json=ai, headers=h)).json()
    r = await client.get(f"/api/documents/{doc['id']}/export?format=docx", headers=h)
    assert r.status_code == 409 and r.json()["error"]["code"] == "unaccepted_ai_text"
    assert (await client.get(f"/api/documents/{ok['id']}/export?format=txt", headers=h)).status_code == 422
