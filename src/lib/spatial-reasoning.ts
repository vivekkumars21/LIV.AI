// ============================================================
// AI Interior Spatial Reasoning Engine
// Pure deterministic — no ML dependencies.
// Handles AABB collision, walkable clearance, budget analysis,
// and optimal position search via grid scan.
// ============================================================

// ─── Types ──────────────────────────────────────────────────

export interface RoomData {
    width: number;  // metres (x-axis)
    length: number; // metres (y-axis)
    height: number; // metres
}

export interface ExistingObject {
    name: string;
    x: number;      // top-left x in metres
    y: number;      // top-left y in metres
    width: number;  // metres (along x)
    depth: number;  // metres (along y)
}

export interface SelectedObject {
    name: string;
    width: number;  // metres
    depth: number;  // metres
    height: number; // metres
    estimatedCost?: number; // ₹
}

export interface SpatialInput {
    room: RoomData;
    existingObjects: ExistingObject[];
    selectedObject: SelectedObject;
    style: string;
    budget: number; // ₹
}

export interface SpatialResult {
    fits: boolean;
    recommended_position: {
        x: number;
        y: number;
        rotation_degrees: number;
    };
    clearance_ok: boolean;
    budget_analysis: {
        estimated_cost: number;
        remaining_budget: number;
        suggestions?: string[];
    };
    reasoning: string;
    alternatives?: AlternativeSuggestion[];
}

export interface AlternativeSuggestion {
    name: string;
    estimatedCost: number;
    dimensions: { width: number; depth: number; height: number };
    style: string[];
}

// ─── Constants ──────────────────────────────────────────────

const MIN_CLEARANCE = 0.6; // metres
const GRID_STEP = 0.1;     // metres — resolution for placement search

// ─── Built-in Price / Alternative Table ─────────────────────

const ALTERNATIVE_FURNITURE: AlternativeSuggestion[] = [
    { name: 'Compact 2-Seater Sofa', estimatedCost: 18000, dimensions: { width: 1.4, depth: 0.75, height: 0.8 }, style: ['modern', 'minimal'] },
    { name: 'Budget L-Shaped Sofa', estimatedCost: 25000, dimensions: { width: 2.0, depth: 0.85, height: 0.78 }, style: ['modern', 'minimal'] },
    { name: 'Premium L-Shaped Sofa', estimatedCost: 65000, dimensions: { width: 2.4, depth: 0.95, height: 0.82 }, style: ['modern', 'luxury'] },
    { name: 'Classic 3-Seater Sofa', estimatedCost: 35000, dimensions: { width: 2.0, depth: 0.9, height: 0.85 }, style: ['traditional', 'modern'] },
    { name: 'Foldable Study Desk', estimatedCost: 5000, dimensions: { width: 0.8, depth: 0.5, height: 0.75 }, style: ['minimal', 'modern'] },
    { name: 'Executive Office Desk', estimatedCost: 22000, dimensions: { width: 1.5, depth: 0.7, height: 0.76 }, style: ['modern', 'luxury'] },
    { name: 'Compact Wardrobe', estimatedCost: 15000, dimensions: { width: 1.2, depth: 0.55, height: 2.0 }, style: ['modern', 'minimal'] },
    { name: 'Queen Bed Frame', estimatedCost: 28000, dimensions: { width: 1.6, depth: 2.0, height: 0.45 }, style: ['modern', 'minimal'] },
    { name: 'King Bed Frame', estimatedCost: 42000, dimensions: { width: 1.9, depth: 2.1, height: 0.5 }, style: ['modern', 'luxury'] },
    { name: 'Round Coffee Table', estimatedCost: 8000, dimensions: { width: 0.8, depth: 0.8, height: 0.45 }, style: ['modern', 'minimal'] },
    { name: 'Rectangular Dining Table (4)', estimatedCost: 20000, dimensions: { width: 1.2, depth: 0.75, height: 0.76 }, style: ['modern', 'traditional'] },
    { name: 'Rectangular Dining Table (6)', estimatedCost: 35000, dimensions: { width: 1.8, depth: 0.9, height: 0.76 }, style: ['modern', 'traditional', 'luxury'] },
    { name: 'Bookshelf', estimatedCost: 7000, dimensions: { width: 0.8, depth: 0.3, height: 1.8 }, style: ['modern', 'minimal', 'traditional'] },
    { name: 'TV Unit', estimatedCost: 12000, dimensions: { width: 1.5, depth: 0.4, height: 0.5 }, style: ['modern', 'minimal'] },
    { name: 'Side Table', estimatedCost: 4000, dimensions: { width: 0.45, depth: 0.45, height: 0.55 }, style: ['modern', 'minimal', 'traditional'] },
    { name: 'Floor Lamp', estimatedCost: 3500, dimensions: { width: 0.35, depth: 0.35, height: 1.6 }, style: ['modern', 'minimal', 'luxury'] },
];

