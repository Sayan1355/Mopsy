def generate_crm_entry(company_name: str, priority: str) -> dict:
    return {
        "company": company_name,
        "priority": priority.capitalize(),
        "owner": "Sales Team",
        "status": "Pending Outreach",
        "next_followup": "24 Hours"
    }
