import json
import logging
import os
import time
from typing import Dict, Any

from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Base scores per intent type
BASE_SCORES = {
    "Buying Intent": 45,
    "Funding": 40,
    "Investment": 35,
    "Hiring": 30,
    "Expansion": 25,
    "Product Launch": 20,
    "Partnership": 15,
}

def analyze_lead_fallback(intent: str, intent_confidence: float) -> Dict[str, Any]:
    """Rule-based fallback if OpenAI is unavailable."""
    base_score = 30  # Default base score
    
    # Match against base scores
    for key, val in BASE_SCORES.items():
        if key.lower() == intent.lower():
            base_score = val
            break
            
    # Add confidence modifier
    modifier = 0
    if intent_confidence >= 0.90:
        modifier = 10
    elif intent_confidence >= 0.70:
        modifier = 5
        
    final_score = min(base_score + modifier + 40, 100) # +40 as a baseline offset for realistic scaling
    
    # Categorization
    if final_score >= 90:
        priority = "Critical"
        opportunity = "Hot"
        quality = "Excellent"
    elif final_score >= 75:
        priority = "High"
        opportunity = "Warm"
        quality = "Very Good"
    elif final_score >= 50:
        priority = "Medium"
        opportunity = "Normal"
        quality = "Average"
    else:
        priority = "Low"
        opportunity = "Cold"
        quality = "Low"
        
    return {
        "lead_score": final_score,
        "priority": priority,
        "opportunity_level": opportunity,
        "lead_quality": quality,
        "confidence": 85,
        "reason": f"Fallback scoring based on intent '{intent}' and confidence modifier.",
        "fallback_used": True
    }


def analyze_lead(company_name: str, raw_text: str, intent: str, intent_confidence: float) -> Dict[str, Any]:
    """
    Analyzes signal and intent to generate a Lead Score.
    Tries OpenAI GPT API first, falls back to rule-based engine on failure.
    """
    start_time = time.time()
    result = None
    
    # Try OpenAI if configured
    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "lead_scoring_prompt.txt")
            
            with open(prompt_path, "r") as f:
                system_prompt = f.read()
                
            prompt = system_prompt.format(
                company_name=company_name,
                raw_text=raw_text,
                intent=intent,
                intent_confidence=intent_confidence
            )
            
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": "You output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={ "type": "json_object" },
                temperature=0.0,
                timeout=10.0
            )
            
            output_content = response.choices[0].message.content
            result = json.loads(output_content)
            result["fallback_used"] = False
            
        except Exception as e:
            logger.warning(f"OpenAI API failed ({e}), falling back to lead scoring rules.")
            result = None
            
    # Use fallback if OpenAI failed or is unconfigured
    if not result:
        result = analyze_lead_fallback(intent, intent_confidence)
        
    process_time = time.time() - start_time
    
    # Log the analysis details
    print(
        f"[Lead Scoring Agent] Processed in {process_time:.2f}s | "
        f"Score: {result.get('lead_score')} | "
        f"Priority: {result.get('priority')} | "
        f"Opportunity: {result.get('opportunity_level')} | "
        f"Fallback: {result.get('fallback_used')}"
    )
    
    return result