// ─── Cost Estimator ─────────────────────────────────────────

function estimateCost(obj: SelectedObject): number {
    if (obj.estimatedCost && obj.estimatedCost > 0) return obj.estimatedCost;

    // Rough heuristic based on volume and name keywords
    const volume = obj.width * obj.depth * obj.height;
    const name = obj.name.toLowerCase();

    if (name.includes('sofa') || name.includes('couch')) return Math.round(volume * 40000);
    if (name.includes('bed')) return Math.round(volume * 30000);
    if (name.includes('table')) return Math.round(volume * 25000);
    if (name.includes('desk')) return Math.round(volume * 20000);
    if (name.includes('wardrobe') || name.includes('closet')) return Math.round(volume * 15000);
    if (name.includes('lamp')) return Math.round(volume * 18000);
    if (name.includes('chair')) return Math.round(volume * 22000);

    return Math.round(volume * 20000); // generic fallback
}

// ─── Geometry Helpers ───────────────────────────────────────

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

function objectToRect(obj: ExistingObject): Rect {
    return { x: obj.x, y: obj.y, w: obj.width, h: obj.depth };
}

function selectedToRect(obj: SelectedObject, x: number, y: number, rotated: boolean): Rect {
    return {
        x,
        y,
        w: rotated ? obj.depth : obj.width,
        h: rotated ? obj.width : obj.depth,
    };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
    return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

function isInsideRoom(r: Rect, room: RoomData): boolean {
    return r.x >= 0 && r.y >= 0 && r.x + r.w <= room.width && r.y + r.h <= room.length;
}

/** Minimum gap between rect `a` and rect `b` across both axes. Returns Infinity if no overlap on either axis independently. */
function gapBetween(a: Rect, b: Rect): number {
    // Horizontal gap
    const hGap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
    // Vertical gap
    const vGap = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));

    if (hGap >= 0 && vGap >= 0) {
        // Diagonal — return Euclidean distance
        return Math.sqrt(hGap * hGap + vGap * vGap);
    }
    if (hGap >= 0) return hGap;
    if (vGap >= 0) return vGap;
    return -1; // overlapping
}

/** Minimum clearance of rect `a` to all walls of the room. */
function wallClearance(a: Rect, room: RoomData): number {
    const left = a.x;
    const right = room.width - (a.x + a.w);
    const top = a.y;
    const bottom = room.length - (a.y + a.h);
    return Math.min(left, right, top, bottom);
}

/** Minimum clearance of a placement to all existing objects AND walls. */
function minClearance(rect: Rect, room: RoomData, existingRects: Rect[]): number {
    let min = wallClearance(rect, room);
    for (const er of existingRects) {
        const g = gapBetween(rect, er);
        if (g < min) min = g;
    }
    return min;
}

// ─── Placement Search ───────────────────────────────────────

interface Candidate {
    x: number;
    y: number;
    rotated: boolean;
    clearance: number;
}

function findBestPlacement(
    room: RoomData,
    existingRects: Rect[],
    obj: SelectedObject,
): Candidate | null {
    let best: Candidate | null = null;

    for (const rotated of [false, true]) {
        const w = rotated ? obj.depth : obj.width;
        const h = rotated ? obj.width : obj.depth;

        // Determine scan limits
        const maxX = room.width - w;
        const maxY = room.length - h;
        if (maxX < 0 || maxY < 0) continue; // doesn't fit even rotationally

        for (let x = 0; x <= maxX + 0.001; x = Math.round((x + GRID_STEP) * 100) / 100) {
            for (let y = 0; y <= maxY + 0.001; y = Math.round((y + GRID_STEP) * 100) / 100) {
                const rect: Rect = { x, y, w, h };

                // Check collisions
                let collides = false;
                for (const er of existingRects) {
                    if (rectsOverlap(rect, er)) { collides = true; break; }
                }
                if (collides) continue;

                const clr = minClearance(rect, room, existingRects);
                if (clr < MIN_CLEARANCE) continue; // insufficient clearance

                if (!best || clr > best.clearance) {
                    best = { x, y, rotated, clearance: clr };
                }
            }
        }
    }

    return best;
}

// ─── Main Evaluate Function ─────────────────────────────────

