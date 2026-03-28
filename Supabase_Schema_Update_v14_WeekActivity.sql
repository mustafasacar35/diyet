-- Add activity_level_log to diet_weeks
ALTER TABLE diet_weeks 
ADD COLUMN IF NOT EXISTS activity_level_log INTEGER DEFAULT 3;

-- Add abbreviation to diet_types
ALTER TABLE diet_types 
ADD COLUMN IF NOT EXISTS abbreviation TEXT;

-- Update existing diet types with abbreviations
UPDATE diet_types SET abbreviation = 'K' WHERE name ILIKE '%ketojenik%';
UPDATE diet_types SET abbreviation = 'L' WHERE name ILIKE '%low%' OR name ILIKE '%düşük%';
UPDATE diet_types SET abbreviation = 'G' WHERE abbreviation IS NULL; -- General fallback
