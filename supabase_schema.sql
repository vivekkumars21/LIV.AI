
-- SQL Schema for Supabase

-- Professionals Table
CREATE TABLE IF NOT EXISTS professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    profession TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    visiting_charge_inr INTEGER DEFAULT 0,
    rate_per_sqft_inr INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 0,
    bio TEXT DEFAULT '',
    portfolio_images TEXT[] DEFAULT '{}',
    rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professional Reviews Table
CREATE TABLE IF NOT EXISTS professional_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table (Shop)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    image TEXT NOT NULL,
    description TEXT,
    dimensions TEXT,
    material TEXT,
    stock INTEGER DEFAULT 0,
    features TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Furniture Items Table (3D Catalog)
CREATE TABLE IF NOT EXISTS furniture_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    model_url TEXT,
    price INTEGER,
    dimensions JSONB NOT NULL, -- { "width": 0.0, "depth": 0.0, "height": 0.0 }
    material TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Projects Table (already exists in backend logic, but here for completeness)
CREATE TABLE IF NOT EXISTS room_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- References auth.users(id)
    name TEXT NOT NULL,
    theme TEXT DEFAULT 'modern',
    room_data JSONB DEFAULT '{}',
    furniture_data JSONB DEFAULT '[]',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Optional, but recommended
-- ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE furniture_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE room_projects ENABLE ROW LEVEL SECURITY;

-- Create policies for room_projects (user isolated)
-- CREATE POLICY "Users can only see their own projects" ON room_projects
--     FOR ALL USING (auth.uid() = user_id);
