-- ================================================
-- Diet Editor - Schema Update V13 (Patient Data & Calc)
-- Extended patient profile, diet types, weekly settings
-- ================================================

-- 1. Updates to 'patients' table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS height NUMERIC, -- cm
ADD COLUMN IF NOT EXISTS weight NUMERIC, -- current kg
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS activity_level INTEGER DEFAULT 3 CHECK (activity_level BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS liked_foods TEXT[], -- Array of strings
ADD COLUMN IF NOT EXISTS disliked_foods TEXT[]; -- Array of strings

-- 2. Create 'diet_types' table for formulas
CREATE TABLE IF NOT EXISTS diet_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    carb_factor NUMERIC NOT NULL,     -- e.g. 0.3
    protein_factor NUMERIC NOT NULL,  -- e.g. 0.8
    fat_factor NUMERIC NOT NULL,      -- e.g. 1.2
    is_system_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Turn on RLS
ALTER TABLE diet_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access for Diet Types" ON diet_types FOR ALL USING (true);


-- 3. Updates to 'diet_weeks' table
-- Each week can have a specific weight measurement and diet type setting
ALTER TABLE diet_weeks
ADD COLUMN IF NOT EXISTS weight_log NUMERIC, -- Patient's weight at the start of this week
ADD COLUMN IF NOT EXISTS assigned_diet_type_id UUID REFERENCES diet_types(id);


-- 4. Seed Default Diet Types
INSERT INTO diet_types (name, description, carb_factor, protein_factor, fat_factor, is_system_default)
VALUES 
('Ketojenik', 'Standart ketojenik beslenme', 0.3, 0.8, 1.2, true),
('Low Carb', 'Düşük karbonhidratlı beslenme', 0.6, 0.8, 1.0, true)
ON CONFLICT DO NOTHING;
