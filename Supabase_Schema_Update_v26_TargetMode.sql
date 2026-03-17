-- Migration: Add Macro Target Mode to patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS macro_target_mode TEXT DEFAULT 'calculated' CHECK (macro_target_mode IN ('calculated', 'plan'));

COMMENT ON COLUMN public.patients.macro_target_mode IS 'Determines if the patient dashboard shows targets based on formulas (calculated) or the day''s assigned meals (plan).';
