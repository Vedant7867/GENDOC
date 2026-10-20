"""Gemini provider (SDK faked, no network), Copilot guards, provider selection and real PDF/DOCX export."""
import io
import shutil
import types
import zipfile

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app
from app.modules.generator import llm as llmmod
from tests.conftest import login


class FakeLLM:
    def __init__(self, *answers):
        self.answers, self.calls = list(answers), []

    async def complete_json(self, system, user, *, max_tokens=2000):
        self.calls.append((system, user))
        a = self.answers.pop(0)
        if isinstance(a, Exception):
            raise a
        return a


# ---------------------------------------------------------------- provider selection / Gemini (SDK faked)
def test_make_llm_selection_and_missing_key(monkeypatch):
    for k in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "ANTHROPIC_API_KEY", "GENDOC_LLM_PROVIDER"):
        monkeypatch.delenv(k, raising=False)
    with pytest.raises(llmmod.LLMNotConfigured) as e:
        llmmod.make_llm()
    assert "GEMINI_API_KEY" in str(e.value)
    g = llmmod.make_llm(gemini_key="k-123", model="m-x")
    assert isinstance(g, llmmod.GeminiLLM) and g.model == "m-x"
    assert isinstance(llmmod.make_llm("gemini", gemini_key="k"), llmmod.GeminiLLM)  # no Claude key needed
    with pytest.raises(llmmod.LLMNotConfigured):
        llmmod.make_llm("openai", gemini_key="k")


def _gemini(monkeypatch, behaviour):
    llm = llmmod.GeminiLLM(api_key="SECRET-KEY", model="gem-test")

    async def fake(model, contents, config):
        llm.seen = {"model": model, "contents": contents, "config": config}
        return behaviour()

    llm.client = types.SimpleNamespace(aio=types.SimpleNamespace(models=types.SimpleNamespace(generate_content=fake)))
    return llm


async def test_gemini_requests_json_with_configured_model_and_parses(monkeypatch):
    llm = _gemini(monkeypatch, lambda: types.SimpleNamespace(text='Sure ```json\n{"values": {"a": 1}}\n```'))
    out = await llm.complete_json("SYS", "USER")
    assert out == {"values": {"a": 1}}
    cfg = llm.seen["config"]
    assert llm.seen["model"] == "gem-test" and llm.seen["contents"] == "USER"
    assert cfg.response_mime_type == "application/json" and cfg.system_instruction == "SYS" and cfg.temperature == 0


@pytest.mark.parametrize("code,exc", [(401, llmmod.LLMAuthError), (403, llmmod.LLMAuthError), (429, llmmod.LLMRateLimited),
                                       (404, llmmod.LLMModelUnavailable), (503, llmmod.LLMError)])
async def test_gemini_maps_provider_errors_without_leaking_the_key(monkeypatch, code, exc):
    from google.genai import errors

    def boom():
        raise errors.ClientError(code, {"error": {"code": code, "message": "bad SECRET-KEY thing", "status": "X"}})

    llm = _gemini(monkeypatch, boom)
    with pytest.raises(exc) as e:
        await llm.complete_json("s", "u")
    assert "SECRET-KEY" not in str(e.value)


@pytest.mark.parametrize("text", [None, "", "no json here", "{broken"])
async def test_gemini_bad_output_is_a_clean_error(monkeypatch, text):
    llm = _gemini(monkeypatch, lambda: types.SimpleNamespace(text=text))
    with pytest.raises(llmmod.LLMBadOutput):
        await llm.complete_json("s", "u")


async def test_network_failure_is_clean(monkeypatch):
    def boom():
        raise ConnectionError("dns failure for SECRET-KEY")

    llm = _gemini(monkeypatch, boom)
    with pytest.raises(llmmod.LLMError) as e:
        await llm.complete_json("s", "u")
    assert "SECRET-KEY" not in str(e.value)


# ---------------------------------------------------------------- AI endpoints degrade, non-AI keeps working
async def test_without_a_key_ai_endpoints_say_so_and_generate_still_works(db, monkeypatch):
    for k in ("GEMINI_API_KEY", "GOOGLE_API_KEY", "ANTHROPIC_API_KEY", "GENDOC_LLM_PROVIDER"):
        monkeypatch.delenv(k, raising=False)
    app = create_app(db=db)  # no llm injected, no key configured
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        h = await login(c, "member")
        t = (await c.get("/api/templates", headers=h)).json()["items"][0]["id"]
        r = await c.post("/api/generator/extract", json={"templateIds": [t], "text": "hello"}, headers=h)
        assert r.status_code == 503 and r.json()["error"]["code"] == "llm_unavailable"
        assert "GEMINI_API_KEY" in r.json()["error"]["message"]
        assert (await c.post("/api/generator/copilot", headers=h, json={
            "instruction": "fix", "blocks": [{"id": 0, "type": "paragraph", "text": "x"}]})).status_code == 503
        # non-AI: validation errors still come from /generate, templates and documents still list
        g = await c.post("/api/generator/generate", json={"templateId": t, "values": {}}, headers=h)
        assert g.status_code == 422 and g.json()["error"]["code"] == "missing_required_fields"
        assert (await c.get("/api/documents", headers=h)).status_code == 200


@pytest.mark.parametrize("exc,status,code", [(llmmod.LLMRateLimited("slow"), 429, "llm_rate_limited"),
                                              (llmmod.LLMAuthError("bad key"), 503, "llm_unavailable"),
                                              (llmmod.LLMModelUnavailable("gone"), 502, "llm_model_unavailable"),
                                              (llmmod.LLMBadOutput("junk"), 502, "llm_error")])
