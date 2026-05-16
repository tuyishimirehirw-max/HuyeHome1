-- Supabase Schema for Huye Homes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties table
CREATE TABLE public.properties (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('residential_land', 'agricultural_land', 'student_housing', 'commercial')),
    listing_type VARCHAR(20) DEFAULT 'sale' CHECK (listing_type IN ('sale', 'rent')),
    price DECIMAL(15, 2) NOT NULL,
    price_period VARCHAR(20) DEFAULT 'one-time',
    location VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    size DECIMAL(10, 2),
    size_unit VARCHAR(10) DEFAULT 'sqm',
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status VARCHAR(20) DEFAULT 'available',
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Property images (using Supabase Storage)
CREATE TABLE public.property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES public.properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Features
CREATE TABLE public.features (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    icon_class VARCHAR(50)
);

-- Property features junction
CREATE TABLE public.property_features (
    property_id INTEGER REFERENCES public.properties(id) ON DELETE CASCADE,
    feature_id INTEGER REFERENCES public.features(id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, feature_id)
);

-- Inquiries
CREATE TABLE public.inquiries (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES public.properties(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site settings
CREATE TABLE public.site_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'text',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default features
INSERT INTO public.features (name, icon_class) VALUES
('Tarmac Access', 'fa-road'),
('Water Available', 'fa-water'),
('Electricity', 'fa-bolt'),
('WiFi', 'fa-wifi'),
('Near Campus', 'fa-graduation-cap'),
('Hilltop View', 'fa-mountain'),
('Fenced', 'fa-fence'),
('Security', 'fa-shield-alt'),
('Parking', 'fa-parking'),
('Furnished', 'fa-couch');

-- Insert default settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('site_name', 'Huye Homes'),
('site_description', 'Premium Real Estate & Student Housing in Huye, Rwanda'),
('contact_phone', '+250 783 710 461'),
('contact_email', 'info@huyehomes.rw'),
('office_address', 'Huye City Center, Southern Province, Rwanda'),
('whatsapp_number', '250783710461');

-- Create indexes
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_featured ON public.properties(is_featured);
CREATE INDEX idx_properties_slug ON public.properties(slug);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public can view available properties
CREATE POLICY "Public can view available properties" ON public.properties
    FOR SELECT USING (status = 'available');

-- Public can create inquiries
CREATE POLICY "Public can create inquiries" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Admin full access (handled by service role)