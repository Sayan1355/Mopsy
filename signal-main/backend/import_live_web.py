import urllib.request
import xml.etree.ElementTree as ET
import json
import time

API_URL = "http://localhost:8000/api/v1/collect"

def fetch_live_signals():
    print("==================================================")
    print("📡 INIT: LIVE WEB SCRAPER (SIGNAL COLLECTION AGENT)")
    print("==================================================")
    print("Target: TechCrunch Public RSS (Funding, Launches, Hiring)")
    
    url = "https://techcrunch.com/feed/"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
    except Exception as e:
        print(f"❌ Failed to fetch live data: {e}")
        return

    root = ET.fromstring(xml_data)
    items = root.findall('.//item')
    
    print(f"✅ Successfully scraped {len(items)} live articles from the web.\n")
    
    # We will process the top 3 live news items to avoid overloading the AI agent
    for item in items[:3]:
        title = item.find('title').text if item.find('title') is not None else "Unknown"
        link = item.find('link').text if item.find('link') is not None else ""
        desc = item.find('description').text if item.find('description') is not None else ""
        
        # Clean HTML tags out of description roughly
        desc = desc.split("<")[0][:200] + "..." if desc else ""
        
        # We will attempt to guess the company name from the title
        # (Usually the first word in TechCrunch titles)
        company_guess = title.split(" ")[0].replace(",", "").replace(":", "")
        
        print(f"🔍 Analyzing Live Web Signal: {title}")
        
        payload = {
            "source_type": "rss",
            "payload": {
                "rss_item": {
                    "title": title,
                    "description": desc,
                    "link": link,
                    "company_guess": company_guess
                }
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
                print("-" * 50)
        except Exception as e:
            print(f"   ❌ Failed to process signal: {e}")
            
        # Small delay to respect rate limits if calling OpenAI
        time.sleep(2)

if __name__ == "__main__":
    fetch_live_signals()
