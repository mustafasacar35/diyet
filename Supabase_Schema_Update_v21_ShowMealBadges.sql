-- Add show_meal_badges column to patients table
-- This stores the user preference for showing/hiding meal count badges
ALTER TABLE patients ADD COLUMN IF NOT EXISTS show_meal_badges boolean DEFAULT true;

-- Update existing records to have default value
UPDATE patients SET show_meal_badges = true WHERE show_meal_badges IS NULL;

-- Add sidebar_sort_preference column to patients table
-- This stores the sort preference for food sidebar (asc, desc, or null)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sidebar_sort_preference text DEFAULT null;
