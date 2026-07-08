import logging
import os
import time
from typing import Dict, Any

from openai import OpenAI
from sqlalchemy.orm import Session

from app.config import settings
from app.models.lead import Lead
from app.models.signal import Signal
from app.models.intent import Intent
from app.models.action import Action
from app.services.tavily_service import search_topic

logger = logging.getLogger(__name__)


def fetch_database_context(db: Session) -> str:
    """Fetches a recent snapshot of database to provide context for the Copilot."""
    try:
        leads = db.query(Lead).order_by(Lead.lead_score.desc()).limit(20).all()

        context_lines = []
        for lead in leads:
            signal = db.query(Signal).filter(Signal.id == lead.signal_id).first()
            intent = db.query(Intent).filter(Intent.signal_id == lead.signal_id).first()
            action = db.query(Action).filter(Action.lead_id == lead.id).first()

            if signal:
                intent_val = intent.intent if intent else "Unknown"
                action_val = action.recommended_action if action else "None"

                context_lines.append(
                    f"- Company: {signal.company_name} | Signal: {signal.raw_text[:120]} | "
                    f"Intent: {intent_val} | Lead Score: {lead.lead_score} | "
                    f"Priority: {lead.priority.name} | Action: {action_val}"
                )

        if not context_lines:
            return "No signals currently in database."
        return "\n".join(context_lines)
    except Exception as e:
        logger.error(f"Error fetching DB context: {e}")
        return "Database unavailable."


def generate_chat_response(message: str, db: Session) -> Dict[str, Any]:
    """Generates the Copilot response using DB context + Tavily live search + OpenAI."""
    start_time = time.time()
    response_text = ""
    fallback_used = True
    tavily_used = False

    # 1. Try OpenAI
    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "business_copilot_prompt.txt")

            with open(prompt_path, "r") as f:
                system_prompt_template = f.read()

            db_context = fetch_database_context(db)
            system_prompt = system_prompt_template.replace("{context_data}", db_context)

            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                timeout=20.0
            )

            response_text = response.choices[0].message.content
            fallback_used = False

        except Exception as e:
            logger.warning(f"OpenAI API failed ({e}), falling back to Tavily + rules.")

    # 2. Tavily live web search fallback
    if not response_text and settings.tavily_api_key:
        try:
            db_context = fetch_database_context(db)
            search_query = f"B2B sales signal intelligence: {message}"
            tavily_result = search_topic(search_query, max_results=4)

            if tavily_result["success"] and (tavily_result["answer"] or tavily_result["results"]):
                answer = tavily_result["answer"] or ""
                snippets = "\n".join(
                    f"• {r.get('title', '')}: {r.get('content', '')[:150]}"
                    for r in tavily_result["results"][:3]
                )
                db_summary = db_context[:400] if db_context else "No local data."
                response_text = (
                    f"[Live Intelligence — Tavily]\n\n"
                    f"{answer}\n\n"
                    f"Related signals:\n{snippets}\n\n"
                    f"Your DB context:\n{db_summary}"
                )
                tavily_used = True
                fallback_used = False
        except Exception as e:
            logger.warning(f"Tavily copilot fallback failed: {e}")

    # 3. Last-resort rule-based responses
    if not response_text:
        message_lower = message.lower()
        if "highest" in message_lower or "top" in message_lower:
            response_text = "The highest lead score belongs to companies with 'Hiring' or 'Funding' intents based on our rules engine."
        elif "summary" in message_lower:
            response_text = "Today's summary: Several new opportunities detected with a focus on enterprise infrastructure and growth signals."
        elif "compare" in message_lower:
            response_text = "Comparing companies requires active AI to analyze disparate data points accurately."
        elif "action" in message_lower:
            response_text = "Your first action should be reviewing Critical priority leads and triggering their automated workflows."
        else:
            response_text = "Signal-Main Copilot ready. Ask me about leads, scores, companies, or market trends."

    process_time = time.time() - start_time

    print(
        f"[Copilot Agent] Question: '{message}' | "
        f"Time: {process_time:.2f}s | "
        f"Model: {'OpenAI' if not fallback_used and not tavily_used else 'Tavily' if tavily_used else 'Rules'} | "
        f"Fallback: {fallback_used}"
    )

    return {
        "response": response_text,
        "tavily_used": tavily_used,
    }
