"""
Dashboard Router

Provides real-time stats, time-series chart data, and target table for the frontend.
All data is computed live from the DB.
"""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.database.database import get_db
from app.models.action import Action, ActionStatusEnum
from app.models.signal import Signal
from app.models.lead import Lead, LeadPriorityEnum, LeadStatusEnum
from app.models.intent import Intent

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    try:
        # ── Core KPIs ────────────────────────────────────────────────────────
        total_signals = db.query(Signal).count()

        high_priority_leads = db.query(Lead).filter(
            Lead.priority == LeadPriorityEnum.HIGH
        ).count()

        avg_score_result = db.query(func.avg(Lead.lead_score)).scalar()
        avg_lead_score = round(float(avg_score_result), 1) if avg_score_result else 0

        # Queued (CONTACTED) count
        queued_count = db.query(Lead).filter(
            Lead.status.in_([LeadStatusEnum.CONTACTED, LeadStatusEnum.QUALIFIED])
        ).count()

        # ── Intent distribution ───────────────────────────────────────────────
        intent_counts = (
            db.query(Intent.intent, func.count(Intent.id))
            .group_by(Intent.intent)
            .all()
        )
        total_intents = sum(v for _, v in intent_counts) or 1
        intent_distribution = [
            {
                "name": row[0],
                "value": row[1],
                "val": f"{int(row[1] / total_intents * 100)}%",
            }
            for row in intent_counts
        ]
        if not intent_distribution:
            intent_distribution = [{"name": "Hiring", "value": 1, "val": "50%"}]

        # ── Lead score distribution ───────────────────────────────────────────
        leads = db.query(Lead.lead_score).all()
        dist = {"0-50": 0, "50-74": 0, "75-89": 0, "90-100": 0}
        for (score,) in leads:
            if score < 50:
                dist["0-50"] += 1
            elif score < 75:
                dist["50-74"] += 1
            elif score < 90:
                dist["75-89"] += 1
            else:
                dist["90-100"] += 1
        lead_distribution = [{"name": k, "count": v} for k, v in dist.items()]

        # ── Time-series: signals ingested per day (last 14 days) ─────────────
        today = datetime.utcnow().date()
        time_series = []
        for i in range(13, -1, -1):
            day = today - timedelta(days=i)
            day_start = datetime(day.year, day.month, day.day)
            day_end = day_start + timedelta(days=1)
            count = (
                db.query(Signal)
                .filter(Signal.created_at >= day_start, Signal.created_at < day_end)
                .count()
            )
            time_series.append({
                "day": day.strftime("%m/%d"),
                "signals": count,
            })

        # ── Active target table (NOT yet queued — status = New) ───────────────
        active_signals = (
            db.query(Signal, Lead, Intent)
            .outerjoin(Lead, Signal.id == Lead.signal_id)
            .outerjoin(Intent, Signal.id == Intent.signal_id)
            .filter(
                (Lead.status == LeadStatusEnum.NEW) | (Lead.id == None)
            )
            .order_by(Lead.lead_score.desc())
            .limit(12)
            .all()
        )

        table_data = []
        for sig, lead, intent in active_signals:
            table_data.append({
                "id": sig.id,
                "lead_id": lead.id if lead else None,
                "company_name": sig.company_name,
                "signal_type": sig.signal_type,
                "intent": intent.intent if intent else "Unknown",
                "lead_score": lead.lead_score if lead else "N/A",
                "priority": lead.priority.value if lead else "IDLE",
                "source": sig.source or "Manual",
                "created_at": sig.created_at.isoformat() if sig.created_at else "",
            })

        return {
            "total_signals": total_signals,
            "high_priority_leads": high_priority_leads,
            "avg_lead_score": avg_lead_score,
            "queued_count": queued_count,
            "intent_distribution": intent_distribution,
            "lead_distribution": lead_distribution,
            "time_series": time_series,
            "table_data": table_data,
        }
    except Exception as e:
        return {"error": str(e)}
