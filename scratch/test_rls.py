
import os
from dotenv import load_dotenv
load_dotenv('.env.local')
from supabase import create_client

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")
client = create_client(url, key)

try:
    res = client.table("products").insert({"name": "Test Product", "price": 0, "category": "Test"}).execute()
    print("Insert success")
except Exception as e:
    print(f"Insert failed: {e}")
