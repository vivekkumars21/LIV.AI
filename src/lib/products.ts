export interface Product {
    id: string;
    name: string;
    price: number;
    category: 'Sofas' | 'Tables' | 'Beds' | 'Lighting' | 'Decor';
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

export const products: Product[] = [
    // Sofas
    {
        id: 'sofa-1',
        name: 'Milano Leather Sofa',
        price: 129999,
        category: 'Sofas',
        image: '/images/milano-sofa.png',
        description: 'Premium Italian leather sofa, 3-seater with deep cushioning.',
        dimensions: '220cm W x 95cm D x 85cm H',
        material: 'Full-grain Italian Leather, Solid Wood Frame',
        stock: 5,
        features: ['Hand-stitched details', 'High-density foam', '10-year warranty']
    },
    {
        id: 'sofa-2',
        name: 'Cloud Modular Sectional',
        price: 89999,
        category: 'Sofas',
        image: '/images/cloud-sofa.png',
        description: 'Ultra-soft fabric modular sofa, customizable configuration.',
        dimensions: '280cm W x 100cm D x 70cm H',
        material: 'Performance Linen Blend',
        stock: 12,
        features: ['Stain-resistant fabric', 'Modular components', 'Down-filled cushions']
    },

    // Beds
    {
        id: 'bed-1',
        name: 'Royal Velvet Bed',
        price: 75000,
        category: 'Beds',
        image: '/images/royal-bed.png',
        description: 'King size bed with tufted velvet headboard.',
        dimensions: '190cm W x 210cm L x 120cm H',
        material: 'Plush Velvet, Kiln-dried Hardwood',
        stock: 3,
        features: ['Hand-tufted headboard', 'Solid wood slats', 'Easy assembly']
    },
    {
        id: 'bed-2',
        name: 'Zen Platform Bed',
        price: 45000,
        category: 'Beds',
        image: '/images/zen-bed.png',
        description: 'Minimalist Japanese-style low platform bed in solid oak.',
        dimensions: '185cm W x 205cm L x 30cm H',
        material: 'Solid White Oak',
        stock: 8,
        features: ['No-squeak joinery', 'Eco-friendly finish', 'Floating design']
    },

    // Tables
    {
        id: 'table-1',
        name: 'Marble Dining Table',
        price: 110000,
        category: 'Tables',
        image: '/images/marble-table.png',
        description: 'Solid Carrara marble top dining table, seats 8.',
        dimensions: '240cm L x 100cm W x 76cm H',
        material: 'Italian Carrara Marble, Brushed Steel',
        stock: 2,
        features: ['Sealed marble top', 'Heavy-duty steel base', 'Seats 8-10 people']
    },
    {
        id: 'table-2',
        name: 'Walnut Coffee Table',
        price: 25000,
        category: 'Tables',
        image: '/images/walnut-table.png',
        description: 'Mid-century modern coffee table with organic curves.',
        dimensions: '120cm L x 60cm W x 45cm H',
        material: 'Solid American Walnut',
        stock: 15,
        features: ['Satin finish', 'Rounded edges', 'Integrated storage shelf']
    },

    // Decor
    {
        id: 'decor-1',
        name: 'Abstract Art Piece',
        price: 15000,
        category: 'Decor',
        image: '/images/abstract-art.png',
        description: 'Large canvas print, abstract expressionist style.',
        dimensions: '100cm x 150cm',
        material: 'Canvas with Wood Frame',
        stock: 20,
        features: ['Gallery wrap', 'Fade-resistant ink', 'Ready to hang']
    }
];
