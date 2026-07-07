"""
Signal-Main — Database Layer

Responsibilities:
  - SQLAlchemy engine creation
  - SessionLocal factory
  - Base declarative class (all ORM models inherit from this)
  - get_db() dependency for FastAPI route injection
  - check_db_connection() called at application startup
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# pool_pre_ping=True: SQLAlchemy tests each connection before using it,
# automatically reconnecting if the server dropped it (e.g. after idle timeout).
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    echo=settings.app_debug,  # logs SQL in development; set app_debug=false in prod
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
# autocommit=False  → explicit transaction control
# autoflush=False   → prevents implicit flushes; we flush/commit explicitly
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# ---------------------------------------------------------------------------
# Base class — all ORM models inherit from this (Phase 4+)
# ---------------------------------------------------------------------------
Base = declarative_base()


# ---------------------------------------------------------------------------
# FastAPI dependency — inject a DB session per request
# ---------------------------------------------------------------------------
def get_db():
    """
    Yields a database session and guarantees it is closed after the request,
    even if an exception is raised.

    Usage in a route:
        from app.database.database import get_db
        from sqlalchemy.orm import Session
        from fastapi import Depends

        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Startup health check
# ---------------------------------------------------------------------------
def check_db_connection() -> bool:
    """
    Attempts a lightweight SELECT 1 against the configured database.
    Returns True on success, False on failure.
    Called once at application startup — does NOT crash the app on failure,
    but logs a clear error message.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[DB] Connection error: {exc}")
        return False
