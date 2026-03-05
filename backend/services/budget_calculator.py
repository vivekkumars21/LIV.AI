"""
Budget Calculator Service — Real cost estimation for room renovation projects.

Provides actual Indian market pricing for painting, flooring, false ceiling,
and full renovation. Costs are computed per sq ft with quality tiers
and city tier multipliers.
"""

from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)


# ─── Pricing Database (₹ per sq ft) ────────────────────────
# Source: averaged from IndiaMART, UrbanClap, Livspace, and contractor quotes (2024-2025)

PRICING = {
    "painting": {
        "basic":    {"material": 8,   "labor": 6,   "description": "Economy emulsion (1 coat putty + 2 coats paint)"},
        "standard": {"material": 14,  "labor": 8,   "description": "Branded emulsion (2 coat putty + 2 coats, e.g., Asian Paints Tractor)"},
        "premium":  {"material": 22,  "labor": 10,  "description": "Premium finish (Asian Paints Royale / Dulux Velvet Touch)"},
        "luxury":   {"material": 35,  "labor": 14,  "description": "Designer textures / Italian stucco / metallic finish"},
    },
    "flooring": {
        "basic":    {"material": 35,  "labor": 15,  "description": "Ceramic tiles (2x2 ft, basic pattern)"},
        "standard": {"material": 65,  "labor": 20,  "description": "Vitrified tiles (2x2 ft, polished)"},
        "premium":  {"material": 120, "labor": 30,  "description": "Italian marble / large format tiles (4x4 ft)"},
        "luxury":   {"material": 250, "labor": 50,  "description": "Imported marble / hardwood / designer patterns"},
    },
    "false_ceiling": {
        "basic":    {"material": 45,  "labor": 20,  "description": "Plain gypsum board ceiling"},
        "standard": {"material": 75,  "labor": 30,  "description": "Gypsum with cove lighting channels"},
        "premium":  {"material": 110, "labor": 40,  "description": "POP with L-box + LED profiles"},
        "luxury":   {"material": 180, "labor": 60,  "description": "Multi-level designer ceiling with integrated lighting"},
    },
    "full_renovation": {
        "basic":    {"material": 500,  "labor": 300,  "description": "Basic renovation (paint + flooring + electrical)"},
        "standard": {"material": 900,  "labor": 500,  "description": "Standard reno (modular kitchen + wardrobes + flooring + paint)"},
        "premium":  {"material": 1500, "labor": 700,  "description": "Premium reno (full interior with designer elements)"},
        "luxury":   {"material": 2500, "labor": 1200, "description": "Luxury turnkey (imported materials + custom furniture + automation)"},
    },
    "modular_kitchen": {
        "basic":    {"material": 800,  "labor": 300,  "description": "Laminate finish, basic hardware (per sq ft of kitchen area)"},
        "standard": {"material": 1200, "labor": 450,  "description": "Acrylic / membrane finish, Hettich hardware"},
        "premium":  {"material": 1800, "labor": 600,  "description": "PU / lacquer finish, Blum hardware, quartz countertop"},
        "luxury":   {"material": 3000, "labor": 1000, "description": "Italian finish, premium hardware, imported stone countertop"},
    },
    "wardrobe": {
        "basic":    {"material": 600,  "labor": 200,  "description": "Laminate sliding wardrobe (per sq ft of wardrobe face)"},
        "standard": {"material": 900,  "labor": 300,  "description": "Acrylic finish, soft-close channels"},
        "premium":  {"material": 1400, "labor": 450,  "description": "Lacquer finish, internal lighting, accessories"},
        "luxury":   {"material": 2200, "labor": 700,  "description": "Walk-in closet style, premium fittings, mirror panels"},
    },
}

