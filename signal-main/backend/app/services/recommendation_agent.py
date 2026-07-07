import json
import logging
import os
import time
from typing import Dict, Any

from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback strategies per intent type
FALLBACK_STRATEGIES = {
    "hiring": {
        "next_best_action": "Contact HR or Engineering leadership.",
        "communication_channel": "LinkedIn + Email",
        "opportunity_summary": "Hiring indicates organizational scaling and potential for new tool adoption.",
        "risk_level": "Low"
    },
    "funding": {
        "next_best_action": "Contact Founders or CXOs.",
        "communication_channel": "Email + Phone",
        "opportunity_summary": "Recent funding suggests a high budget and immediate operational needs.",
        "risk_level": "Low"
    },
    "expansion": {
        "next_best_action": "Offer enterprise infrastructure solutions.",
        "communication_channel": "LinkedIn + Email",
        "opportunity_summary": "Expansion indicates geographic or operational scaling.",
        "risk_level": "Medium"
    },
    "partnership": {
        "next_best_action": "Initiate strategic business development outreach.",
        "communication_channel": "LinkedIn",
        "opportunity_summary": "Partnerships indicate an open, collaborative business model.",
        "risk_level": "Medium"
    },
    "product launch": {
        "next_best_action": "Propose marketing collaboration or tech integration.",
        "communication_channel": "Twitter + LinkedIn",
        "opportunity_summary": "New products require distribution and complementary services.",
        "risk_level": "Medium"
    }
}

def analyze_recommendation_fallback(intent: str, lead_score: float) -> Dict[str, Any]:
    """Rule-based fallback if OpenAI is unavailable."""
    intent_lower = intent.lower()
    
    strategy = FALLBACK_STRATEGIES.get(
        intent_lower, 
        {
            "next_best_action": "General discovery outreach.",
            "communication_channel": "Email",
            "opportunity_summary": "Uncategorized business activity.",
            "risk_level": "High"
        }
    )
    
    # Adjust follow_up_timeline based on lead score
    if lead_score >= 90:
        timeline = "Within 24 hours"
    elif lead_score >= 75:
        timeline = "Within 3 days"
    else:
        timeline = "Within 1 week"

    return {
        "next_best_action": strategy["next_best_action"],
        "communication_channel": strategy["communication_channel"],
        "follow_up_timeline": timeline,
        "opportunity_summary": strategy["opportunity_summary"],
        "risk_level": strategy["risk_level"],
        "reasoning": f"Fallback recommendation for {intent} with score {lead_score}.",
        "fallback_used": True
    }


def analyze_recommendation(company_name: str, raw_text: str, intent: str, lead_score: float) -> Dict[str, Any]:
    """
    Analyzes signal context to generate strategic recommendations.
    Tries OpenAI GPT API first, falls back to rule-based engine on failure.
    """
    start_time = time.time()
    result = None
    
    # Try OpenAI if configured
    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "recommendation_prompt.txt")
            
            with open(prompt_path, "r") as f:
                system_prompt = f.read()
                
            prompt = system_prompt.format(
                company_name=company_name,
                raw_text=raw_text,
                intent=intent,
                lead_score=lead_score
            )
            
            api_start = time.time()
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.0,
                timeout=15.0
            )
            api_end = time.time()
            
            output_content = response.choices[0].message.content
            result = json.loads(output_content)
            result["fallback_used"] = False
            result["ai_response_time"] = api_end - api_start
            
        except Exception as e:
            logger.warning(f"OpenAI API failed ({e}), falling back to recommendation rules.")
            result = None
            
    # Use fallback if OpenAI failed or is unconfigured
    if not result:
        result = analyze_recommendation_fallback(intent, lead_score)
        result["ai_response_time"] = 0.0
        
    process_time = time.time() - start_time
    
    # Log the analysis details
    print(
        f"[Recommendation Agent] Processed in {process_time:.2f}s | "
        f"AI Time: {result.get('ai_response_time'):.2f}s | "
        f"Action: {result.get('next_best_action')} | "
        f"Fallback: {result.get('fallback_used')}"
    )
    
    return result
