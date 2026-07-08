"""
SerpAPI Service

Uses SerpAPI (Google Search) for real-time company signal enrichment.
Falls back gracefully if API key is not configured.
"""
import logging
import time
from typing import Dict, Any, List

from app.config import settings

logger = logging.getLogger(__name__)


def serp_search(query: str, num: int = 5) -> Dict[str, Any]:
    """
    Perform a Google search via SerpAPI.
    Returns structured results dict.
    """
    if not settings.serpapi_key:
        return {"success": False, "results": [], "answer": "", "error": "SERPAPI_KEY not configured"}

    try:
        from serpapi import GoogleSearch
        start = time.time()
        search = GoogleSearch({
            "q": query,
            "api_key": settings.serpapi_key,
            "num": num,
            "hl": "en",
            "gl": "us",
        })
        raw = search.get_dict()
        elapsed = time.time() - start

        # Extract organic results
        organic = raw.get("organic_results", [])
        results = [
            {
                "title": r.get("title", ""),
                "snippet": r.get("snippet", ""),
                "link": r.get("link", ""),
            }
            for r in organic[:num]
        ]

        # Knowledge graph answer if available
        answer = ""
        kg = raw.get("knowledge_graph", {})
        if kg:
            answer = kg.get("description", "")
        if not answer:
            ans_box = raw.get("answer_box", {})
            answer = ans_box.get("answer", ans_box.get("snippet", ""))

        logger.info(f"[SerpAPI] '{query}' → {len(results)} results in {elapsed:.2f}s")
        return {"success": True, "results": results, "answer": answer, "elapsed": elapsed}

    except Exception as e:
        logger.warning(f"[SerpAPI] Search failed: {e}")
        return {"success": False, "results": [], "answer": "", "error": str(e)}


def enrich_company_serp(company_name: str, intent: str = "") -> Dict[str, Any]:
    """
    Search for live company signals on Google via SerpAPI.
    Used to supplement RSS/Tavily enrichment.
    """
    query = f"{company_name} {intent} latest news funding announcement 2025 2026"
    result = serp_search(query, num=4)

    enriched_text = ""
    if result["success"]:
        parts = []
        if result["answer"]:
            parts.append(result["answer"])
        for r in result["results"][:3]:
            parts.append(f"{r['title']}: {r['snippet']}")
        enriched_text = "\n".join(parts)

    return {
        "enriched": result["success"],
        "raw_text_enriched": enriched_text[:600],
        "urls": [r["link"] for r in result.get("results", [])],
        "answer": result.get("answer", ""),
    }
