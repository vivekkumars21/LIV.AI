"""
Spatial Reasoning Engine (Python port)
AABB collision detection, 0.6m clearance, grid-based optimal placement,
budget analysis with cheaper alternatives.
"""

from dataclasses import dataclass, field
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# ─── Constants ───────────────────────────────────────────────

MIN_CLEARANCE = 0.6   # metres
GRID_STEP = 0.1       # metres

# ─── Types ───────────────────────────────────────────────────


@dataclass
class RoomData:
    width: float   # metres (x-axis)
    length: float  # metres (y-axis)
    height: float  # metres


@dataclass
class ExistingObject:
    name: str
    x: float      # top-left x
    y: float      # top-left y
    width: float  # along x
    depth: float  # along y


@dataclass
class SelectedObject:
    name: str
    width: float
    depth: float
    height: float
    estimated_cost: float = 0


@dataclass
class Rect:
    x: float
    y: float
    w: float
    h: float


@dataclass
class PlacementResult:
    fits: bool
    recommended_position: dict  # {"x", "y", "rotation_degrees"}
    clearance_ok: bool
    budget_analysis: dict       # {"estimated_cost", "remaining_budget", "suggestions"}
    reasoning: str
    alternatives: Optional[list[dict]] = None

    def to_dict(self) -> dict:
        result = {
            "fits": self.fits,
            "recommended_position": self.recommended_position,
            "clearance_ok": self.clearance_ok,
            "budget_analysis": self.budget_analysis,
            "reasoning": self.reasoning,
        }
        if self.alternatives:
            result["alternatives"] = self.alternatives
        return result


# ─── Alternative Furniture DB ────────────────────────────────

ALTERNATIVES = [
    {"name": "Compact 2-Seater Sofa",       "cost": 18000, "w": 1.4,  "d": 0.75, "h": 0.8,  "styles": ["modern", "minimal"]},
    {"name": "Budget L-Shaped Sofa",         "cost": 25000, "w": 2.0,  "d": 0.85, "h": 0.78, "styles": ["modern", "minimal"]},
    {"name": "Premium L-Shaped Sofa",        "cost": 65000, "w": 2.4,  "d": 0.95, "h": 0.82, "styles": ["modern", "luxury"]},
    {"name": "Classic 3-Seater Sofa",        "cost": 35000, "w": 2.0,  "d": 0.9,  "h": 0.85, "styles": ["traditional", "modern"]},
    {"name": "Foldable Study Desk",          "cost": 5000,  "w": 0.8,  "d": 0.5,  "h": 0.75, "styles": ["minimal", "modern"]},
    {"name": "Executive Office Desk",        "cost": 22000, "w": 1.5,  "d": 0.7,  "h": 0.76, "styles": ["modern", "luxury"]},
    {"name": "Compact Wardrobe",             "cost": 15000, "w": 1.2,  "d": 0.55, "h": 2.0,  "styles": ["modern", "minimal"]},
    {"name": "Queen Bed Frame",              "cost": 28000, "w": 1.6,  "d": 2.0,  "h": 0.45, "styles": ["modern", "minimal"]},
    {"name": "King Bed Frame",               "cost": 42000, "w": 1.9,  "d": 2.1,  "h": 0.5,  "styles": ["modern", "luxury"]},
    {"name": "Round Coffee Table",           "cost": 8000,  "w": 0.8,  "d": 0.8,  "h": 0.45, "styles": ["modern", "minimal"]},
    {"name": "Rectangular Dining Table (4)", "cost": 20000, "w": 1.2,  "d": 0.75, "h": 0.76, "styles": ["modern", "traditional"]},
    {"name": "Rectangular Dining Table (6)", "cost": 35000, "w": 1.8,  "d": 0.9,  "h": 0.76, "styles": ["modern", "traditional", "luxury"]},
    {"name": "Bookshelf",                    "cost": 7000,  "w": 0.8,  "d": 0.3,  "h": 1.8,  "styles": ["modern", "minimal", "traditional"]},
    {"name": "TV Unit",                      "cost": 12000, "w": 1.5,  "d": 0.4,  "h": 0.5,  "styles": ["modern", "minimal"]},
    {"name": "Side Table",                   "cost": 4000,  "w": 0.45, "d": 0.45, "h": 0.55, "styles": ["modern", "minimal", "traditional"]},
    {"name": "Floor Lamp",                   "cost": 3500,  "w": 0.35, "d": 0.35, "h": 1.6,  "styles": ["modern", "minimal", "luxury"]},
]


