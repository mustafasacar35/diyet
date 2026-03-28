-- ==============================================================================
-- PATIENT RLS & VISIBILITY UPDATE (v26)
-- ==============================================================================
-- Implements strict visibility rules:
-- 1. Admins/Doctors: See ALL patients.
-- 2. Dietitians: See ONLY assigned patients.
-- 3. Patients: See ONLY their own record.

-- A. Helper Function for Roles
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER; 
-- SECURITY DEFINER is important to read profiles table even if RLS somehow blocks it (though profiles should be readable)

-- B. Drop Old Permissive Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Enable all for public" ON patients;
DROP POLICY IF EXISTS "Enable all for authenticated" ON patients;

-- Enable RLS just in case
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- C. Define New Policies
-- ------------------------------------------------------------------------------

-- 1. Admin & Doctor Policy (Full Access)
CREATE POLICY "Admins and Doctors manage all patients"
ON patients
FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'doctor')
);

-- 2. Dietitian Policy (Assigned Only)
-- View/Update/Delete assigned patients
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
   -- For Insert/Update, we allow successful operation if role is dietitian.
   -- The visibility (SELECT) will be handled by the auto-assign trigger for new inserts.
);

-- 3. Dietitian Insert Policy (Separate if needed, but FOR ALL handles it via WITH CHECK?)
-- The 'USING' clause is for existing rows. 'WITH CHECK' is for new/updated rows.
-- When inserting, USING is skipped. WITH CHECK is applied.
-- Our WITH CHECK above just checks role. So they can insert.
-- But immediately after insert, can they SELECT it? Only if assignment exists.
-- The TRIGGER below ensures assignment exists.

-- 3. Patient Policy (View Own Profile)
CREATE POLICY "Patients view own profile"
ON patients
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);


-- D. Auto-Assign Trigger
-- ------------------------------------------------------------------------------
-- When a Dietitian creates a patient, automatically assign it to them.

CREATE OR REPLACE FUNCTION public.auto_assign_created_patient() 
RETURNS TRIGGER AS $$
BEGIN
  -- If creator is a Dietitian, create assignment
  IF (SELECT public.get_my_role()) = 'dietitian' THEN
     INSERT INTO public.patient_assignments (dietitian_id, patient_id)
     VALUES (auth.uid(), new.id)
     ON CONFLICT DO NOTHING;
  END IF;
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_patient_created_assign ON patients;

CREATE TRIGGER on_patient_created_assign
  AFTER INSERT ON patients
  FOR EACH ROW EXECUTE PROCEDURE public.auto_assign_created_patient();

