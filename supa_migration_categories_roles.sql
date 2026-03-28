-- Create table for Food Categories
CREATE TABLE IF NOT EXISTS food_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Turn on RLS
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read (public) or auth users
CREATE POLICY "Enable read access for all users" ON food_categories FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON food_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON food_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON food_categories FOR DELETE USING (auth.role() = 'authenticated');

-- Seed default Categories
INSERT INTO food_categories (name) VALUES
('KAHVALTI'),
('ÖĞLEN'),
('AKŞAM'),
('ARA ÖĞÜN')
ON CONFLICT (name) DO NOTHING;

-- Create table for Food Roles
CREATE TABLE IF NOT EXISTS food_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Turn on RLS
ALTER TABLE food_roles ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read
CREATE POLICY "Enable read access for all users" ON food_roles FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON food_roles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users" ON food_roles FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users" ON food_roles FOR DELETE USING (auth.role() = 'authenticated');

-- Seed default Roles
INSERT INTO food_roles (key, label) VALUES
('mainDish', 'Ana Yemek'),
('sideDish', 'Yan Yemek'),
('drink', 'İçecek'),
('supplement', 'Ek'),
('snack', 'Atıştırmalık')
ON CONFLICT (key) DO NOTHING;
