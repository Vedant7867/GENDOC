from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .errors import install_error_handlers
from .deps import get_current_user
from .modules import generator as generator_module
from .modules import templates as templates_module
from .routers import auth, club, documents


async def ensure_indexes(db) -> None:
    await db.users.create_index("email", unique=True)
    await db.documents.create_index([("clubId", 1), ("updatedAt", -1)])
    await db.documents.create_index([("clubId", 1), ("templateType", 1)])
    await db.document_versions.create_index([("documentId", 1), ("version", 1)], unique=True)
    await templates_module.ensure_indexes(db)


def create_app(db=None, llm=None) -> FastAPI:
    """Pass a database (and optionally a fake LLM) in tests; in normal runs a Motor client is created at startup."""
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        client = None
        if db is not None:
            app.state.db = db
        else:
            from motor.motor_asyncio import AsyncIOMotorClient

            client = AsyncIOMotorClient(settings.mongo_uri, tz_aware=True)
            app.state.db = client[settings.db_name]
        await ensure_indexes(app.state.db)
        yield
        if client is not None:
            client.close()

    app = FastAPI(title="GENDOC API", version="0.1.0", lifespan=lifespan)
    if db is not None:  # tests drive the app without running lifespan
        app.state.db = db
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    install_error_handlers(app)

    @app.get("/api/health", tags=["meta"])
    async def health():
        return {"status": "ok"}

    for r in (auth.router, club.router, documents.router):
        app.include_router(r, prefix="/api")

    # Templates module (its own router, service and seed catalog). It receives the app's database and
    # token dependency instead of importing them. get_db is a no-argument callable, so it reads app.state.
    templates_module.install(app, get_db=lambda: app.state.db, get_current_user=get_current_user)

    # Generator module (natural language -> values -> document HTML). Same injected db and token dependency.
    # The AI client is created on first use, so the API starts fine without any AI key (Gemini by default).
    generator_module.install(
        app, get_db=lambda: app.state.db, get_current_user=get_current_user, llm=llm,
        llm_factory=lambda: generator_module.make_llm(
            settings.gendoc_llm_provider, gemini_key=settings.gemini_api_key,
            anthropic_key=settings.anthropic_api_key, model=settings.gendoc_llm_model or None),
    )
    return app


app = create_app()
