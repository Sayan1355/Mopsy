"""
Health check router.

GET /health — lightweight liveness probe.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", summary="Health check")
async def health_check():
    """Returns service health status."""
    return {"status": "healthy"}
