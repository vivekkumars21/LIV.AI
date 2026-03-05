const API_BASE = 'http://localhost:8000/api/professionals';

// ─── Types ──────────────────────────────────────────────────

export type ProfessionType =
    | 'interior_designer'
    | 'contractor'
    | 'carpenter'
    | 'painter'
    | 'architect'
    | 'electrician'
    | 'plumber';

export interface Professional {
    id: string;
    name: string;
    profession: ProfessionType;
    city: string;
    state: string;
    phone: string;
    email: string | null;
    visiting_charge_inr: number;
    rate_per_sqft_inr: number;
    experience_years: number;
    bio: string;
    portfolio_images: string[];
    rating: number;
    review_count: number;
    verified: boolean;
    created_at: string;
}

export interface ProfessionalReview {
    id: string;
    professional_id: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface RegisterProfessionalData {
    name: string;
    profession: ProfessionType;
    city: string;
    state: string;
    phone: string;
    email?: string;
    visiting_charge_inr: number;
    rate_per_sqft_inr: number;
    experience_years: number;
    bio?: string;
}

// ─── Profession Labels ──────────────────────────────────────

export const PROFESSION_LABELS: Record<ProfessionType, string> = {
    interior_designer: 'Interior Designer',
    contractor: 'Contractor',
    carpenter: 'Carpenter',
    painter: 'Painter',
    architect: 'Architect',
    electrician: 'Electrician',
    plumber: 'Plumber',
};

// ─── Indian States ──────────────────────────────────────────

export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Puducherry',
];

// ─── CRUD Functions ─────────────────────────────────────────

export async function registerProfessional(data: RegisterProfessionalData): Promise<Professional> {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            city: data.city.trim()
        }),
    });

    if (!res.ok) throw new Error('Registration failed');
    return res.json();
}

export async function searchProfessionalsByCity(
    city: string,
    profession?: ProfessionType,
    sortBy: 'rating' | 'price_low' | 'price_high' | 'experience' = 'rating',
): Promise<Professional[]> {
    const url = new URL(API_BASE);
    url.searchParams.append('city', city);
    if (profession) url.searchParams.append('profession', profession);
    url.searchParams.append('sort_by', sortBy);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Search failed');
    return res.json();
}

export async function getProfessionalById(id: string): Promise<Professional | null> {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) return null;
    return res.json();
}

export async function getAllCities(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/cities/list`);
    if (!res.ok) return [];
    return res.json();
}

export async function addReview(
    professionalId: string,
    reviewerName: string,
    rating: number,
    comment: string,
): Promise<ProfessionalReview> {
    const res = await fetch(`${API_BASE}/${professionalId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reviewer_name: reviewerName,
            rating: Math.min(5, Math.max(1, rating)),
            comment
        }),
    });
    if (!res.ok) throw new Error('Failed to add review');
    return res.json();
}

export async function getReviews(professionalId: string): Promise<ProfessionalReview[]> {
    const res = await fetch(`${API_BASE}/${professionalId}/reviews`);
    if (!res.ok) return [];
    return res.json();
}
