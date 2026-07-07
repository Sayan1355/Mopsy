import urllib.request
import json
import sys
import time

API_URL = "http://localhost:8000/api/v1/collect"

def scrape_custom_website(url: str, company_name: str):
    print("==================================================")
    print(f"📡 INIT: CUSTOM WEBSITE SCRAPER (SIGNAL COLLECTION)")
    print(f"Target URL: {url}")
    print("==================================================")
    
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    
    payload = {
        "source_type": "website",
        "payload": {
            "url": url
        }
    }
    
    req_post = urllib.request.Request(
        API_URL, 
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req_post) as res:
            result = json.loads(res.read().decode('utf-8'))
            print("   ➔ [INTENT AGENT] Identified:", result['intent']['intent'])
            print("   ➔ [SCORING AGENT] Lead Score:", result['lead']['lead_score'])
            print("   ➔ [ACTION AGENT] Recommendation:", result['recommendation']['next_best_action'])
    except Exception as e:
        print(f"   ❌ Failed to process signal: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 import_website.py <URL> <CompanyName>")
        print("Example: python3 import_website.py https://openai.com OpenAI")
        sys.exit(1)
        
    scrape_custom_website(sys.argv[1], sys.argv[2])
