-- Add food_meta JSONB column to diet_meals
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS food_meta JSONB;
