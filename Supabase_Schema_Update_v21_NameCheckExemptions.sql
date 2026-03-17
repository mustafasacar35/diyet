-- Add name_similarity_exempt_words column to planner_settings table
ALTER TABLE planner_settings 
ADD COLUMN IF NOT EXISTS name_similarity_exempt_words TEXT[] DEFAULT '{}';

-- Add description for the new column
COMMENT ON COLUMN planner_settings.name_similarity_exempt_words IS 'List of words to ignore during name similarity check (e.g. "Soslu", "Izgara").';