# ─── Geometry ────────────────────────────────────────────────

def _rects_overlap(a: Rect, b: Rect) -> bool:
    return not (a.x + a.w <= b.x or b.x + b.w <= a.x or a.y + a.h <= b.y or b.y + b.h <= a.y)


def _is_inside_room(r: Rect, room: RoomData) -> bool:
    return r.x >= 0 and r.y >= 0 and r.x + r.w <= room.width and r.y + r.h <= room.length


def _gap_between(a: Rect, b: Rect) -> float:
    h_gap = max(b.x - (a.x + a.w), a.x - (b.x + b.w))
    v_gap = max(b.y - (a.y + a.h), a.y - (b.y + b.h))

    if h_gap >= 0 and v_gap >= 0:
        return (h_gap**2 + v_gap**2) ** 0.5
    if h_gap >= 0:
        return h_gap
    if v_gap >= 0:
        return v_gap
    return -1  # overlapping


def _wall_clearance(a: Rect, room: RoomData) -> float:
    return min(a.x, room.width - (a.x + a.w), a.y, room.length - (a.y + a.h))


def _min_clearance(rect: Rect, room: RoomData, existing: list[Rect]) -> float:
    clr = _wall_clearance(rect, room)
    for er in existing:
        g = _gap_between(rect, er)
        if g < clr:
            clr = g
    return clr


# ─── Cost Estimation ─────────────────────────────────────────

def _estimate_cost(obj: SelectedObject) -> float:
    if obj.estimated_cost > 0:
        return obj.estimated_cost

    volume = obj.width * obj.depth * obj.height
    name = obj.name.lower()

    rates = {
        "sofa": 40000, "couch": 40000,
        "bed": 30000,
        "table": 25000,
        "desk": 20000,
        "wardrobe": 15000, "closet": 15000,
        "lamp": 18000,
        "chair": 22000,
    }

    for key, rate in rates.items():
        if key in name:
            return round(volume * rate)

    return round(volume * 20000)


# ─── Placement Search ───────────────────────────────────────

def _find_best_placement(
    room: RoomData,
    existing: list[Rect],
    obj: SelectedObject,
) -> Optional[dict]:
    best = None
    best_clearance = -1

    for rotated in [False, True]:
        w = obj.depth if rotated else obj.width
        h = obj.width if rotated else obj.depth

        max_x = room.width - w
        max_y = room.length - h
        if max_x < 0 or max_y < 0:
            continue

        x = 0.0
        while x <= max_x + 0.001:
            y = 0.0
            while y <= max_y + 0.001:
                rect = Rect(x, y, w, h)

                collides = False
                for er in existing:
                    if _rects_overlap(rect, er):
                        collides = True
                        break

                if not collides:
                    clr = _min_clearance(rect, room, existing)
                    if clr >= MIN_CLEARANCE and clr > best_clearance:
                        best = {"x": round(x, 1), "y": round(y, 1), "rotated": rotated}
                        best_clearance = clr

                y = round(y + GRID_STEP, 2)
            x = round(x + GRID_STEP, 2)

    if best:
        best["clearance"] = round(best_clearance, 2)
    return best


# ─── Main Function ───────────────────────────────────────────

