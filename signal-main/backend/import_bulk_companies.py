import urllib.request
import json
import time

API_URL = "http://localhost:8000/api/v1/collect"

COMPANIES = [
    "Stripe", "Clay", "Apollo.io", "ZoomInfo", "Clearbit", "Crunchbase",
    "Linear", "Vercel", "Retool", "Supabase", "Neon", "PlanetScale",
    "Clerk", "Resend", "Ramp", "Rippling", "Mercury", "Brex", "Carta",
    "Attio", "Affinity", "Gong", "HubSpot", "Salesforce", "Notion",
    "Airtable", "Coda", "OpenAI", "Anthropic", "Perplexity", "Diffbot",
    "BuiltWith", "Hunter.io", "RocketReach", "People Data Labs", 
    "Harmonic.ai", "SerpAPI", "G2", "Product Hunt"
]

def format_url(company: str) -> str:
    # Basic URL formatting heuristics
    clean = company.lower().replace(" ", "")
    if "." in clean:
        return f"https://{clean}"
    return f"https://{clean}.com"

def bulk_scrape():
    print("==================================================")
    print(f"📡 INIT: BULK BATCH SCRAPER (SIGNAL COLLECTION)")
    print(f"Targets: {len(COMPANIES)} Enterprise Websites")
    print("==================================================\n")
    
    success_count = 0
    
    for company in COMPANIES:
        url = format_url(company)
        print(f"🔍 Scraping & Analyzing: {company} ({url})")
        
        payload = {
            "source_type": "website",
            "payload": {
                "url": url,
                "company_name": company
            }
        }
        
        req = urllib.request.Request(
            API_URL, 
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                result = json.loads(res.read().decode('utf-8'))
                print(f"   ✅ [SUCCESS] Score: {result['lead']['lead_score']} | Intent: {result['intent']['intent']}")
                success_count += 1
        except Exception as e:
            print(f"   ❌ [FAILED] Skipping. Reason: {str(e)[:50]}")
            
        # Very small delay to respect backend processing
        time.sleep(1)

    print(f"\n==================================================")
    print(f"🎉 COMPLETE: {success_count}/{len(COMPANIES)} companies ingested successfully.")
    print("==================================================")

if __name__ == "__main__":
    bulk_scrape()
