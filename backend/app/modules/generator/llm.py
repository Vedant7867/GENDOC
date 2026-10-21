"""AI providers behind one tiny interface (`complete_json`), so business logic never knows which one runs.

Providers: Gemini (`GeminiLLM`, default when a Gemini key is set) and Claude (`AnthropicLLM`, optional).
Tests inject a fake object with the same method. Keys are read on the server only and never put in messages.
"""
from __future__ import annotations

import json
import os
import re
from typing import Protocol


class LLM(Protocol):
    async def complete_json(self, system: str, user: str, *, max_tokens: int = 2000) -> dict: ...


class LLMError(Exception):
    """Generic AI failure (network, 5xx, bad output). Message is safe to show to users."""


class LLMNotConfigured(LLMError):
    """No usable key/provider: AI endpoints answer 503 llm_unavailable, everything else keeps working."""


class LLMAuthError(LLMNotConfigured):
    """The provider rejected the key."""


class LLMRateLimited(LLMError):
    pass


class LLMModelUnavailable(LLMError):
    pass


class LLMBadOutput(LLMError):
    pass


def parse_json(text: str) -> dict:
    """Tolerates code fences and chatter around the JSON object."""
    text = re.sub(r"^```(?:json)?|```$", "", (text or "").strip(), flags=re.M).strip()
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise LLMBadOutput("The AI did not return a usable answer. Please try again.")
    try:
        obj = json.loads(text[start:end + 1])
    except json.JSONDecodeError as e:
        raise LLMBadOutput("The AI returned malformed output. Please try again.") from e
    if not isinstance(obj, dict):
        raise LLMBadOutput("The AI returned an unexpected shape. Please try again.")
    return obj


def _scrub(message: str, *secrets: str | None) -> str:
    for s in secrets:
        if s:
            message = message.replace(s, "***")
    return message[:300]


class GeminiLLM:
    """Google Gemini through the official `google-genai` SDK (`pip install google-genai`).

    Config (server-side only): GEMINI_API_KEY (or GOOGLE_API_KEY), GENDOC_LLM_MODEL.
    JSON mode is requested with response_mime_type; output is still validated by the callers.
    """

    DEFAULT_MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise LLMNotConfigured("AI is not configured. Set GEMINI_API_KEY on the server to enable it.")
        try:
            from google import genai
        except ImportError as e:
            raise LLMNotConfigured("The Gemini SDK is not installed on the server (pip install google-genai).") from e
        self.client = genai.Client(api_key=self.api_key)
        self.model = model or os.getenv("GENDOC_LLM_MODEL") or self.DEFAULT_MODEL

    async def list_models(self) -> list[str]:
        """Models this key can call for text generation (names without the 'models/' prefix)."""
        out: list[str] = []
        pager = await self.client.aio.models.list()
        async for m in pager:
            if "generateContent" in (getattr(m, "supported_actions", None) or []):
                out.append((m.name or "").removeprefix("models/"))
        return out

    @staticmethod
    def _best(models: list[str]) -> str | None:
        """Prefer a current general-purpose Flash model, then any Flash, then anything."""
        plain = [m for m in models if "flash" in m and not any(x in m for x in ("lite", "image", "tts", "live", "audio", "thinking"))]
        for pool in (sorted((m for m in plain if "preview" not in m and "exp" not in m), reverse=True),
                     sorted(plain, reverse=True), sorted(models, reverse=True)):
            if pool:
                return pool[0]
        return None

    async def _generate(self, system: str, user: str, max_out: int):
        from google.genai import types

        config = types.GenerateContentConfig(system_instruction=system, response_mime_type="application/json",
                                             temperature=0, max_output_tokens=max_out)
        return await self.client.aio.models.generate_content(model=self.model, contents=user, config=config)

    def _map(self, e: Exception) -> LLMError:
        code = getattr(e, "code", None)
        msg = _scrub(str(getattr(e, "message", "") or e), self.api_key)
        if code in (401, 403) or (code == 400 and "api key" in msg.lower()):
            return LLMAuthError("The Gemini API key was rejected. Check GEMINI_API_KEY on the server.")
        if code == 429:
            return LLMRateLimited("The AI service is rate limited right now (free keys have low limits). Wait a minute and try again.")
        if code == 404:
            return LLMModelUnavailable(f"The Gemini model '{self.model}' is not available for this key. Set GENDOC_LLM_MODEL to a supported model.")
        if code and code >= 500:
            return LLMError("The Gemini service is temporarily unavailable. Please try again.")
        return LLMError(f"The Gemini request failed ({code}): {msg}")

    async def complete_json(self, system: str, user: str, *, max_tokens: int = 2000) -> dict:
        from google.genai import errors

        max_out = max_tokens * 2 + 1024  # headroom: reasoning models count thinking tokens too
        switched = False
        for attempt in range(3):
            try:
                resp = await self._generate(system, user, max_out)
            except errors.APIError as e:
                mapped = self._map(e)
                if isinstance(mapped, LLMModelUnavailable) and not switched:
                    # The default model may have been retired or renamed: ask the API what this key can use.
                    switched = True
                    try:
                        found = self._best(await self.list_models())
                    except Exception:
                        found = None
                    if found and found != self.model:
                        self.model = found
                        continue
                raise mapped from None
            except Exception as e:  # network, timeout, SDK internals
                raise LLMError(f"Could not reach the Gemini service ({type(e).__name__}).") from None
            text = getattr(resp, "text", None)
            if text:
                return parse_json(text)
            reason = str(getattr((getattr(resp, "candidates", None) or [None])[0], "finish_reason", "") or "")
            if "MAX_TOKENS" in reason and attempt < 2:
                max_out *= 3  # the answer was cut off (thinking used the budget): retry with more room
                continue
            raise LLMBadOutput("Gemini returned no text (the request may have been blocked). Try rephrasing.")
        raise LLMBadOutput("Gemini did not return a usable answer. Please try again.")


