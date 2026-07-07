def generate_email(company_name: str, intent: str) -> dict:
    return {
        "email_subject": f"Congratulations on your {intent.lower()}!",
        "email_body": f"Hi {company_name} Team,\n\nWe noticed your recent {intent.lower()} activity. We believe our platform can help accelerate your growth.\n\nRegards,\nSignal-Main AI"
    }
