import urllib.request
import json

cookie = "AQ.Ab8RN6LaPw6wcU8CfzGqtwQ5aYoATZtbgcDQ3-ts8R9CJWVMnA"
url = "https://www.linkedin.com/company/apple"

req = urllib.request.Request(url, headers={
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Cookie': f'li_at={cookie}'
})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        if "Apple" in html:
            print("Cookie Auth Success: Loaded Apple Company Page")
        else:
            print("Page loaded but content might be wrong")
except Exception as e:
    print("Cookie Auth Failed:", e)
