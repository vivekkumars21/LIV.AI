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
 * Fetched from Supabase backend with local fallback.
 */

export const fallbackProducts: Product[] = [

    // Sofas
    { id: "s1", name: "Cloud Modular Sofa", category: "Sofas", price: 125000, image: "https://images.unsplash.com/photo-1493663010355-6b624d853167?auto=format&fit=crop&w=800&q=80", description: "Ultra-soft modular sofa with stain-resistant fabric.", dimensions: "280cm W x 100cm D x 80cm H", material: "Performance Linen", stock: 12, features: ["Modular Design", "Stain Resistant", "Eco-friendly"] },
    { id: "s2", name: "Nordic Sectional", category: "Sofas", price: 95000, image: "https://images.unsplash.com/photo-1555041469-a586c8c33a7e?auto=format&fit=crop&w=800&q=80", description: "Minimalist sectional perfect for modern living rooms.", dimensions: "240cm W x 90cm D x 85cm H", material: "Cotton Blend", stock: 8, features: ["Removable Covers"] },
    { id: "s3", name: "Velvet Chesterfield", category: "Sofas", price: 155000, image: "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=800&q=80", description: "Classic chesterfield sofa in deep emerald velvet.", dimensions: "210cm W x 95cm D x 75cm H", material: "Velvet", stock: 3, features: ["Tufted Back", "Solid Wood Frame"] },
    { id: "s4", name: "Linen Loveseat", category: "Sofas", price: 65000, image: "https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=800&q=80", description: "Compact two-seater for smaller spaces.", dimensions: "160cm W x 85cm D x 80cm H", material: "Linen", stock: 15, features: ["Compact", "Breathable Fabric"] },
    { id: "s5", name: "Leather Recliner Sofa", category: "Sofas", price: 185000, image: "https://images.unsplash.com/photo-1484101403033-57105e2b77ca?auto=format&fit=crop&w=800&q=80", description: "Premium leather sofa with dual power recliners.", dimensions: "220cm W x 100cm D x 95cm H", material: "Top Grain Leather", stock: 5, features: ["Power Recline", "USB Ports"] },
    { id: "s6", name: "Futon Sleeper Sofa", category: "Sofas", price: 45000, image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80", description: "Versatile sofa that converts into a comfortable bed.", dimensions: "200cm W x 90cm D x 85cm H", material: "Microfiber", stock: 20, features: ["Convertible", "Storage Drawer"] },
    { id: "s7", name: "Designer Velvet Chair", category: "Sofas", price: 55000, image: "https://images.unsplash.com/photo-1583847268964-b28dc29ef4a3?auto=format&fit=crop&w=800&q=80", description: "Elegant accent chair set in rich velvet with gold legs.", dimensions: "85cm W x 80cm D x 90cm H", material: "Velvet & Steel", stock: 10, features: ["Accent Piece", "Luxury Gold Legs"] },

    // Tables
    { id: "t1", name: "Kyoto Dining Table", category: "Tables", price: 85000, image: "https://images.unsplash.com/photo-1530099486328-2c211713ad51?auto=format&fit=crop&w=800&q=80", description: "Minimalist Japanese-inspired dining table in solid walnut.", dimensions: "200cm W x 90cm D x 75cm H", material: "Solid Walnut", stock: 5, features: ["Solid Wood", "Hand-finished"] },
    { id: "t2", name: "Glass Coffee Table", category: "Tables", price: 25000, image: "https://images.unsplash.com/photo-1577140917449-74b47c8d5b7c?auto=format&fit=crop&w=800&q=80", description: "Modern coffee table with tempered glass top.", dimensions: "120cm W x 60cm D x 45cm H", material: "Glass & Steel", stock: 18, features: ["Tempered Glass", "Minimalist"] },
    { id: "t3", name: "Rustic Farmhouse Table", category: "Tables", price: 65000, image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80", description: "Sturdy dining table made from reclaimed wood.", dimensions: "240cm W x 100cm D x 76cm H", material: "Reclaimed Wood", stock: 4, features: ["Eco-friendly", "Durable"] },
    { id: "t4", name: "Marble Side Table", category: "Tables", price: 18000, image: "https://images.unsplash.com/photo-1538688593333-f119097e415c?auto=format&fit=crop&w=800&q=80", description: "Elegant side table with a genuine marble top.", dimensions: "50cm W x 50cm D x 55cm H", material: "Marble & Brass", stock: 25, features: ["Genuine Marble", "Brass Finish"] },
    { id: "t5", name: "Extendable Dining Table", category: "Tables", price: 95000, image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80", description: "Smart dining table that seats 6 to 10 people.", dimensions: "180-260cm W x 90cm D x 75cm H", material: "Oak Veneer", stock: 7, features: ["Extendable", "Space Saving"] },
    { id: "t6", name: "Industrial Desk", category: "Tables", price: 32000, image: "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80", description: "Workspace desk with iron legs and wood top.", dimensions: "140cm W x 70cm D x 75cm H", material: "Iron & Mango Wood", stock: 12, features: ["Cable Management"] },
    { id: "t7", name: "Round Bistro Table", category: "Tables", price: 15000, image: "https://images.unsplash.com/photo-1554295405-abb8fd54f153?auto=format&fit=crop&w=800&q=80", description: "Compact round table for cozy breakfast nooks.", dimensions: "80cm Diameter x 75cm H", material: "Oak", stock: 15, features: ["Compact", "Round Top"] },

    // Beds
    { id: "b1", name: "Serene Platform Bed", category: "Beds", price: 65000, image: "https://images.unsplash.com/photo-1505691938895-1758d7f4f102?auto=format&fit=crop&w=800&q=80", description: "Low-profile platform bed with integrated nightstands.", dimensions: "220cm W x 210cm D x 90cm H", material: "Oak Veneer", stock: 8, features: ["Low Profile", "Modern"] },
    { id: "b2", name: "Upholstered King Bed", category: "Beds", price: 85000, image: "https://images.unsplash.com/photo-1505693415918-b7c928243f6a?auto=format&fit=crop&w=800&q=80", description: "Luxurious king bed with tufted headboard.", dimensions: "210cm W x 220cm D x 120cm H", material: "Velvet & Wood", stock: 6, features: ["Tufted Headboard"] },
    { id: "b3", name: "Storage Queen Bed", category: "Beds", price: 75000, image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80", description: "Queen bed featuring four large storage drawers.", dimensions: "160cm W x 210cm D x 100cm H", material: "Engineered Wood", stock: 10, features: ["Under-bed Storage"] },
    { id: "b4", name: "Canopy Bed Frame", category: "Beds", price: 95000, image: "https://images.unsplash.com/photo-1617325258281-99d45396655c?auto=format&fit=crop&w=800&q=80", description: "Minimalist steel canopy bed frame.", dimensions: "190cm W x 210cm D x 200cm H", material: "Steel", stock: 4, features: ["Canopy Design", "Sturdy"] },
    { id: "b5", name: "Minimalist Wood Bed", category: "Beds", price: 45000, image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?auto=format&fit=crop&w=800&q=80", description: "Simple and elegant solid pine wood bed.", dimensions: "150cm W x 200cm D x 85cm H", material: "Pine Wood", stock: 15, features: ["Easy Assembly"] },
    { id: "b6", name: "Kids Bunk Bed", category: "Beds", price: 55000, image: "https://images.unsplash.com/photo-1560185123-184122d56cdd?auto=format&fit=crop&w=800&q=80", description: "Safe and fun bunk bed with built-in ladder.", dimensions: "100cm W x 200cm D x 160cm H", material: "Birch Wood", stock: 7, features: ["Safety Rails", "Space Saving"] },
    { id: "b7", name: "Velvet Daybed", category: "Beds", price: 38000, image: "https://images.unsplash.com/photo-1560184128-20455a59948a?auto=format&fit=crop&w=800&q=80", description: "Versatile daybed for lounging or sleeping guests.", dimensions: "200cm W x 95cm D x 80cm H", material: "Velvet", stock: 5, features: ["Versatile", "Compact"] },

    // Lighting
    { id: "l1", name: "Eclipse Floor Lamp", category: "Lighting", price: 28000, image: "https://images.unsplash.com/photo-1513506003971-f69a206ca2a2?auto=format&fit=crop&w=800&q=80", description: "Sculptural floor lamp providing soft, indirect light.", dimensions: "40cm x 160cm", material: "Powder-coated Steel", stock: 15, features: ["Dimmable", "LED"] },
    { id: "l2", name: "Brass Pendant Light", category: "Lighting", price: 12000, image: "https://images.unsplash.com/photo-1534073828943-f801091bb2a6?auto=format&fit=crop&w=800&q=80", description: "Industrial style brass pendant light for dining areas.", dimensions: "30cm D x 40cm H", material: "Brass", stock: 20, features: ["Adjustable Height"] },
    { id: "l3", name: "Minimalist Table Lamp", category: "Lighting", price: 6500, image: "https://images.unsplash.com/photo-1542728928-1413eeae4a5e?auto=format&fit=crop&w=800&q=80", description: "Perfect bedside or desk lamp with touch control.", dimensions: "20cm D x 45cm H", material: "Ceramic", stock: 30, features: ["Touch Control", "3 Brightness Levels"] },
    { id: "l4", name: "Arc Floor Lamp", category: "Lighting", price: 35000, image: "https://images.unsplash.com/photo-1507473885765-e6ed657f71ad?auto=format&fit=crop&w=800&q=80", description: "Oversized arc lamp ideal for reading nooks.", dimensions: "120cm W x 200cm H", material: "Steel & Marble", stock: 8, features: ["Heavy Marble Base"] },
    { id: "l5", name: "Rattan Chandelier", category: "Lighting", price: 18000, image: "https://images.unsplash.com/photo-1532914449714-721435198a22?auto=format&fit=crop&w=800&q=80", description: "Boho-chic woven rattan chandelier.", dimensions: "50cm D x 50cm H", material: "Rattan", stock: 12, features: ["Handwoven"] },
    { id: "l6", name: "Geometric Wall Sconce", category: "Lighting", price: 8500, image: "https://images.unsplash.com/photo-1506489834479-00bd3f7b60bc?auto=format&fit=crop&w=800&q=80", description: "Modern wall sconce for hallways and accents.", dimensions: "15cm W x 30cm H", material: "Aluminum", stock: 25, features: ["Up/Down Lighting"] },
    { id: "l7", name: "Crystal Chandelier", category: "Lighting", price: 45000, image: "https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?auto=format&fit=crop&w=800&q=80", description: "Grand crystal chandelier for high ceilings.", dimensions: "80cm D x 100cm H", material: "Crystal & Chrome", stock: 3, features: ["Luxury", "Dimmable"] },

    // Decor
    { id: "d1", name: "Artisan Glass Vase", category: "Decor", price: 4500, image: "https://images.unsplash.com/photo-1581783898377-1c85bf9014ba?auto=format&fit=crop&w=800&q=80", description: "Hand-blown glass vase with subtle amber gradient.", dimensions: "20cm x 35cm", material: "Blown Glass", stock: 45, features: ["Handmade"] },
    { id: "d2", name: "Abstract Canvas Print", category: "Decor", price: 12500, image: "https://images.unsplash.com/photo-1578321272101-38174709f1a4?auto=format&fit=crop&w=800&q=80", description: "Large abstract wall art in neutral tones.", dimensions: "100cm W x 150cm H", material: "Canvas & Wood", stock: 15, features: ["Gallery Wrapped"] },
    { id: "d3", name: "Textured Throw Pillow", category: "Decor", price: 2500, image: "https://images.unsplash.com/photo-1579743454223-1a2f602410a8?auto=format&fit=crop&w=800&q=80", description: "Soft decorative pillow with geometric tufting.", dimensions: "45cm x 45cm", material: "Cotton", stock: 60, features: ["Machine Washable Cover"] },
    { id: "d4", name: "Round Wall Mirror", category: "Decor", price: 15000, image: "https://images.unsplash.com/photo-1513519245088-0e1290d45a28?auto=format&fit=crop&w=800&q=80", description: "Large round mirror with slim brass frame.", dimensions: "80cm Diameter", material: "Glass & Brass", stock: 20, features: ["Anti-fog", "Shatterproof"] },
    { id: "d5", name: "Woven Wool Rug", category: "Decor", price: 28000, image: "https://images.unsplash.com/photo-1531835551843-2082d46e2570?auto=format&fit=crop&w=800&q=80", description: "Handwoven wool area rug with fringed edges.", dimensions: "200cm x 300cm", material: "100% Wool", stock: 10, features: ["Handwoven", "Soft Underfoot"] },
    { id: "d6", name: "Ceramic Planter Set", category: "Decor", price: 5500, image: "https://images.unsplash.com/photo-1485955900182-5635bdeea23c?auto=format&fit=crop&w=800&q=80", description: "Set of 3 minimalist ceramic planters.", dimensions: "Varies", material: "Ceramic", stock: 35, features: ["Drainage Holes", "Set of 3"] },
    { id: "d7", name: "Brass Sculptural Object", category: "Decor", price: 3200, image: "https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=800&q=80", description: "Modern abstract sculpture in polished brass.", dimensions: "15cm x 20cm", material: "Brass", stock: 20, features: ["Accent Piece"] },

    // Storage
    { id: "st1", name: "Brutalist Sideboard", category: "Storage", price: 75000, image: "https://images.unsplash.com/photo-1595428774233-1db0a5fa4e6a?auto=format&fit=crop&w=800&q=80", description: "Heavy-duty sideboard with textured wood front panels.", dimensions: "160cm W x 45cm D x 85cm H", material: "Black Ash", stock: 3, features: ["Ample Storage", "Soft-close Doors"] },
    { id: "st2", name: "Modular Bookshelf", category: "Storage", price: 45000, image: "https://images.unsplash.com/photo-1594620302257-230009c855a9?auto=format&fit=crop&w=800&q=80", description: "Customizable shelving unit for books and display.", dimensions: "120cm W x 35cm D x 180cm H", material: "Steel & Walnut", stock: 8, features: ["Adjustable Shelves"] },
    { id: "st3", name: "Rattan Wardrobe", category: "Storage", price: 95000, image: "https://images.unsplash.com/photo-1556020682736-22458d45aa53?auto=format&fit=crop&w=800&q=80", description: "Spacious wardrobe with cane webbing doors.", dimensions: "100cm W x 60cm D x 200cm H", material: "Ash Wood & Rattan", stock: 5, features: ["Hanging Rail", "Internal Drawers"] },
    { id: "st4", name: "Floating TV Unit", category: "Storage", price: 25000, image: "https://images.unsplash.com/photo-1615873968403-89e068628265?auto=format&fit=crop&w=800&q=80", description: "Wall-mounted media console for a clean look.", dimensions: "180cm W x 40cm D x 30cm H", material: "MDF with Veneer", stock: 12, features: ["Cable Management", "Wall Mounted"] },
    { id: "st5", name: "Mid-Century Dresser", category: "Storage", price: 65000, image: "https://images.unsplash.com/photo-1591129080774-7af5cce877aa?auto=format&fit=crop&w=800&q=80", description: "Six-drawer dresser with brass hardware.", dimensions: "140cm W x 45cm D x 80cm H", material: "Solid Wood", stock: 7, features: ["Dovetail Drawers"] },
    { id: "st6", name: "Entryway Bench & Shoe Rack", category: "Storage", price: 18000, image: "https://images.unsplash.com/photo-1616486338564-9eeed624a159?auto=format&fit=crop&w=800&q=80", description: "Convenient bench with built-in shoe storage.", dimensions: "100cm W x 35cm D x 45cm H", material: "Bamboo", stock: 20, features: ["Cushioned Top"] },
    { id: "st7", name: "Tall Kitchen Pantry", category: "Storage", price: 52000, image: "https://images.unsplash.com/photo-1617098900588-ef20317b6ca0?auto=format&fit=crop&w=800&q=80", description: "Spacious pantry with adjustable shelving and spice racks.", dimensions: "80cm W x 50cm D x 210cm H", material: "Engineered Wood", stock: 6, features: ["Adjustable Shelves", "High Capacity"] },

];

export const products: Product[] = fallbackProducts;

export async function fetchProducts(limit: number = 100): Promise<Product[]> {
    try {
        const response = await fetch(`/api/python/products?limit=${limit}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            // Merge API results with local fallback (local takes priority)
            const localNames = new Set(fallbackProducts.map(p => p.name.toLowerCase()));
            const apiOnly = (data as Product[]).filter(p => !localNames.has(p.name.toLowerCase()));
            return [...fallbackProducts, ...apiOnly];
        }
        return fallbackProducts;
    } catch (err) {
        console.warn("Backend unavailable, using local fallback products.");
        return fallbackProducts;
    }
}

