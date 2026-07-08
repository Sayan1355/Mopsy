import urllib.request
import json
import sys

api_key = "AQ.Ab8RN6LaPw6wcU8CfzGqtwQ5aYoATZtbgcDQ3-ts8R9CJWVMnA"
url = "https://nubela.co/proxycurl/api/linkedin/company?url=https://www.linkedin.com/company/apple"

req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + api_key})
try:
    with urllib.request.urlopen(req) as response:
        print("Proxycurl Success:", response.status)
except Exception as e:
    print("Proxycurl Failed:", e)

