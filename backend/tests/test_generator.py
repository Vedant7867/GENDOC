"""Integration tests: the generator mounted in the real app, with the real auth, club record and documents API.
A fake LLM replaces the AI provider, so no network or API key is needed."""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from mongomock_motor import AsyncMongoMockClient

from app.main import create_app, ensure_indexes
from app.modules.generator.extract import clean_values
from app.modules.generator.llm import parse_json
from tests.conftest import login

TEXT = ("Permission to hold Web Dev Workshop in Seminar Hall 402 on 14 Oct 2026, 6:00 PM to 7:30 PM, "
        "around 120 students. Student head Ansh Gupta, faculty chairman Dr. Sankita Patel.")


class FakeLLM:
    def __init__(self, *answers):
        self.answers, self.calls = list(answers), []

    async def complete_json(self, system, user, *, max_tokens=2000):
        self.calls.append((system, user))
        a = self.answers.pop(0)
        if isinstance(a, Exception):
            raise a
        return a


@pytest.fixture
def make_client(db):
    opened = []

    async def _make(*answers):
        llm = FakeLLM(*answers)
        c = AsyncClient(transport=ASGITransport(app=create_app(db=db, llm=llm)), base_url="http://test")
        opened.append(c)
        return c, llm

    yield _make


async def tpl_id(c, h, key):
    items = (await c.get("/api/templates", headers=h)).json()["items"]
    return next(i["id"] for i in items if i["key"] == key)


async def test_extract_keeps_grounded_values_prefills_club_and_lists_missing(make_client):
    c, llm = await make_client({"values": {
        "eventTitle": "Web Dev Workshop", "venue": "Seminar Hall 402", "eventDate": "14 Oct 2026",
        "eventTime": "6:00 PM to 7:30 PM", "expectedAttendance": "120", "studentHeadName": "Ansh Gupta",
        "facultyChairmanName": "Dr. Invented Person", "bogusKey": "x"}})
    async with c:
        h = await login(c, "member")
        t = await tpl_id(c, h, "permission-letter")
        r = (await c.post("/api/generator/extract", json={"templateIds": [t], "text": TEXT}, headers=h)).json()
    assert r["values"]["studentHeadName"] == "Ansh Gupta"
    assert "facultyChairmanName" not in r["values"] and "bogusKey" not in r["values"]  # invented / unknown dropped
    miss = {m["key"] for m in r["missing"][t]}
    assert {"facultyChairmanName", "refNo"} <= miss and "venue" not in miss


async def test_club_record_prefills_so_the_user_is_not_asked(make_client):
    c, _ = await make_client({"values": {}})
    async with c:
        h = await login(c, "member")
        t = await tpl_id(c, h, "event-notice")
        r = (await c.post("/api/generator/extract", json={"templateIds": [t], "text": "notice please"}, headers=h)).json()
    assert r["values"]["chapterName"] == "ACM NIT Surat Student Chapter"  # club.name prefill
    assert "chapterName" not in {m["key"] for m in r["missing"][t]}


async def test_generated_body_is_accepted_by_post_documents_unchanged(make_client):
    c, _ = await make_client()
    async with c:
        h = await login(c, "member")
        t = await tpl_id(c, h, "event-proposal")
        values = {"refNo": "ACM/1", "documentDate": "01/10/2026", "chapterCode": "6/52", "eventTitle": "AI Workshop",
                  "eventCategory": "Workshop", "eventDate": "20 Nov", "venue": "Lab 3", "summary": "A hands-on day.",
                  "objectives": "Learn.", "targetAudience": "All", "expectedAttendance": "80", "budgetTotal": "10000",
                  "expenseItems": [{"item": "Banner", "amount": "800"}],
                  **{k: "x" for k in ("studentHeadName", "studentHeadRollNo", "studentHeadBranch",
                                      "studentSecretaryName", "studentSecretaryRollNo", "studentSecretaryBranch",
                                      "facultyCoChairmanName", "facultyCoChairmanDesignation", "facultyCoChairmanDept",
                                      "facultyChairmanName", "facultyChairmanDesignation", "facultyChairmanDept")}}
        g = await c.post("/api/generator/generate", headers=h,
                         json={"templateId": t, "values": values, "aiKeys": ["summary", "budgetTotal"]})
        assert g.status_code == 200, g.text
        out = g.json()
        assert out["aiDraftFields"] == ["summary"] and out["requiresTemplateSave"] is False  # budget is official
        created = await c.post("/api/documents", json=out["document"], headers=h)  # no edits, no extra keys
        assert created.status_code == 201, created.text
        doc = created.json()
    assert doc["templateType"] == "Event Proposal" and doc["venue"] == "Lab 3" and doc["status"] == "Draft"
    html = doc["content"]
    assert '<tr data-field="expenseItems">' in html  # table rows survive the documents sanitizer
    assert '<span data-field="summary"><span data-ai="draft">A hands-on day.</span></span>' in html
    assert doc["hasUnacceptedAiText"] is True


