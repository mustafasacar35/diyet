-- ==============================================================================
-- FIX ADMIN PATIENT VISIBILITY (v48)
-- ==============================================================================
-- Problem: Admin users cannot see patients ("Patient Not Found").
-- Solution: Force refresh of RLS policies for 'patients' table and ensure 'get_my_role' is correct.

-- 1. Ensure Helper Function exists and is correct
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Update Patients Table Policies
-- ------------------------------------------------------------------------------
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting or duplicate policies
DROP POLICY IF EXISTS "Admins and Doctors manage all patients" ON patients;
DROP POLICY IF EXISTS "Dietitians manage assigned patients" ON patients;
DROP POLICY IF EXISTS "Patients view own profile" ON patients;

-- Re-create Admin/Doctor Policy (ALL operations)
CREATE POLICY "Admins and Doctors manage all patients"
ON patients
FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'doctor')
);

-- Re-create Dietitian Policy (Assigned Only)
CREATE POLICY "Dietitians manage assigned patients"
ON patients
FOR ALL
TO authenticated
USING (
  public.get_my_role() = 'dietitian' 
  AND (
    EXISTS (
      SELECT 1 FROM patient_assignments 
      WHERE patient_assignments.patient_id = patients.id 
      AND patient_assignments.dietitian_id = auth.uid()
    )
  )
)
WITH CHECK (
   public.get_my_role() = 'dietitian'
);

-- Re-create Patient Policy (Own Profile)
CREATE POLICY "Patients view own profile"
ON patients
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 3. Verify Admin Access (Optional Debug View)
-- ------------------------------------------------------------------------------
-- Can't really print to client, but this ensures the script runs without syntax errors.
DO $$
BEGIN
  RAISE NOTICE 'Refreshed access policies for patients table.';
END $$;
