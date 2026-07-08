"""
Signal-Main — FastAPI Application Entry Point

Phase 3: Database connectivity added.
- PostgreSQL connected via SQLAlchemy on startup.
- All Phase 2 endpoints preserved.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.database import check_db_connection, engine, Base
from app.routers import health, signals, collect, automation, copilot, demo, dashboard
from app.routers import live_ingest
import app.models  # Ensure models are imported for create_all


# ---------------------------------------------------------------------------
# Lifespan — runs once on startup and once on shutdown
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    print("[Signal-Main] Starting up...")
    if check_db_connection():
        print("[Signal-Main] ✅ Connected to PostgreSQL")
        # Create all tables
        print("[Signal-Main] ⏳ Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("[Signal-Main] ✅ Database tables created")
    else:
        print("[Signal-Main] ❌ Database connection failed — check DATABASE_URL in .env")

    yield  # application runs here

    # --- Shutdown ---
    print("[Signal-Main] Shutting down.")


# ---------------------------------------------------------------------------
# App instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Signal-Main API",
    version="1.0.0",
    description=(
        "Signal-Main is a real-time signals harvesting and lead intelligence engine. "
        "It collects intent signals from the web, classifies them with AI, scores the "
        "resulting leads, and surfaces actionable intelligence to sales and growth teams."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS (open for local development; tighten in production)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(signals.router)
app.include_router(collect.router)
app.include_router(automation.router)
app.include_router(copilot.router)
app.include_router(demo.router)
app.include_router(dashboard.router)
app.include_router(live_ingest.router)

# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"], summary="Root")
async def root():
    """Confirms the backend is running."""
    return {"message": "Signal-Main Backend Running"}
