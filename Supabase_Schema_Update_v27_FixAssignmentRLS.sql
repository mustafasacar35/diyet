-- ==============================================================================
-- FIX PATIENT ASSIGNMENT RLS (v27)
-- ==============================================================================
-- This script fixes the issue where Admins could not create/update assignments
-- because the previous policy only allowed the target dietitian to do so.

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Dietitians can manage assignments" ON patient_assignments;
DROP POLICY IF EXISTS "Admins and Doctors manage all assignments" ON patient_assignments; -- In case of re-run

-- 2. Create Policy for Admins and Doctors (Full Access)
CREATE POLICY "Admins and Doctors manage all assignments"
ON patient_assignments
FOR ALL
TO authenticated
USING (
  public.get_my_role() IN ('admin', 'doctor')
);

-- 3. Create Policy for Dietitians (Self-Management)
-- They can see/edit assignments where they are the dietitian
CREATE POLICY "Dietitians manage own assignments"
ON patient_assignments
FOR ALL
TO authenticated
USING (
  auth.uid() = dietitian_id
)
WITH CHECK (
  auth.uid() = dietitian_id
);

-- Note: The 'WITH CHECK' ensures they can't assign a patient to someone else 
-- (changing dietitian_id to another UUID would violate this check).
