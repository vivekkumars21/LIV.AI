export interface Product {
    id: string;
    name: string;
    price: number;
    category: 'Sofas' | 'Tables' | 'Beds' | 'Lighting' | 'Decor' | 'Storage';
    image: string;
    description: string;
    dimensions?: string;
    material?: string;
    stock?: number;
    features?: string[];
}

/**
 * Parse a dimension string like "220cm W x 95cm D x 85cm H" or "100cm x 150cm"
 * into metric values (metres). Returns null if unparseable.
 */
export function parseDimensionsMetric(dim?: string): { width: number; depth: number; height: number } | null {
    if (!dim) return null;

    // Try "NNcm W x NNcm D x NNcm H" format (with optional labels)
    const parts = dim.split(/\s*x\s*/i);

    const extract = (part: string): number | null => {
        const match = part.match(/([\d.]+)\s*cm/i);
        if (match) return parseFloat(match[1]) / 100; // cm → m
        const matchM = part.match(/([\d.]+)\s*m\b/i);
        if (matchM) return parseFloat(matchM[1]);
        return null;
    };

    if (parts.length >= 3) {
        const w = extract(parts[0]);
        const d = extract(parts[1]);
        const h = extract(parts[2]);
        if (w !== null && d !== null && h !== null) return { width: w, depth: d, height: h };
    }

    if (parts.length === 2) {
        const w = extract(parts[0]);
        const h = extract(parts[1]);
        if (w !== null && h !== null) return { width: w, depth: 0.05, height: h }; // flat item (art, rug)
    }

    return null;
}

/**
 * Professional Furniture Catalogue
 * Fetched from Supabase backend.
 */

export const products: Product[] = []; // Initial empty, pages should fetch

export async function fetchProducts(limit: number = 100): Promise<Product[]> {
    try {
        const response = await fetch(`/api/products?limit=${limit}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.error("Failed to fetch products:", err);
        return [];
    }
}

