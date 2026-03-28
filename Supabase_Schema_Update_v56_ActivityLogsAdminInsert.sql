-- Admins and dietitians can insert activity logs for any patient
CREATE POLICY "Admins and dietitians can insert activity logs"
ON public.patient_activity_logs FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'dietitian')
  )
);
