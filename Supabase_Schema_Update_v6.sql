-- Create meal_templates table
CREATE TABLE IF NOT EXISTS meal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    meal_types JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings e.g. ["KAHVALTI", "ÖĞLEN"]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists to avoid errors on re-run
DROP POLICY IF EXISTS "Public Access" ON meal_templates;

-- Create policy for public access (development mode)
CREATE POLICY "Public Access" ON meal_templates
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add updated_at trigger logic if not exists (reusing existing function if available, or creating simple one)
-- Assuming 'update_updated_at_column' function exists from previous migrations. If not, we can skip or create it.
-- For simplicity in this update, we will just use the default now().
