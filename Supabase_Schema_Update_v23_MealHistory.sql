-- Add original_food_id to diet_meals to track the initial food before swaps
ALTER TABLE diet_meals 
ADD COLUMN IF NOT EXISTS original_food_id UUID REFERENCES foods(id);

-- Add comment
COMMENT ON COLUMN diet_meals.original_food_id IS 'The ID of the original food chosen for this meal slot, used for reverting swaps.';
