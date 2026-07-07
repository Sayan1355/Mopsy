"""
Signal-Main — FastAPI Application Entry Point

Phase 2: Backend scaffolding only.
No database connections, no AI agents, no scraping.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health

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

# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"], summary="Root")
async def root():
    """Confirms the backend is running."""
    return {"message": "Signal-Main Backend Running"}
