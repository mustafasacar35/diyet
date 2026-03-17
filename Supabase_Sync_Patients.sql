-- ==============================================================================
-- SYNC PATIENTS FROM PROFILES (FIXED)
-- ==============================================================================
-- This script ensures that users with role 'patient' in public.profiles
-- have a corresponding record in public.patients table.
-- Uses 'full_name' instead of first_name/last_name (matching actual schema)

-- Step 0: Add email and user_id columns if missing
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS user_id UUID;

-- 1. Function to handle profile changes
CREATE OR REPLACE FUNCTION public.handle_profile_patient_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user role is 'patient'
  IF NEW.role = 'patient' THEN
    -- Insert into patients table if not exists
    INSERT INTO public.patients (id, full_name, email, user_id, status, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.full_name, 'Yeni Hasta'),
      (SELECT email FROM auth.users WHERE id = NEW.id),
      NEW.id,
      'active',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      full_name = COALESCE(EXCLUDED.full_name, patients.full_name),
      email = COALESCE(EXCLUDED.email, patients.email),
      user_id = EXCLUDED.user_id,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_patient_sync ON public.profiles;

CREATE TRIGGER on_profile_patient_sync
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_patient_sync();


-- 3. BACKFILL script for existing users
-- Find all profiles with role 'patient' that are NOT in patients table and insert them
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT p.id, p.full_name, u.email 
    FROM public.profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'patient' 
    AND NOT EXISTS (SELECT 1 FROM public.patients WHERE id = p.id)
  LOOP
    INSERT INTO public.patients (id, full_name, email, user_id, status, created_at)
    VALUES (
      r.id,
      COALESCE(r.full_name, 'Yeni Hasta'),
      r.email,
      r.id,
      'active',
      now()
    );
  END LOOP;
END;
$$;

SELECT 'Sync logic applied and backfill completed.' as status;
