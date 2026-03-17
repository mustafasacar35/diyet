
-- Add banned_details column to diet_types table to store metadata for banned items
ALTER TABLE diet_types 
ADD COLUMN IF NOT EXISTS banned_details JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN diet_types.banned_details IS 'Stores metadata (warning, context) for banned_keywords and banned_tags. Keyed by the keyword/tag text.';
