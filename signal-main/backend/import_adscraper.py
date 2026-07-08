import psycopg2
import requests
import re
import json

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "adscraper",
    "user": "postgres",
    "password": "yourpassword"
}

API_URL = "http://localhost:8000/api/v1/collect"

def clean_html(html_text):
    if not html_text:
        return ""
    # Very basic HTML tag removal for demo text extraction
    text = re.sub('<[^<]+>', ' ', html_text)
    # Clean up excessive whitespace
    return ' '.join(text.split())

def run_import():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        print("Connected to adscraper database.")
        
        cur.execute("SELECT id, url, html FROM ad;")
        ads = cur.fetchall()
        print(f"Found {len(ads)} ads in adscraper DB.")
        
        for ad_id, url, html in ads:
            ad_text = clean_html(html)
            # Default fallback for advertiser name if none found
            advertiser = "Adscraper Partner"
            
            if url:
                # Basic hostname extraction
                match = re.search(r'https?://(?:www\.)?([^/]+)', url)
                if match:
                    advertiser = match.group(1).split('.')[0].capitalize()
            
            # Skip if there's virtually no text (e.g. only scripts)
            if len(ad_text) < 10:
                ad_text = "Advertisement content could not be fully extracted (image or iframe based)."
                
            payload = {
                "source_type": "adscraper",
                "payload": {
                    "adscraper_record": {
                        "advertiser_name": advertiser,
                        "ad_text": ad_text,
                        "ad_url": url or "Unknown"
                    }
                }
            }
            
            # Send to Signal-Main Collector
            try:
                res = requests.post(API_URL, json=payload, timeout=5)
                if res.status_code == 201:
                    print(f"✅ Successfully ingested Ad {ad_id} into Signal-Main.")
                else:
                    print(f"❌ Failed to ingest Ad {ad_id}: {res.text}")
            except Exception as e:
                print(f"❌ Connection error on Ad {ad_id}: {e}")
                
        cur.close()
        conn.close()
        print("Import complete.")
        
    except Exception as e:
        print(f"Failed to connect to adscraper: {e}")

if __name__ == "__main__":
    run_import()
