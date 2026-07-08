"""
Tavily Search Service

Uses the Tavily API to enrich signals with live web data:
- Company research & enrichment
- Real-time lead score boost based on web presence
- Graph/analytics data from live search results
"""
import logging
import time
from typing import Dict, Any, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)


def _get_client():
    """Lazily create Tavily client."""
    if not settings.tavily_api_key:
        raise RuntimeError("TAVILY_API_KEY not configured")
    from tavily import TavilyClient
    return TavilyClient(api_key=settings.tavily_api_key)


def enrich_company(company_name: str, context: str = "") -> Dict[str, Any]:
    """
    Search for live info about a company to enrich signal data.
    Returns structured enrichment dict.
    """
    start = time.time()
    try:
        client = _get_client()
        query = f"{company_name} latest news funding product launch 2024 2025"
        if context:
            query += f" {context[:100]}"

        result = client.search(
            query=query,
            search_depth="basic",
            max_results=5,
            include_answer=True,
        )

        # Extract top results
        snippets = [r.get("content", "") for r in result.get("results", [])[:5]]
        urls = [r.get("url", "") for r in result.get("results", [])[:5]]
        answer = result.get("answer", "")

        elapsed = time.time() - start
        logger.info(f"[Tavily] Enriched '{company_name}' in {elapsed:.2f}s")

        return {
            "enriched": True,
            "answer": answer,
            "snippets": snippets,
            "urls": urls,
            "raw_text_enriched": f"{answer}\n\n" + "\n".join(snippets[:3]),
            "elapsed": elapsed,
        }

    except Exception as e:
        logger.warning(f"[Tavily] Enrichment failed for '{company_name}': {e}")
        return {"enriched": False, "answer": "", "snippets": [], "urls": [], "raw_text_enriched": "", "elapsed": 0}


def boost_lead_score(base_score: float, company_name: str, intent: str) -> Dict[str, Any]:
    """
    Use Tavily to search for real-time signals that boost or penalise lead score.
    Returns adjusted score + reasoning.
    """
    try:
        client = _get_client()
        query = f"{company_name} {intent} recent signal news announcement"
        result = client.search(query=query, search_depth="basic", max_results=3, include_answer=True)

        answer = result.get("answer", "")
        results_count = len(result.get("results", []))

        # Simple heuristic boost: more live results = stronger signal
        boost = 0
        if results_count >= 4:
            boost = 8
        elif results_count >= 2:
            boost = 4

        # Keyword boost
        answer_lower = (answer or "").lower()
        for kw in ["funding", "raised", "launched", "acquired", "hired", "expanded"]:
            if kw in answer_lower:
                boost += 5
                break

        final_score = min(base_score + boost, 100.0)

        return {
            "original_score": base_score,
            "final_score": final_score,
            "boost_applied": boost,
            "reasoning": answer or f"Live web search found {results_count} result(s) for {company_name}.",
            "tavily_used": True,
        }
    except Exception as e:
        logger.warning(f"[Tavily] Score boost failed: {e}")
        return {
            "original_score": base_score,
            "final_score": base_score,
            "boost_applied": 0,
            "reasoning": "Tavily unavailable; base score used.",
            "tavily_used": False,
        }


def search_topic(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    General-purpose Tavily search for copilot, graph data, or analytics.
    """
    try:
        client = _get_client()
        result = client.search(
            query=query,
            search_depth="basic",
            max_results=max_results,
            include_answer=True,
        )
        return {
            "answer": result.get("answer", ""),
            "results": result.get("results", []),
            "success": True,
        }
    except Exception as e:
        logger.warning(f"[Tavily] Search failed: {e}")
        return {"answer": "", "results": [], "success": False, "error": str(e)}
