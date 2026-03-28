-- ==============================================================================
-- PATIENT PORTAL SCHEMA UPDATE
-- ==============================================================================
-- This script creates tables for managing patient meal settings (alternatives)
-- and storing their meal choices/swaps.

-- 1. Patient Meal Settings Table
-- Stores configuration for what alternatives a patient sees
CREATE TABLE IF NOT EXISTS public.patient_meal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  
  -- Alternative Generation Rules
  min_calories INT,
  max_calories INT,
  
  -- Tag-based rules (e.g. "No Gluten", "Vegetarian")
  allowed_tags TEXT[] DEFAULT '{}',
  blocked_tags TEXT[] DEFAULT '{}',
  
  -- Food-specific rules
  allowed_foods TEXT[] DEFAULT '{}', -- Always allow these foods as alternatives
  blocked_foods TEXT[] DEFAULT '{}', -- Never show these foods
  
  -- Feature flags
  show_alternatives BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_patient_settings UNIQUE(patient_id)
);

-- 2. Patient Meal Choices Table
-- Stores the actual swaps/choices made by the patient
CREATE TABLE IF NOT EXISTS public.patient_meal_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES public.diet_meals(id) ON DELETE CASCADE,
  
  -- The swap details
  original_food_id UUID, -- The food that was replaced (optional reference)
  chosen_food_id UUID,   -- The new food selected (optional reference)
  
  chosen_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.patient_meal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_meal_choices ENABLE ROW LEVEL SECURITY;

-- Helps for checking assignment
CREATE OR REPLACE FUNCTION is_assigned_dietitian(target_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.patient_assignments
    WHERE patient_id = target_patient_id
      AND dietitian_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helps for checking if user is the patient
CREATE OR REPLACE FUNCTION is_patient_owner(target_patient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Assuming patients table has a user_id column linking to auth.users
  -- If not, we might need to join with profiles or use email.
  -- Let's assume patients.id is NOT the auth.uid, but patients.user_id IS.
  RETURN EXISTS (
    SELECT 1 FROM public.patients
    WHERE id = target_patient_id
      AND (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- POLICIES FOR SETTINGS

-- Dietitians can ALL on their patients' settings
CREATE POLICY "Dietitians manage assigned settings" ON public.patient_meal_settings
FOR ALL USING (
  is_assigned_dietitian(patient_id) OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'doctor')
);

-- Patients can SELECT their own settings
CREATE POLICY "Patients view own settings" ON public.patient_meal_settings
FOR SELECT USING (
  is_patient_owner(patient_id)
);

-- POLICIES FOR CHOICES

-- Patients can ALL on their own choices
CREATE POLICY "Patients manage own choices" ON public.patient_meal_choices
FOR ALL USING (
  is_patient_owner(patient_id)
);

-- Dietitians can SELECT their patients' choices
CREATE POLICY "Dietitians view assigned choices" ON public.patient_meal_choices
FOR SELECT USING (
  is_assigned_dietitian(patient_id) OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'doctor')
);

SELECT 'Patient portal tables created successfully' as status;
