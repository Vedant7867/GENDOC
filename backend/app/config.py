from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_ENV = Path(__file__).resolve().parents[1] / ".env"


class Settings(BaseSettings):
    # backend/.env is found even when uvicorn is started from another folder (for example the repo root).
    model_config = SettingsConfigDict(env_file=(".env", str(_BACKEND_ENV)), extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "gendoc"
    jwt_secret: str = "dev-secret-change-me"
    jwt_expire_minutes: int = 720
    cors_origins: str = "http://localhost:5173"
    # Contract section 7: incomplete documents are rejected. Can be relaxed in dev.
    enforce_required_fields: bool = True
    # Contract section 5: new accounts are Club Members unless this is on (demo only).
    allow_role_self_select: bool = False
    # Contract section 4 limits.
    max_inline_image_bytes: int = 500_000
    max_content_chars: int = 2_000_000
    # AI (server-side only). Gemini is the default provider; leave everything empty to run without AI.
    gendoc_llm_provider: str = ""   # "gemini" | "anthropic" | "" (auto: whichever key is set, Gemini first)
    gendoc_llm_model: str = ""      # empty = the provider's default model
    gemini_api_key: str = ""
    anthropic_api_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
