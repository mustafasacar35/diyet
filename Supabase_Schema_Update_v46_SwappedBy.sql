-- Migration: Add swapped_by to track who performed the meal swap
-- Possible values: 'dietitian', 'patient'
ALTER TABLE public.diet_meals 
ADD COLUMN IF NOT EXISTS swapped_by TEXT;

-- Add index for potential filtering
CREATE INDEX IF NOT EXISTS idx_diet_meals_swapped_by ON public.diet_meals(swapped_by);

-- Comment for clarity
COMMENT ON COLUMN public.diet_meals.swapped_by IS 'Tracks who performed the food swap. Values: dietitian, patient.';
