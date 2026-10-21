"""Find out exactly why the AI is not working. Reads the SAME settings the server uses (backend/.env).

    cd backend
    python -m scripts.check_ai
"""
import asyncio
import sys

from app.config import get_settings
from app.modules.generator import make_llm
from app.modules.generator.llm import GeminiLLM, LLMError


def mask(k: str) -> str:
    return f"{k[:4]}…({len(k)} characters)" if k else "NOT SET"


async def main() -> int:
    s = get_settings()
    print("provider setting :", s.gendoc_llm_provider or "(auto)")
    print("model setting    :", s.gendoc_llm_model or "(provider default)")
    print("GEMINI_API_KEY   :", mask(s.gemini_api_key))
    try:
        import google.genai  # noqa: F401
        print("google-genai SDK : installed")
    except ImportError:
        print("google-genai SDK : MISSING -> run: pip install google-genai")
        return 1
    try:
        llm = make_llm(s.gendoc_llm_provider, gemini_key=s.gemini_api_key, anthropic_key=s.anthropic_api_key,
                       model=s.gendoc_llm_model or None)
    except LLMError as e:
        print("\nPROBLEM:", e)
        print("Put GEMINI_API_KEY=... in backend/.env (no quotes, no spaces) and run this again.")
        return 1
    print("using model      :", getattr(llm, "model", "?"))
    try:
        out = await llm.complete_json("Reply with JSON only.", 'Return exactly {"ok": true}', max_tokens=50)
        print("\nOK: the AI answered:", out, "| model now:", getattr(llm, "model", "?"))
        return 0
    except LLMError as e:
        print("\nPROBLEM:", e)
        if isinstance(llm, GeminiLLM):
            try:
                print("Models your key can use:", ", ".join(await llm.list_models()) or "(none)")
            except Exception as e2:  # noqa: BLE001
                print("(could not list models:", type(e2).__name__, ")")
        return 1


sys.exit(asyncio.run(main()))