async def test_incomplete_generation_uses_the_apps_missing_fields_shape(make_client):
    c, _ = await make_client()
    async with c:
        h = await login(c, "member")
        t = await tpl_id(c, h, "event-notice")
        r = await c.post("/api/generator/generate", json={"templateId": t, "values": {"eventTitle": "X"}}, headers=h)
    err = r.json()["error"]
    assert r.status_code == 422 and err["code"] == "missing_required_fields"
    assert "summary" in err["fields"] and "eventTitle" not in err["fields"]


async def test_faculty_advisor_cannot_use_the_generator(make_client):
    c, _ = await make_client()
    async with c:
        h = await login(c, "faculty")
        r = await c.post("/api/generator/generate", json={"templateId": "x", "values": {}}, headers=h)
    assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden"


async def test_draft_refuses_official_fields_and_rejects_invented_figures(make_client):
    c, _ = await make_client({"drafts": {"summary": "A workshop for 500 students.", "objectives": "To teach web basics."}})
    async with c:
        h = await login(c, "member")
        t = await tpl_id(c, h, "event-proposal")
        bad = await c.post("/api/generator/draft", json={"templateId": t, "values": {}, "keys": ["budgetTotal"]}, headers=h)
        r = (await c.post("/api/generator/draft", headers=h, json={
            "templateId": t, "values": {"expectedAttendance": "120"}, "keys": ["summary", "objectives"]})).json()
    assert bad.status_code == 422
    assert "summary" in r["rejected"] and r["drafts"] == {"objectives": "To teach web basics."}


async def test_freeform_designs_a_form_and_flags_that_it_needs_saving(make_client):
    spec = {"title": "Lab Access Form", "category": "Administration",
            "html": "<h1>Lab Access</h1><p>{{labName}} / {{facultyContact}}</p><script>x()</script>",
            "fields": [{"key": "labName", "label": "Lab", "required": True},
                       {"key": "facultyContact", "label": "Faculty contact", "required": True}]}
    c, _ = await make_client(spec, {"values": {"labName": "Networks Lab"}})
    async with c:
        h = await login(c, "member")
        r = (await c.post("/api/generator/freeform", json={"prompt": "lab access form"}, headers=h)).json()
        t = r["template"]
        assert "script" not in t["html"] and t["fields"][1]["official"] is True
        assert [m["key"] for m in r["missing"]] == ["facultyContact"]
        g = (await c.post("/api/generator/generate", headers=h, json={
            "template": t, "values": {"labName": "Networks Lab", "facultyContact": "Dr. P"}})).json()
        assert g["requiresTemplateSave"] is True and g["document"]["templateId"] is None
        # POST /documents still needs a stored template; this is the documented open decision
        assert (await c.post("/api/documents", json={**g["document"], "templateId": "unsaved"}, headers=h)).status_code == 422


async def test_ai_failure_is_a_clean_502(make_client):
    c, _ = await make_client(RuntimeError("network down"))
    async with c:
        h = await login(c, "member")
        t = await tpl_id(c, h, "event-notice")
        r = await c.post("/api/generator/extract", json={"templateIds": [t], "text": "x"}, headers=h)
    assert r.status_code == 502 and r.json()["error"]["code"] == "llm_error"


async def test_two_apps_in_one_process_do_not_share_a_database():
    """Regression: dependencies used to be module-level globals, so the last app created won."""
    from app.seed import seed

    dbs = []
    for n in ("a", "b"):
        d = AsyncMongoMockClient()[f"iso_{n}"]
        await ensure_indexes(d)
        await seed(d)
        dbs.append(d)
    app_a, app_b = create_app(db=dbs[0]), create_app(db=dbs[1])
    async with AsyncClient(transport=ASGITransport(app=app_a), base_url="http://a") as ca:
        h = await login(ca, "member")
        assert (await ca.get("/api/templates", headers=h)).status_code == 200  # app_b was created afterwards
    async with AsyncClient(transport=ASGITransport(app=app_b), base_url="http://b") as cb:
        h = await login(cb, "member")
        assert (await cb.get("/api/templates", headers=h)).status_code == 200


def test_helpers():
    assert parse_json('Sure!\n```json\n{"a": 1}\n```') == {"a": 1}
    f = [{"key": "amount", "type": "currency", "official": True, "label": "A"},
         {"key": "mode", "type": "select", "options": ["Offline", "Online"], "label": "M"}]
    assert clean_values({"amount": "5,000", "mode": "online"}, f, "prize of Rs 5000") == {"amount": "5,000", "mode": "Online"}
    assert clean_values({"amount": "9999"}, f, "prize of Rs 5000") == {}
