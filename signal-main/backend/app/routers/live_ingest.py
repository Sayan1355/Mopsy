"""
Live Ingest Router

Fetches real-time data from configured RSS feeds (GitHub Changelog, AWS What's New, Linear Changelog),
enriches each entry with Tavily web search, runs the full AI pipeline (intent → lead scoring → recommendation),
and persists everything to the DB.

Endpoints:
  POST /api/v1/live/ingest   — fetch + process all RSS feeds now
  GET  /api/v1/live/preview  — dry-run: returns parsed feed items without saving
"""
import logging
import time
from typing import Any, Dict, List, Optional

import feedparser
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.intent import Intent as IntentModel
from app.models.lead import Lead, LeadPriorityEnum, LeadStatusEnum
from app.models.signal import Signal
from app.schemas.action import ActionCreate
from app.schemas.intent import IntentCreate
from app.schemas.lead import LeadCreate
from app.schemas.signal import SignalCreate
from app.services import (
    action_service,
    intent_service,
    lead_service,
    signal_service,
)
from app.services.intent_agent import analyze_intent
from app.services.lead_scoring_agent import analyze_lead
from app.services.recommendation_agent import analyze_recommendation
from app.services.tavily_service import enrich_company, boost_lead_score

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/live", tags=["Live Ingest"])

