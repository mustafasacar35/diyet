-- Migration: Add Meal Tracking (Consumption) columns to diet_meals
ALTER TABLE public.diet_meals 
ADD COLUMN IF NOT EXISTS is_consumed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ;

-- Refresh schema cache if needed (Supabase usually handles this automatically)
COMMENT ON COLUMN public.diet_meals.is_consumed IS 'True if the patient has eaten this meal.';
COMMENT ON COLUMN public.diet_meals.consumed_at IS 'The timestamp when the patient marked this meal as eaten.';
