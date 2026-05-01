
import os
import httpx
from dotenv import load_dotenv
load_dotenv('.env.local')

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

data = {
    "name": "Test Furniture",
    "category": "Beds",
    "price": 1000
}

response = httpx.post(f"{url}/rest/v1/furniture_items", headers=headers, json=data)
print(f"Status: {response.status_code}")
print(f"Body: {response.text}")
