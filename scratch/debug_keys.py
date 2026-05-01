
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')

print(f"URL: {os.getenv('SUPABASE_URL')}")
print(f"ANON: {os.getenv('SUPABASE_ANON_KEY')[:10]}...")

from backend.services.supabase_service import SupabaseService

def check_tables():
    svc = SupabaseService.from_env()
    if not svc:
        print("Failed to initialize SupabaseService")
        return

    print("Checking 'professionals' table...")
    try:
        profs = svc.data_client.table("professionals").select("*").limit(1).execute()
        print(f"Professionals count: {len(profs.data)}")
    except Exception as e:
        print(f"Error checking professionals: {e}")

if __name__ == "__main__":
    check_tables()
