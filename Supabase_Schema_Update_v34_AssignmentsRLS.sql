-- Allow Patients to see their own assignments
DROP POLICY IF EXISTS "Patients can view own assignments" ON public.patient_assignments;
CREATE POLICY "Patients can view own assignments"
ON public.patient_assignments FOR SELECT
USING (patient_id = auth.uid());

-- Allow Dietitians to see their own assignments (patients)
DROP POLICY IF EXISTS "Dietitians can view own assignments" ON public.patient_assignments;
CREATE POLICY "Dietitians can view own assignments"
ON public.patient_assignments FOR SELECT
USING (dietitian_id = auth.uid());

-- Ensure Profiles are readable (just in case)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);
