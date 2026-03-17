-- Add compatibility_tags to foods table for Main Dish Compatibility logic
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS compatibility_tags TEXT;

-- Add comment
COMMENT ON COLUMN foods.compatibility_tags IS 'Comma-separated keywords used to find compatible side dishes (e.g. for a main dish like "Grilled Fish", this could be "salad, lemon, tahini").';

-- Optional: Create an index for faster text search if needed later (GIN index for array operations would be better if it were text[], but for simple like queries on small dataset, this is fine or no index is fine)