class AnthropicLLM:
    """Optional Claude provider (`pip install anthropic`, ANTHROPIC_API_KEY)."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise LLMNotConfigured("AI is not configured. Set ANTHROPIC_API_KEY on the server to enable it.")
        try:
            from anthropic import AsyncAnthropic
        except ImportError as e:
            raise LLMNotConfigured("The Anthropic SDK is not installed on the server (pip install anthropic).") from e
        self.client = AsyncAnthropic(api_key=self.api_key)
        self.model = model or os.getenv("GENDOC_LLM_MODEL") or "claude-sonnet-5-5"

    async def complete_json(self, system: str, user: str, *, max_tokens: int = 2000) -> dict:
        import anthropic

        try:
            msg = await self.client.messages.create(
                model=self.model, max_tokens=max_tokens, temperature=0,
                system=system, messages=[{"role": "user", "content": user}])
        except anthropic.AuthenticationError:
            raise LLMAuthError("The Anthropic API key was rejected. Check ANTHROPIC_API_KEY on the server.") from None
        except anthropic.RateLimitError:
            raise LLMRateLimited("The AI service is rate limited right now. Wait a moment and try again.") from None
        except anthropic.NotFoundError:
            raise LLMModelUnavailable(f"The model '{self.model}' is not available.") from None
        except Exception as e:
            raise LLMError(f"The AI request failed ({type(e).__name__}).") from None
        text = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        return parse_json(text)


def make_llm(provider: str | None = None, *, gemini_key: str | None = None, anthropic_key: str | None = None,
             model: str | None = None) -> LLM:
    """Pick the provider: explicit `provider` (gemini|anthropic) wins; otherwise whichever key is present,
    Gemini first. Raises LLMNotConfigured with an actionable message when nothing is set up."""
    provider = (provider or os.getenv("GENDOC_LLM_PROVIDER") or "").strip().lower()
    g = gemini_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    a = anthropic_key or os.getenv("ANTHROPIC_API_KEY")
    if provider == "gemini" or (not provider and g):
        return GeminiLLM(api_key=g, model=model)
    if provider == "anthropic" or (not provider and a):
        return AnthropicLLM(api_key=a, model=model)
    if provider:
        raise LLMNotConfigured(f"Unknown AI provider '{provider}'. Use GENDOC_LLM_PROVIDER=gemini or anthropic.")
    raise LLMNotConfigured("AI is not configured. Set GEMINI_API_KEY (and GENDOC_LLM_PROVIDER=gemini) on the server.")