async def test_provider_failures_map_to_clear_api_errors(db, exc, status, code):
    app = create_app(db=db, llm=FakeLLM(exc))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        h = await login(c, "member")
        r = await c.post("/api/generator/freeform", json={"prompt": "any form"}, headers=h)
    assert r.status_code == status and r.json()["error"]["code"] == code


# ---------------------------------------------------------------- Copilot
BLOCKS = [{"id": 0, "type": "heading", "text": "Workshop Proposal"},
          {"id": 1, "type": "paragraph", "text": "We will hold the workshop at Seminar Hall for 120 students.",
           "protected": ["Seminar Hall", "120"]},
          {"id": 2, "type": "table", "text": "Banner 800"}]


async def copilot(db, llm_answer, **body):
    app = create_app(db=db, llm=FakeLLM(llm_answer))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        h = await login(c, "member")
        r = await c.post("/api/generator/copilot", headers=h, json={"instruction": "make it formal", "blocks": BLOCKS, **body})
    assert r.status_code == 200, r.text
    return r.json()


async def test_copilot_returns_clean_proposals_and_rejects_unsafe_ones(db):
    out = await copilot(db, {"message": "Done", "proposals": [
        {"action": "replace", "blockId": 1, "html": '<p data-field="venue">We shall conduct the workshop at Seminar Hall for 120 students.</p><script>x()</script>', "reason": "formal"},
        {"action": "replace", "blockId": 1, "html": "<p>We will hold it at the hall for 120 students.</p>", "reason": "drops venue"},
        {"action": "replace", "blockId": 1, "html": "<p>Seminar Hall, 120 students and 5000 rupees.</p>", "reason": "new figure"},
        {"action": "replace", "blockId": 2, "html": "<p>x</p>", "reason": "table"},
        {"action": "replace", "blockId": 99, "html": "<p>x</p>"},
        {"action": "insert_after", "blockId": 1, "html": "<h2>Conclusion</h2><p>We thank everyone.</p>", "reason": "add"}]})
    ids = [(p["action"], p["blockId"]) for p in out["proposals"]]
    assert ids == [("replace", 1), ("insert_after", 1)]
    first = out["proposals"][0]["html"]
    assert "script" not in first and "data-field" not in first and "Seminar Hall" in first
    assert len(out["rejected"]) == 4 and any("figures" in r["reason"] for r in out["rejected"])
    assert any("table" in r["reason"] for r in out["rejected"])


async def test_copilot_selection_and_chat_only_answers(db):
    out = await copilot(db, {"message": "ok", "proposals": [{"action": "replace_selection", "blockId": 1,
                           "html": "<p>shall <strong>conduct</strong></p>", "reason": "formal"}]},
                        selection={"blockId": 1, "text": "will hold"})
    assert out["proposals"][0]["action"] == "replace_selection" and out["proposals"][0]["html"] == "shall <strong>conduct</strong>"
    out = await copilot(db, {"message": "Dates look consistent.", "proposals": []})
    assert out["message"] == "Dates look consistent." and out["proposals"] == []


async def test_copilot_is_not_available_to_faculty_advisors(db):
    app = create_app(db=db, llm=FakeLLM())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        h = await login(c, "faculty")
        r = await c.post("/api/generator/copilot", headers=h, json={"instruction": "fix", "blocks": BLOCKS})
    assert r.status_code == 403


# ---------------------------------------------------------------- export
async def make_doc(c, h, content):
    items = (await c.get("/api/templates", headers=h)).json()["items"]
    t = next(i["id"] for i in items if i["key"] == "attendance-sheet")  # needs only title, date and venue
    r = await c.post("/api/documents", headers=h, json={"title": "Export Test", "templateId": t, "content": content,
                     "fields": {"eventTitle": "Test", "eventDate": "1 Jan", "venue": "Hall"}})
    assert r.status_code == 201, r.text
    return r.json()["id"]


@pytest.mark.skipif(not shutil.which("pandoc"), reason="pandoc not installed")
async def test_docx_export_contains_the_saved_text(db):
    app = create_app(db=db)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        h = await login(c, "member")
        did = await make_doc(c, h, "<h1>Export Test</h1><p>Hello <strong>club</strong> world</p><table><tbody><tr><td>A1</td><td>B1</td></tr></tbody></table>")
        r = await c.get(f"/api/documents/{did}/export?format=docx", headers=h)
    assert r.status_code == 200 and "Export_Test.docx" in r.headers["content-disposition"]
    xml = zipfile.ZipFile(io.BytesIO(r.content)).read("word/document.xml").decode()
    assert "Hello" in xml and "club" in xml and "A1" in xml and "<w:tbl>" in xml


async def test_pdf_export_and_ai_draft_block(db):
    pytest.importorskip("weasyprint")
    app = create_app(db=db)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://t") as c:
        h = await login(c, "member")
        did = await make_doc(c, h, "<h1>Export Test</h1><p>Body text</p>")
        r = await c.get(f"/api/documents/{did}/export?format=pdf", headers=h)
        assert r.status_code == 200 and r.content.startswith(b"%PDF") and r.headers["content-type"] == "application/pdf"
        did2 = await make_doc(c, h, '<p><span data-ai="draft">AI text</span></p>')
        blocked = await c.get(f"/api/documents/{did2}/export?format=pdf", headers=h)
    assert blocked.status_code == 409 and blocked.json()["error"]["code"] == "unaccepted_ai_text"
