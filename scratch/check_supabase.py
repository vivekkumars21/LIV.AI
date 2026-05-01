
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')

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

    print("\nChecking 'products' table...")
    try:
        products = svc.data_client.table("products").select("*").limit(1).execute()
        print(f"Products count: {len(products.data)}")
    except Exception as e:
        print(f"Error checking products: {e}")

    print("\nChecking 'furniture_items' table...")
    try:
        furniture = svc.data_client.table("furniture_items").select("*").limit(1).execute()
        print(f"Furniture count: {len(furniture.data)}")
    except Exception as e:
        print(f"Error checking furniture_items: {e}")

if __name__ == "__main__":
    check_tables()
