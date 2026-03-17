-- Add swapped_by column to diet_meals to track who made the change
ALTER TABLE public.diet_meals 
ADD COLUMN IF NOT EXISTS swapped_by text;

-- Add comment to explain values
COMMENT ON COLUMN public.diet_meals.swapped_by IS 'Role of the user who swapped the meal: "dietitian" or "patient"';
