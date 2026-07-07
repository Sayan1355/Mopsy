import json
import logging
import os
import time
from typing import Dict, Any

from openai import OpenAI
from app.config import settings

logger = logging.getLogger(__name__)

# Fallback Rules
RULES = {
    "hiring": ("Hiring", "Growth"),
    "hire": ("Hiring", "Growth"),
    "funding": ("Funding", "Finance"),
    "raised": ("Funding", "Finance"),
    "launch": ("Product Launch", "Strategy"),
    "new product": ("Product Launch", "Strategy"),
    "partner": ("Partnership", "Networking"),
    "collaboration": ("Creator Collaboration", "Networking"),
    "acquire": ("Acquisition", "Strategy"),
    "expand": ("Expansion", "Growth"),
    "office": ("Expansion", "Growth"),
    "opening": ("Expansion", "Growth"),
    "invest": ("Investment", "Finance"),
    "buy": ("Buying Intent", "Operations"),
    "event": ("Event Participation", "Networking"),
    "conference": ("Event Participation", "Networking")
}

def analyze_intent_fallback(raw_text: str) -> Dict[str, Any]:
    """Rule-based fallback if OpenAI is unavailable."""
    text_lower = raw_text.lower()
    
    for keyword, (intent, category) in RULES.items():
        if keyword in text_lower:
            return {
                "intent": intent,
                "confidence": 0.85,
                "reasoning": f"Fallback rule matched keyword: '{keyword}'",
                "category": category,
                "fallback_used": True
            }
            
    return {
        "intent": "Other",
        "confidence": 0.50,
        "reasoning": "Fallback rule found no direct match.",
        "category": "Unknown",
        "fallback_used": True
    }


def analyze_intent(company_name: str, raw_text: str) -> Dict[str, Any]:
    """
    Analyzes raw signal text to extract intent.
    Tries OpenAI GPT API first, falls back to rule-based engine on failure.
    """
    start_time = time.time()
    result = None
    
    # Try OpenAI if configured
    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "intent_prompt.txt")
            
            with open(prompt_path, "r") as f:
                system_prompt = f.read()
                
            prompt = system_prompt.format(company_name=company_name, raw_text=raw_text)
            
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
            logger.warning(f"OpenAI API failed ({e}), falling back to rules.")
            result = None
    
    # Use fallback if OpenAI failed or is unconfigured
    if not result:
        result = analyze_intent_fallback(raw_text)
        
    process_time = time.time() - start_time
    
    # Log the analysis details
    print(
        f"[Intent Agent] Processed in {process_time:.2f}s | "
        f"Intent: {result.get('intent')} | "
        f"Confidence: {result.get('confidence')} | "
        f"Fallback: {result.get('fallback_used')}"
    )
    
    return result