# ── RSS feed registry ────────────────────────────────────────────────────────
RSS_FEEDS: List[Dict[str, str]] = [
    {
        "name": "GitHub Changelog",
        "url": "https://github.blog/changelog/feed/",
        "company": "GitHub",
        "signal_type": "Product Launch",
    },
    {
        "name": "AWS What's New",
        "url": "https://aws.amazon.com/about-aws/whats-new/recent/feed/",
        "company": "Amazon Web Services",
        "signal_type": "Product Launch",
    },
    {
        "name": "Linear Changelog",
        "url": "https://linear.app/changelog/feed",
        "company": "Linear",
        "signal_type": "Product Launch",
    },
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def _fetch_feed(url: str, timeout: int = 10) -> List[Dict[str, Any]]:
    """Fetch and parse an RSS/Atom feed URL. Returns a list of entry dicts."""
    try:
        headers = {"User-Agent": "SignalMain/1.0 (RSS Collector; contact@signalmain.io)"}
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        feed = feedparser.parse(resp.content)
        entries = []
        for entry in feed.entries[:10]:  # cap at 10 per feed
            title = entry.get("title", "")
            summary = entry.get("summary", entry.get("description", ""))
            link = entry.get("link", "")
            entries.append({"title": title, "summary": summary, "link": link})
        return entries
    except Exception as e:
        logger.warning(f"[LiveIngest] Failed to fetch {url}: {e}")
        return []


def _already_ingested(db: Session, source_url: str) -> bool:
    """Return True if a signal with this source_url already exists."""
    return db.query(Signal).filter(Signal.source_url == source_url).first() is not None


def _run_pipeline(db: Session, sig: Signal) -> Dict[str, Any]:
    """
    Run intent → scoring → recommendation on a Signal row.
    Returns a result dict. Skips if lead already exists.
    """
    existing_intent = db.query(IntentModel).filter(IntentModel.signal_id == sig.id).first()

    if existing_intent:
        intent_analysis = {
            "intent": existing_intent.intent,
            "confidence": existing_intent.confidence,
            "reasoning": existing_intent.reasoning,
            "category": existing_intent.intent,
        }
    else:
        intent_analysis = analyze_intent(company_name=sig.company_name, raw_text=sig.raw_text)
        intent_service.create_intent(
            db=db,
            intent_data=IntentCreate(
                signal_id=sig.id,
                intent=intent_analysis["intent"],
                confidence=intent_analysis["confidence"],
                reasoning=intent_analysis["reasoning"],
            ),
        )

    # Base lead score
    lead_analysis = analyze_lead(
        company_name=sig.company_name,
        raw_text=sig.raw_text,
        intent=intent_analysis["intent"],
        intent_confidence=intent_analysis["confidence"],
    )

    # Tavily real-time score boost
    boost_result = boost_lead_score(
        base_score=float(lead_analysis["lead_score"]),
        company_name=sig.company_name,
        intent=intent_analysis["intent"],
    )
    final_score = boost_result["final_score"]

    raw_priority = lead_analysis.get("priority", "Low").upper()
    if raw_priority in ["CRITICAL", "HIGH"]:
        db_priority = LeadPriorityEnum.HIGH
    elif raw_priority == "MEDIUM":
        db_priority = LeadPriorityEnum.MEDIUM
    else:
        db_priority = LeadPriorityEnum.LOW

    new_lead = lead_service.create_lead(
        db=db,
        lead_data=LeadCreate(
            signal_id=sig.id,
            lead_score=final_score,
            priority=db_priority,
            status=LeadStatusEnum.NEW,
        ),
    )

    rec_analysis = analyze_recommendation(
        company_name=sig.company_name,
        raw_text=sig.raw_text,
        intent=intent_analysis["intent"],
        lead_score=new_lead.lead_score,
    )
    action_service.create_action(
        db=db,
        action_data=ActionCreate(
            lead_id=new_lead.id,
            recommended_action=rec_analysis["next_best_action"],
        ),
    )

    return {
        "company": sig.company_name,
        "intent": intent_analysis["intent"],
        "base_score": lead_analysis["lead_score"],
        "final_score": final_score,
        "tavily_boost": boost_result["boost_applied"],
        "priority": lead_analysis["priority"],
    }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/ingest")
def live_ingest(db: Session = Depends(get_db)):
    """
    Fetch all configured RSS feeds, enrich entries with Tavily, and run the
    full AI pipeline (intent → scoring → recommendation) on each new entry.
    Skips entries already in DB (deduplication by source_url).
    """
    start = time.time()
    results = []
    skipped_dup = 0
    errors = []

    for feed_cfg in RSS_FEEDS:
        logger.info(f"[LiveIngest] Fetching {feed_cfg['name']}")
        entries = _fetch_feed(feed_cfg["url"])

        for entry in entries:
            source_url = entry["link"]

            # Dedup check
            if source_url and _already_ingested(db, source_url):
                skipped_dup += 1
                continue

            # Tavily enrichment of the raw text
            raw_text = f"{entry['title']}: {entry['summary']}"
            enrichment = enrich_company(feed_cfg["company"], context=entry["title"])
            if enrichment["enriched"] and enrichment["raw_text_enriched"]:
                raw_text = f"{raw_text}\n\n[Live Context]: {enrichment['raw_text_enriched'][:500]}"

            # Save signal
            try:
                new_signal = signal_service.create_signal(
                    db=db,
                    signal_data=SignalCreate(
                        company_name=feed_cfg["company"],
                        source=feed_cfg["name"],
                        signal_type=feed_cfg["signal_type"],
                        raw_text=raw_text[:2000],
                        source_url=source_url or None,
                    ),
                )

                # Run full AI pipeline
                pipeline_result = _run_pipeline(db=db, sig=new_signal)
                pipeline_result["source"] = feed_cfg["name"]
                pipeline_result["title"] = entry["title"]
                results.append(pipeline_result)

            except Exception as e:
                db.rollback()
                errors.append({"feed": feed_cfg["name"], "title": entry["title"], "error": str(e)})

    elapsed = time.time() - start
    total_signals = db.query(Signal).count()
    total_leads = db.query(Lead).count()

    return {
        "message": f"Live ingest complete. {len(results)} new signal(s) processed in {elapsed:.1f}s.",
        "processed": len(results),
        "skipped_duplicates": skipped_dup,
        "errors": errors,
        "results": results,
        "totals": {"signals": total_signals, "leads": total_leads},
    }


@router.get("/preview")
def live_preview():
    """
    Dry-run: fetch all RSS feeds and return parsed entries WITHOUT saving to DB.
    Useful for testing / previewing what would be ingested.
    """
    preview = []
    for feed_cfg in RSS_FEEDS:
        entries = _fetch_feed(feed_cfg["url"])
        for entry in entries:
            preview.append({
                "feed": feed_cfg["name"],
                "company": feed_cfg["company"],
                "title": entry["title"],
                "url": entry["link"],
                "summary_preview": entry["summary"][:200] if entry["summary"] else "",
            })
    return {"count": len(preview), "items": preview}
