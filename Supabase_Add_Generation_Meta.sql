
-- Add generation_meta column to diet_meals if it doesn't exist
ALTER TABLE diet_meals 
ADD COLUMN IF NOT EXISTS generation_meta jsonb DEFAULT '{}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN diet_meals.generation_meta IS 'Stores metadata about how this meal was generated (e.g., source rule, algorithm reasoning)';
