
import os
import sys
import random
from pathlib import Path
from faker import Faker

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
load_dotenv(dotenv_path='.env.local')

from backend.services.supabase_service import SupabaseService

fake = Faker('en_IN') # Using Indian locale for relevant data

def seed_supabase():
    svc = SupabaseService.from_env()
    if not svc:
        print("Error: Could not initialize SupabaseService. Check .env.local")
        return

    print("Seeding Professionals...")
    professions = ['interior_designer', 'contractor', 'carpenter', 'painter', 'architect', 'electrician', 'plumber']
    cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur']
    states = ['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Maharashtra', 'Rajasthan']
    
    for prof in professions:
        print(f"  -> {prof}...")
        for _ in range(25):
            prof_data = {
                "name": fake.name(),
                "profession": prof,
                "city": random.choice(cities),
                "state": random.choice(states),
                "phone": fake.phone_number(),
                "email": fake.email(),
                "visiting_charge_inr": random.randint(500, 2000),
                "rate_per_sqft_inr": random.randint(50, 500),
                "experience_years": random.randint(2, 20),
                "bio": fake.paragraph(nb_sentences=3),
                "rating": round(random.uniform(3.5, 5.0), 1),
                "review_count": random.randint(5, 50),
                "verified": random.choice([True, False])
            }
            try:
                svc.data_client.table("professionals").insert(prof_data).execute()
            except Exception as e:
                pass # Silent skip for duplicate/error during mass seed

    print("Seeding Shop Products...")
    categories = ['Sofas', 'Tables', 'Beds', 'Lighting', 'Decor', 'Storage']
    for cat in categories:
        print(f"  -> {cat}...")
        for i in range(25):
            product_data = {
                "name": f"{fake.word().capitalize()} {cat[:-1]}",
                "price": random.randint(5000, 200000),
                "category": cat,
                "image": f"https://picsum.photos/seed/prod_{cat}_{i}/800/600",
                "description": fake.sentence(nb_words=10),
                "dimensions": f"{random.randint(50, 250)}cm W x {random.randint(50, 100)}cm D x {random.randint(40, 100)}cm H",
                "material": random.choice(['Solid Wood', 'Leather', 'Velvet', 'Marble', 'Steel']),
                "stock": random.randint(1, 20),
                "features": [fake.word() for _ in range(3)]
            }
            try:
                svc.data_client.table("products").insert(product_data).execute()
            except Exception:
                pass

    print("Seeding Furniture Catalog...")
    for cat in categories:
        print(f"  -> {cat}...")
        for i in range(25):
            furniture_data = {
                "name": f"Designer {cat[:-1]} - {fake.word().capitalize()}",
                "category": cat,
                "price": random.randint(2000, 50000),
                "dimensions": {
                    "width": round(random.uniform(0.5, 2.5), 1),
                    "depth": round(random.uniform(0.4, 1.0), 1),
                    "height": round(random.uniform(0.4, 2.0), 1)
                },
                "material": random.choice(['Teak', 'Oak', 'Fabric', 'Glass']),
                "image_url": f"https://picsum.photos/seed/furn_{cat}_{i}/400/400"
            }
            try:
                svc.data_client.table("furniture_items").insert(furniture_data).execute()
            except Exception:
                pass

    print("Seeding complete!")

if __name__ == "__main__":
    seed_supabase()
