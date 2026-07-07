import json
import logging
import os
import time
from typing import Dict, Any

from openai import OpenAI
from app.config import settings

from app.services.email_generator import generate_email
from app.services.linkedin_generator import generate_linkedin_message
from app.services.crm_generator import generate_crm_entry
from app.services.followup_scheduler import generate_reminder

logger = logging.getLogger(__name__)

def generate_workflow_fallback(company_name: str, intent: str, priority: str, action_text: str) -> Dict[str, Any]:
    """Rule-based fallback for generating workflow assets."""
    email = generate_email(company_name, intent)
    linkedin = generate_linkedin_message(company_name, intent)
    crm = generate_crm_entry(company_name, priority)
    reminder = generate_reminder(action_text)
    
    return {
        "email_subject": email["email_subject"],
        "email_body": email["email_body"],
        "linkedin_message": linkedin,
        "crm_entry": crm,
        "reminder": reminder,
        "fallback_used": True
    }


def execute_workflow(company_name: str, raw_text: str, intent: str, lead_score: float, recommendation: str, priority: str) -> Dict[str, Any]:
    """
    Executes the automation workflow generation.
    Tries OpenAI GPT API first, falls back to discrete rule-based generators on failure.
    """
    start_time = time.time()
    result = None
    
    # Try OpenAI if configured
    if settings.openai_api_key:
        try:
            client = OpenAI(api_key=settings.openai_api_key)
            prompt_path = os.path.join(os.path.dirname(__file__), "..", "prompts", "automation_prompt.txt")
            
            with open(prompt_path, "r") as f:
                system_prompt = f.read()
                
            prompt = system_prompt.format(
                company_name=company_name,
                raw_text=raw_text,
                intent=intent,
                lead_score=lead_score,
                recommendation=recommendation
            )
            
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
            
            output_content = response.choices[0].message.content
            result = json.loads(output_content)
            result["fallback_used"] = False
            
        except Exception as e:
            logger.warning(f"OpenAI API failed ({e}), falling back to automation rules.")
            result = None
            
    # Use fallback if OpenAI failed or is unconfigured
    if not result:
        result = generate_workflow_fallback(company_name, intent, priority, recommendation)
        
    process_time = time.time() - start_time
    
    # Log the analysis details
    print(
        f"[Automation Agent] Processed in {process_time:.2f}s | "
        f"Generated Email: Yes | Generated CRM: Yes | "
        f"Fallback: {result.get('fallback_used')}"
    )
    
    return result