# City tier multipliers
CITY_TIERS = {
    "tier_1": {
        "multiplier": 1.3,
        "cities": ["Mumbai", "Delhi", "Bangalore", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Gurgaon", "Noida"],
    },
    "tier_2": {
        "multiplier": 1.0,
        "cities": ["Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Bhopal", "Surat", "Vadodara", "Nagpur", "Coimbatore", "Kochi", "Vizag"],
    },
    "tier_3": {
        "multiplier": 0.8,
        "cities": ["Smaller cities and towns"],
    },
}


@dataclass
class BudgetLineItem:
    item: str
    material_cost: float
    labor_cost: float
    total: float
    description: str

    def to_dict(self) -> dict:
        return {
            "item": self.item,
            "material_cost": round(self.material_cost),
            "labor_cost": round(self.labor_cost),
            "total": round(self.total),
            "description": self.description,
        }


@dataclass
class BudgetEstimate:
    project_type: str
    quality_tier: str
    area_sqft: float
    city_tier: str
    city_multiplier: float
    material_cost: float
    labor_cost: float
    total_estimate: float
    gst_18_percent: float
    grand_total: float
    breakdown: list[BudgetLineItem]
    savings_tips: list[str]
    price_range: dict  # {"min": ..., "max": ...}

    def to_dict(self) -> dict:
        return {
            "project_type": self.project_type,
            "quality_tier": self.quality_tier,
            "area_sqft": round(self.area_sqft, 1),
            "city_tier": self.city_tier,
            "city_multiplier": self.city_multiplier,
            "material_cost": round(self.material_cost),
            "labor_cost": round(self.labor_cost),
            "total_estimate": round(self.total_estimate),
            "gst_18_percent": round(self.gst_18_percent),
            "grand_total": round(self.grand_total),
            "breakdown": [b.to_dict() for b in self.breakdown],
            "savings_tips": self.savings_tips,
            "price_range": {
                "min": round(self.price_range["min"]),
                "max": round(self.price_range["max"]),
            },
        }


def calculate_budget(
    area_sqft: float,
    project_type: str = "painting",
    quality_tier: str = "standard",
    city_tier: str = "tier_2",
) -> BudgetEstimate:
    """
    Calculate renovation budget based on area, project type, quality, and city.

    Args:
        area_sqft: Room/wall area in square feet
        project_type: One of: painting, flooring, false_ceiling, full_renovation, modular_kitchen, wardrobe
        quality_tier: One of: basic, standard, premium, luxury
        city_tier: One of: tier_1, tier_2, tier_3

    Returns:
        BudgetEstimate with detailed breakdown
    """
    project_type = project_type.lower().replace(" ", "_")
    quality_tier = quality_tier.lower()
    city_tier = city_tier.lower().replace(" ", "_")

    if project_type not in PRICING:
        raise ValueError(f"Unknown project type: {project_type}. Options: {list(PRICING.keys())}")
    if quality_tier not in PRICING[project_type]:
        raise ValueError(f"Unknown quality tier: {quality_tier}. Options: {list(PRICING[project_type].keys())}")
    if city_tier not in CITY_TIERS:
        raise ValueError(f"Unknown city tier: {city_tier}. Options: {list(CITY_TIERS.keys())}")

    rates = PRICING[project_type][quality_tier]
    multiplier = CITY_TIERS[city_tier]["multiplier"]

    material_per_sqft = rates["material"] * multiplier
    labor_per_sqft = rates["labor"] * multiplier

    material_cost = area_sqft * material_per_sqft
    labor_cost = area_sqft * labor_per_sqft
    total = material_cost + labor_cost
    gst = total * 0.18
    grand_total = total + gst

    # Build breakdown
    breakdown = [
        BudgetLineItem(
            item=f"{project_type.replace('_', ' ').title()} — {quality_tier.title()}",
            material_cost=material_cost,
            labor_cost=labor_cost,
            total=total,
            description=rates["description"],
        ),
    ]

    # Compute price range (basic to luxury for this project)
    all_tiers = PRICING[project_type]
    min_rate = all_tiers["basic"]["material"] + all_tiers["basic"]["labor"]
    max_rate = all_tiers["luxury"]["material"] + all_tiers["luxury"]["labor"]
    price_range = {
        "min": area_sqft * min_rate * multiplier,
        "max": area_sqft * max_rate * multiplier,
    }

    # Savings tips
    savings_tips = _generate_savings_tips(project_type, quality_tier, area_sqft, total)

    logger.info(
        f"Budget: {project_type}/{quality_tier}/{city_tier} for {area_sqft} sqft "
        f"= ₹{grand_total:,.0f} (incl. GST)"
    )

    return BudgetEstimate(
        project_type=project_type,
        quality_tier=quality_tier,
        area_sqft=area_sqft,
        city_tier=city_tier,
        city_multiplier=multiplier,
        material_cost=material_cost,
        labor_cost=labor_cost,
        total_estimate=total,
        gst_18_percent=gst,
        grand_total=grand_total,
        breakdown=breakdown,
        savings_tips=savings_tips,
        price_range=price_range,
    )


def _generate_savings_tips(project_type: str, quality: str, area: float, total: float) -> list[str]:
    """Generate contextual savings tips."""
    tips = []

    if quality in ("premium", "luxury"):
        tips.append(f"Switching to 'standard' tier can save up to ₹{total * 0.35:,.0f}")

    if project_type == "painting":
        tips.append("Buy paint during festival season (Diwali/Holi) for 15-20% discounts")
        tips.append("Consider DIY primer coat to save ₹3-5/sqft on labor")
    elif project_type == "flooring":
        tips.append("Buy tiles in bulk for 10-15% dealer discount")
        tips.append("Consider Indian granite instead of imported marble — 40% cheaper, equally durable")
    elif project_type == "false_ceiling":
        tips.append("Plain gypsum with LED strips looks premium at half the cost of POP")
    elif project_type == "full_renovation":
        tips.append("Phase your renovation — do essentials first, cosmetics later")
        tips.append("Get 3+ contractor quotes — prices vary 20-40% in the same city")
    elif project_type == "modular_kitchen":
        tips.append("Opt for laminate instead of acrylic — saves 30% with similar durability")
        tips.append("Standard sizes are cheaper than custom — plan around standard modules")

    if area > 500:
        tips.append(f"For {area:.0f} sqft, negotiate a bulk discount — contractors often offer 5-10% off")

    return tips


def get_available_project_types() -> list[dict]:
    """Return all project types with their descriptions."""
    result = []
    for ptype, tiers in PRICING.items():
        result.append({
            "id": ptype,
            "name": ptype.replace("_", " ").title(),
            "tiers": list(tiers.keys()),
            "descriptions": {tier: info["description"] for tier, info in tiers.items()},
        })
    return result