export function evaluatePlacement(input: SpatialInput): SpatialResult {
    const { room, existingObjects, selectedObject, style, budget } = input;
    const reasons: string[] = [];

    // ── Height check ─────────────
    if (selectedObject.height > room.height) {
        return {
            fits: false,
            recommended_position: { x: 0, y: 0, rotation_degrees: 0 },
            clearance_ok: false,
            budget_analysis: { estimated_cost: 0, remaining_budget: budget },
            reasoning: `Object height (${selectedObject.height}m) exceeds room ceiling height (${room.height}m).`,
        };
    }

    // ── Convert existing objects to rects ─────────────
    const existingRects = existingObjects.map(objectToRect);

    // ── Quick size check ─────────────
    const fitsNormal = selectedObject.width <= room.width && selectedObject.depth <= room.length;
    const fitsRotated = selectedObject.depth <= room.width && selectedObject.width <= room.length;

    if (!fitsNormal && !fitsRotated) {
        return {
            fits: false,
            recommended_position: { x: 0, y: 0, rotation_degrees: 0 },
            clearance_ok: false,
            budget_analysis: { estimated_cost: 0, remaining_budget: budget },
            reasoning: `Object (${selectedObject.width}m × ${selectedObject.depth}m) is larger than the room (${room.width}m × ${room.length}m) in every orientation.`,
        };
    }

    // ── Find best placement ─────────────
    const best = findBestPlacement(room, existingRects, selectedObject);

    if (!best) {
        reasons.push(`No valid position found with ≥${MIN_CLEARANCE}m clearance in a ${room.width}m × ${room.length}m room with ${existingObjects.length} existing object(s).`);
        return {
            fits: false,
            recommended_position: { x: 0, y: 0, rotation_degrees: 0 },
            clearance_ok: false,
            budget_analysis: { estimated_cost: 0, remaining_budget: budget },
            reasoning: reasons.join(' '),
        };
    }

    // ── Budget analysis ─────────────
    const cost = estimateCost(selectedObject);
    const remaining = budget - cost;
    const budgetOk = remaining >= 0;

    const budgetSuggestions: string[] = [];
    if (!budgetOk) {
        budgetSuggestions.push(`Budget insufficient — ₹${cost.toLocaleString('en-IN')} needed vs ₹${budget.toLocaleString('en-IN')} available.`);

        // Find cheaper alternatives that fit
        const styleL = style.toLowerCase();
        const cheaper = ALTERNATIVE_FURNITURE
            .filter(a =>
                a.estimatedCost <= budget &&
                a.style.some(s => s === styleL || styleL === 'any') &&
                a.dimensions.width <= room.width &&
                a.dimensions.depth <= room.length
            )
            .sort((a, b) => b.estimatedCost - a.estimatedCost) // prefer best within budget
            .slice(0, 3);

        if (cheaper.length > 0) {
            budgetSuggestions.push('Consider these alternatives:');
            for (const alt of cheaper) {
                budgetSuggestions.push(`  • ${alt.name} — ₹${alt.estimatedCost.toLocaleString('en-IN')} (${alt.dimensions.width}m × ${alt.dimensions.depth}m)`);
            }
        }
    }

    // ── Reasoning ─────────────
    const rotLabel = best.rotated ? '90°' : '0°';
    const effectiveW = best.rotated ? selectedObject.depth : selectedObject.width;
    const effectiveD = best.rotated ? selectedObject.width : selectedObject.depth;
    reasons.push(`Optimal placement at (${best.x.toFixed(1)}, ${best.y.toFixed(1)}) with ${rotLabel} rotation.`);
    reasons.push(`Effective footprint: ${effectiveW.toFixed(1)}m × ${effectiveD.toFixed(1)}m.`);
    reasons.push(`Minimum clearance: ${best.clearance.toFixed(2)}m (required ≥${MIN_CLEARANCE}m).`);
    reasons.push(`Room utilisation: ${((existingObjects.length + 1) * 0.5).toFixed(0)}+ objects in ${(room.width * room.length).toFixed(1)}m² floor area.`);

    if (!budgetOk) {
        reasons.push(`Budget shortfall: ₹${Math.abs(remaining).toLocaleString('en-IN')}.`);
    } else {
        reasons.push(`Budget OK — ₹${remaining.toLocaleString('en-IN')} remaining.`);
    }

    return {
        fits: true,
        recommended_position: {
            x: Math.round(best.x * 10) / 10,
            y: Math.round(best.y * 10) / 10,
            rotation_degrees: best.rotated ? 90 : 0,
        },
        clearance_ok: best.clearance >= MIN_CLEARANCE,
        budget_analysis: {
            estimated_cost: cost,
            remaining_budget: Math.max(remaining, 0),
            suggestions: budgetSuggestions.length > 0 ? budgetSuggestions : undefined,
        },
        reasoning: reasons.join(' '),
        alternatives: !budgetOk
            ? ALTERNATIVE_FURNITURE
                .filter(a => a.estimatedCost <= budget && a.style.some(s => s === style.toLowerCase()))
                .slice(0, 3)
            : undefined,
    };
}
