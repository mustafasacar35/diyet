-- Add columns for storing custom/unknown meal data directly in diet_meals
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS custom_name TEXT;
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS calories NUMERIC DEFAULT 0;
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS protein NUMERIC DEFAULT 0;
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS carbs NUMERIC DEFAULT 0;
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS fat NUMERIC DEFAULT 0;

-- Allow food_id to be NULL (for custom meals)
ALTER TABLE diet_meals ALTER COLUMN food_id DROP NOT NULL;

-- Add is_custom flag for easier querying
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
