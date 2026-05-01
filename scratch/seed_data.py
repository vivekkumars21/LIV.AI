
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parents[1]))

load_dotenv(dotenv_path='.env.local')

from backend.services.supabase_service import SupabaseService

def seed_data():
    svc = SupabaseService.from_env()
    if not svc:
        print("Failed to initialize SupabaseService")
        return

    # 1. Seed Professionals
    professionals = [
        {"name": "Aarav Sharma", "profession": "architect", "city": "Mumbai", "state": "Maharashtra", "phone": "+91 98765 43210", "email": "aarav.s@designstudio.com", "visiting_charge_inr": 2000, "rate_per_sqft_inr": 150, "experience_years": 12, "bio": "Specializing in modern sustainable architecture.", "rating": 4.8, "review_count": 45, "verified": True},
        {"name": "Ishani Gupta", "profession": "interior_designer", "city": "Delhi", "state": "Delhi", "phone": "+91 98234 56789", "email": "ishani.g@interiors.in", "visiting_charge_inr": 1500, "rate_per_sqft_inr": 200, "experience_years": 8, "bio": "Luxury residential interiors with contemporary Indian aesthetics.", "rating": 4.9, "review_count": 32, "verified": True},
        {"name": "Rohan Mehra", "profession": "electrician", "city": "Bangalore", "state": "Karnataka", "phone": "+91 97654 32109", "email": "rohan.light@glow.com", "visiting_charge_inr": 1000, "rate_per_sqft_inr": 50, "experience_years": 10, "bio": "Expert in architectural lighting and smart home integration.", "rating": 4.7, "review_count": 28, "verified": True},
        {"name": "Meera Patel", "profession": "interior_designer", "city": "Ahmedabad", "state": "Gujarat", "phone": "+91 99887 76655", "email": "meera.patel@designhub.com", "visiting_charge_inr": 1200, "rate_per_sqft_inr": 120, "experience_years": 6, "bio": "Passionate about minimalist designs.", "rating": 4.6, "review_count": 15, "verified": False},
        {"name": "Vikram Singh", "profession": "architect", "city": "Jaipur", "state": "Rajasthan", "phone": "+91 94140 12345", "email": "vikram.s@royalarch.com", "visiting_charge_inr": 2500, "rate_per_sqft_inr": 180, "experience_years": 15, "bio": "Preserving heritage through modern techniques.", "rating": 4.9, "review_count": 56, "verified": True},
        {"name": "Ananya Reddy", "profession": "interior_designer", "city": "Hyderabad", "state": "Telangana", "phone": "+91 95000 11223", "email": "ananya.r@greeneries.com", "visiting_charge_inr": 1800, "rate_per_sqft_inr": 80, "experience_years": 7, "bio": "Creating sustainable urban gardens and rooftop oases.", "rating": 4.5, "review_count": 12, "verified": True},
        {"name": "Kabir Malhotra", "profession": "carpenter", "city": "Chandigarh", "state": "Punjab", "phone": "+91 98123 45670", "email": "kabir@bespokewood.com", "visiting_charge_inr": 3000, "rate_per_sqft_inr": 0, "experience_years": 20, "bio": "Master craftsman specializing in teak and rosewood furniture.", "rating": 5.0, "review_count": 89, "verified": True},
        {"name": "Zara Khan", "profession": "interior_designer", "city": "Pune", "state": "Maharashtra", "phone": "+91 97300 44556", "email": "zara.k@modernliving.com", "visiting_charge_inr": 1000, "rate_per_sqft_inr": 150, "experience_years": 4, "bio": "Young designer focused on affordable yet chic home makeovers.", "rating": 4.4, "review_count": 8, "verified": False},
        {"name": "Arjun Verma", "profession": "contractor", "city": "Lucknow", "state": "Uttar Pradesh", "phone": "+91 94500 66778", "email": "arjun.v@buildstrong.in", "visiting_charge_inr": 1500, "rate_per_sqft_inr": 40, "experience_years": 11, "bio": "Ensuring structural integrity for high-rise projects.", "rating": 4.7, "review_count": 41, "verified": True},
        {"name": "Diya Iyer", "profession": "interior_designer", "city": "Chennai", "state": "Tamil Nadu", "phone": "+91 98400 99887", "email": "diya.iyer@decorly.com", "visiting_charge_inr": 1600, "rate_per_sqft_inr": 175, "experience_years": 9, "bio": "Specializing in traditional South Indian interiors.", "rating": 4.8, "review_count": 27, "verified": True},
        {"name": "Rajesh Khanna", "profession": "plumber", "city": "Mumbai", "state": "Maharashtra", "phone": "+91 98222 11100", "email": "rajesh.flow@service.com", "visiting_charge_inr": 500, "rate_per_sqft_inr": 0, "experience_years": 18, "bio": "Expert in high-end bathroom fittings and leak detection.", "rating": 4.6, "review_count": 62, "verified": True},
        {"name": "Sanya Mirza", "profession": "painter", "city": "Delhi", "state": "Delhi", "phone": "+91 98777 66655", "email": "sanya.walls@art.in", "visiting_charge_inr": 800, "rate_per_sqft_inr": 25, "experience_years": 5, "bio": "Specialist in texture painting and royal play designs.", "rating": 4.7, "review_count": 19, "verified": True}
    ]

    # 2. Seed Furniture Items (3D Catalog)
    furniture = [
        {"name": "Nordic Oak Bed", "category": "Beds", "price": 45000, "dimensions": {"width": 1.8, "depth": 2.1, "height": 1.0}, "material": "Solid White Oak", "image_url": "https://images.unsplash.com/photo-1505693419148-ad3097f9e3ac?q=80&w=400"},
        {"name": "Velvet Accent Chair", "category": "Sofas", "price": 18000, "dimensions": {"width": 0.8, "depth": 0.75, "height": 0.85}, "material": "Velvet, Birch Wood", "image_url": "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=400"},
        {"name": "Industrial Coffee Table", "category": "Tables", "price": 12000, "dimensions": {"width": 1.2, "depth": 0.6, "height": 0.45}, "material": "Reclaimed Wood, Steel", "image_url": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=400"},
        {"name": "Modern Pendant Light", "category": "Lighting", "price": 8500, "dimensions": {"width": 0.4, "depth": 0.4, "height": 0.6}, "material": "Frosted Glass, Brass", "image_url": "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=400"},
        {"name": "Minimalist Bookshelf", "category": "Storage", "price": 15000, "dimensions": {"width": 0.9, "depth": 0.3, "height": 1.8}, "material": "MDF, Metal Frame", "image_url": "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=400"},
        {"name": "Ergonomic Desk Chair", "category": "Office", "price": 22000, "dimensions": {"width": 0.65, "depth": 0.65, "height": 1.1}, "material": "Mesh, Recycled Plastic", "image_url": "https://images.unsplash.com/photo-1505797149-43b0069ec26b?q=80&w=400"},
        {"name": "Bohemian Area Rug", "category": "Decor", "price": 9000, "dimensions": {"width": 1.5, "depth": 2.4, "height": 0.02}, "material": "Natural Jute", "image_url": "https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?q=80&w=400"},
        {"name": "Marble Side Table", "category": "Tables", "price": 7000, "dimensions": {"width": 0.45, "depth": 0.45, "height": 0.55}, "material": "Carrara Marble, Iron", "image_url": "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?q=80&w=400"},
        {"name": "Leather Recliner", "category": "Sofas", "price": 35000, "dimensions": {"width": 1.0, "depth": 1.1, "height": 1.0}, "material": "Top-grain Leather", "image_url": "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=400"},
        {"name": "Geometric Wall Mirror", "category": "Decor", "price": 5500, "dimensions": {"width": 0.8, "depth": 0.05, "height": 0.8}, "material": "Glass, Gold-finished Steel", "image_url": "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=400"}
    ]

    # 3. Seed Products (Shop)
    products = [
        {"name": "Cloud Modular Sofa", "category": "Sofas", "price": 125000, "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800", "description": "Ultra-soft modular sofa with stain-resistant fabric.", "dimensions": "280cm W x 100cm D x 80cm H", "material": "Performance Linen", "stock": 12, "features": ["Modular Design", "Stain Resistant", "Eco-friendly"]},
        {"name": "Kyoto Dining Table", "category": "Tables", "price": 85000, "image": "https://images.unsplash.com/photo-1577140917170-285929fb55b7?q=80&w=800", "description": "Minimalist Japanese-inspired dining table in solid walnut.", "dimensions": "200cm W x 90cm D x 75cm H", "material": "Solid Walnut", "stock": 5, "features": ["Solid Wood", "Hand-finished"]},
        {"name": "Serene Platform Bed", "category": "Beds", "price": 65000, "image": "https://images.unsplash.com/photo-1505693419148-ad3097f9e3ac?q=80&w=800", "description": "Low-profile platform bed with integrated nightstands.", "dimensions": "220cm W x 210cm D x 90cm H", "material": "Oak Veneer", "stock": 8, "features": ["Low Profile", "Modern"]},
        {"name": "Artisan Glass Vase", "category": "Decor", "price": 4500, "image": "https://images.unsplash.com/photo-1581781870027-04212e231e96?q=80&w=800", "description": "Hand-blown glass vase with subtle amber gradient.", "dimensions": "20cm x 35cm", "material": "Blown Glass", "stock": 45, "features": ["Handmade"]},
        {"name": "Eclipse Floor Lamp", "category": "Lighting", "price": 28000, "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800", "description": "Sculptural floor lamp providing soft, indirect light.", "dimensions": "40cm x 160cm", "material": "Powder-coated Steel", "stock": 15, "features": ["Dimmable", "LED"]},
        {"name": "Brutalist Sideboard", "category": "Storage", "price": 75000, "image": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=800", "description": "Heavy-duty sideboard with textured wood front panels.", "dimensions": "160cm W x 45cm D x 85cm H", "material": "Black Ash", "stock": 3, "features": ["Ample Storage", "Soft-close Doors"]},
        {"name": "Terracotta Lounge Chair", "category": "Sofas", "price": 42000, "image": "https://images.unsplash.com/photo-1567016432779-094069958ea5?q=80&w=800", "description": "Mid-century modern lounge chair in earthy terracotta fabric.", "dimensions": "85cm W x 80cm D x 85cm H", "material": "Wool Blend", "stock": 20, "features": ["Ergonomic", "Tapered Legs"]},
        {"name": "Symmetry Coffee Table", "category": "Tables", "price": 32000, "image": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800", "description": "Round coffee table with intersecting metal base.", "dimensions": "100cm Diameter x 40cm H", "material": "Glass, Steel", "stock": 10, "features": ["Tempered Glass", "Sturdy Base"]},
        {"name": "Linen Blackout Curtains", "category": "Decor", "price": 8500, "image": "https://images.unsplash.com/photo-1514810759048-2b5d9fe58fd8?q=80&w=800", "description": "Heavyweight linen curtains with thermal lining.", "dimensions": "140cm x 250cm", "material": "Pure Linen", "stock": 100, "features": ["Blackout", "Thermal Insulation"]},
        {"name": "Floating Oak Shelves", "category": "Storage", "price": 6500, "image": "https://images.unsplash.com/photo-1594620302200-9a762244a156?q=80&w=800", "description": "Set of 3 floating shelves in solid oak.", "dimensions": "80cm x 20cm", "material": "Solid Oak", "stock": 30, "features": ["Easy Install", "Hidden Brackets"]}
    ]

    print(f"Cleaning existing data...")
    try:
        # We don't delete to avoid breaking relationships if any, but insert will work if no unique constraints conflict.
        # Actually, let's just insert.
        pass
    except: pass

    print("Seeding 'professionals'...")
    try:
        res = svc.data_client.table("professionals").insert(professionals).execute()
        print(f"Inserted {len(res.data)} professionals.")
    except Exception as e:
        print(f"Error seeding professionals: {e}")

    print("Seeding 'furniture_items'...")
    try:
        res = svc.data_client.table("furniture_items").insert(furniture).execute()
        print(f"Inserted {len(res.data)} furniture items.")
    except Exception as e:
        print(f"Error seeding furniture: {e}")

    print("Seeding 'products'...")
    try:
        res = svc.data_client.table("products").insert(products).execute()
        print(f"Inserted {len(res.data)} products.")
    except Exception as e:
        print(f"Error seeding products: {e}")

if __name__ == "__main__":
    seed_data()