def evaluate_placement(
    room: RoomData,
    existing_objects: list[ExistingObject],
    selected_object: SelectedObject,
    style: str = "modern",
    budget: float = 100000,
) -> PlacementResult:
    """
    Evaluate whether a furniture item can be placed in a room.
    Returns structured result with position, clearance, and budget analysis.
    """
    reasons = []

    # Height check
    if selected_object.height > room.height:
        return PlacementResult(
            fits=False,
            recommended_position={"x": 0, "y": 0, "rotation_degrees": 0},
            clearance_ok=False,
            budget_analysis={"estimated_cost": 0, "remaining_budget": budget},
            reasoning=f"Object height ({selected_object.height}m) exceeds ceiling ({room.height}m).",
        )

    existing_rects = [Rect(o.x, o.y, o.width, o.depth) for o in existing_objects]

    # Size check
    fits_normal = selected_object.width <= room.width and selected_object.depth <= room.length
    fits_rotated = selected_object.depth <= room.width and selected_object.width <= room.length

    if not fits_normal and not fits_rotated:
        return PlacementResult(
            fits=False,
            recommended_position={"x": 0, "y": 0, "rotation_degrees": 0},
            clearance_ok=False,
            budget_analysis={"estimated_cost": 0, "remaining_budget": budget},
            reasoning=(
                f"Object ({selected_object.width}m × {selected_object.depth}m) is larger "
                f"than room ({room.width}m × {room.length}m) in every orientation."
            ),
        )

    # Find placement
    best = _find_best_placement(room, existing_rects, selected_object)

    if not best:
        return PlacementResult(
            fits=False,
            recommended_position={"x": 0, "y": 0, "rotation_degrees": 0},
            clearance_ok=False,
            budget_analysis={"estimated_cost": 0, "remaining_budget": budget},
            reasoning=(
                f"No valid position with ≥{MIN_CLEARANCE}m clearance in "
                f"{room.width}m × {room.length}m room with {len(existing_objects)} object(s)."
            ),
        )

    # Budget
    cost = _estimate_cost(selected_object)
    remaining = budget - cost
    budget_ok = remaining >= 0
    suggestions = []

    if not budget_ok:
        suggestions.append(
            f"Budget insufficient — ₹{cost:,.0f} needed vs ₹{budget:,.0f} available."
        )
        style_l = style.lower()
        cheaper = [
            a for a in ALTERNATIVES
            if a["cost"] <= budget
            and any(s == style_l or style_l == "any" for s in a["styles"])
            and a["w"] <= room.width
            and a["d"] <= room.length
        ]
        cheaper.sort(key=lambda a: a["cost"], reverse=True)
        for alt in cheaper[:3]:
            suggestions.append(
                f"  • {alt['name']} — ₹{alt['cost']:,.0f} ({alt['w']}m × {alt['d']}m)"
            )

    # Reasoning
    rot_label = "90°" if best["rotated"] else "0°"
    eff_w = selected_object.depth if best["rotated"] else selected_object.width
    eff_d = selected_object.width if best["rotated"] else selected_object.depth
    reasons.append(f"Optimal placement at ({best['x']}, {best['y']}) with {rot_label} rotation.")
    reasons.append(f"Effective footprint: {eff_w:.1f}m × {eff_d:.1f}m.")
    reasons.append(f"Min clearance: {best['clearance']}m (required ≥{MIN_CLEARANCE}m).")
    reasons.append(f"Room area: {room.width * room.length:.1f}m².")

    if budget_ok:
        reasons.append(f"Budget OK — ₹{remaining:,.0f} remaining.")
    else:
        reasons.append(f"Budget shortfall: ₹{abs(remaining):,.0f}.")

    alternatives = None
    if not budget_ok:
        style_l = style.lower()
        alternatives = [
            {
                "name": a["name"],
                "estimatedCost": a["cost"],
                "dimensions": {"width": a["w"], "depth": a["d"], "height": a["h"]},
                "style": a["styles"],
            }
            for a in ALTERNATIVES
            if a["cost"] <= budget and any(s == style_l for s in a["styles"])
        ][:3]

    return PlacementResult(
        fits=True,
        recommended_position={
            "x": best["x"],
            "y": best["y"],
            "rotation_degrees": 90 if best["rotated"] else 0,
        },
        clearance_ok=best["clearance"] >= MIN_CLEARANCE,
        budget_analysis={
            "estimated_cost": cost,
            "remaining_budget": max(remaining, 0),
            "suggestions": suggestions if suggestions else None,
        },
        reasoning=" ".join(reasons),
        alternatives=alternatives,
    )
