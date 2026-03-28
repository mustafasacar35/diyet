-- Create diseases table
CREATE TABLE IF NOT EXISTS diseases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for diseases
ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Diseases are viewable by authenticated users" 
ON diseases FOR SELECT 
TO authenticated 
USING (true);

-- Allow full access to admins (assuming admin role or public text generic policy for now if not strictly defined)
-- Based on previous patterns, we often use true for dev or specific role checks. 
-- For now allowing updates for all authenticated to simplify dev (Admin UI protection handles the rest), or strictly restricted if desired.
-- Following the user's "allow public access for dev" pattern from history:
CREATE POLICY "Diseases are editable by all authenticated" 
ON diseases FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- Create disease_rules table
CREATE TABLE IF NOT EXISTS disease_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disease_id UUID REFERENCES diseases(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
    keyword TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for disease_rules
ALTER TABLE disease_rules ENABLE ROW LEVEL SECURITY;

-- Policies for disease_rules
CREATE POLICY "Disease rules are viewable by authenticated users" 
ON disease_rules FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Disease rules are editable by all authenticated" 
ON disease_rules FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);


-- Create patient_diseases table
CREATE TABLE IF NOT EXISTS patient_diseases (
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    disease_id UUID REFERENCES diseases(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (patient_id, disease_id)
);

-- Enable RLS for patient_diseases
ALTER TABLE patient_diseases ENABLE ROW LEVEL SECURITY;

-- Policies for patient_diseases
CREATE POLICY "Patient diseases are viewable by authenticated users" 
ON patient_diseases FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Patient diseases are editable by all authenticated" 
ON patient_diseases FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
