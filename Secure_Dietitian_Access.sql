-- ==============================================================================
-- SECURE DIETITIAN ACCESS SCRIPT (FIXED RECURSION)
-- ==============================================================================
-- 1. Ensure Assignments Table Exists
CREATE TABLE IF NOT EXISTS public.patient_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dietitian_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dietitian_id, patient_id)
);

-- Enable RLS on Assignments
ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Helper Function for Role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Dynamic Cleanup: Drop ALL existing policies on patients & assignments
-- This prevents "Infinite Recursion" errors caused by old policies pointing to each other.
DO $$
DECLARE
    pol record;
BEGIN
    -- Drop all policies on 'patients'
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patients' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.patients', pol.policyname);
    END LOOP;

    -- Drop all policies on 'patient_assignments'
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'patient_assignments' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.patient_assignments', pol.policyname);
    END LOOP;
END $$;

-- 4. Reset RLS on Patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- 5. New Policies for 'patients'

-- A. Admin & Doctor: FULL ACCESS
-- Can see and edit everyone.
CREATE POLICY "Admins and Doctors manage all patients"
ON public.patients
FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'doctor')
);

-- B. Dietitian: ASSIGNED ACCESS ONLY
-- Can SELECT only if assigned.
-- Can UPDATE only if assigned.
-- Can INSERT (handled by trigger later, usually allows insert if role is dietitian)
-- Can DELETE? (Frontend restricts this, but RLS allows if assigned. Or we can block DELETE separately)

-- For SELECT/UPDATE/DELETE: Check assignment
CREATE POLICY "Dietitians manage assigned patients"
ON public.patients
FOR ALL
TO authenticated
USING (
  public.get_my_role() = 'dietitian' 
  AND (
    EXISTS (
      SELECT 1 FROM public.patient_assignments 
      WHERE patient_assignments.patient_id = patients.id 
      AND patient_assignments.dietitian_id = auth.uid()
    )
  )
);

-- Note: For INSERT, the "USING" clause is ignored. 
-- We need a specific WITH CHECK for INSERT if we want to allow dietitians to create new patients.
-- But "FOR ALL" includes INSERT with "WITH CHECK" acting effectively same as USING if not specified separately?
-- Actually for INSERT, there is no existing row, so checks run on NEW row.
-- Assignment doesn't exist yet for new row. So the above policy would BLOCK INSERT for Dietitians.
-- We must allow Dietitians to INSERT freely (Trigger will assign it).

CREATE POLICY "Dietitians insert patients"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() = 'dietitian'
);


-- C. Patient: VIEW OWN PROFILE
CREATE POLICY "Patients view own profile"
ON public.patients
FOR SELECT
TO authenticated
USING (
    (current_setting('request.jwt.claim.sub', true)::uuid = id) -- Fallback if ID matches
    OR
    (user_id = auth.uid()) -- If user_id column is used
);


-- 6. New Policies for 'patient_assignments'

-- Admins can manage assignments (ALL)
CREATE POLICY "Admins manage assignments"
ON public.patient_assignments
FOR ALL
TO authenticated
USING (public.get_my_role() IN ('admin', 'doctor'));

-- Dietitians can VIEW their own assignments
-- CRITICAL: This policy must NOT query 'patients' table to avoid recursion.
CREATE POLICY "Dietitians view own assignments"
ON public.patient_assignments
FOR SELECT
TO authenticated
USING (dietitian_id = auth.uid());

-- Dietitians can INSERT their own assignments (e.g. via Trigger mostly, but allowed if manual)
CREATE POLICY "Dietitians create assignments"
ON public.patient_assignments
FOR INSERT
TO authenticated
WITH CHECK (dietitian_id = auth.uid());


-- 7. Trigger to Protect Critical Fields
-- Prevent Dietitians from changing full_name, etc.
CREATE OR REPLACE FUNCTION public.protect_patient_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is a Dietitian
  IF (SELECT public.get_my_role()) = 'dietitian' THEN
     -- Check if forbidden fields are changed
     IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
        RAISE EXCEPTION 'Diyetisyenler hasta ismini değiştiremez. Lütfen yönetici ile iletişime geçin.';
     END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_patient_fields ON public.patients;

CREATE TRIGGER trg_protect_patient_fields
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_patient_fields();
