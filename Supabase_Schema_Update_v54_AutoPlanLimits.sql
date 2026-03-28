-- Add columns to patients table for auto-plan rate limits
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS auto_plan_limit_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS auto_plan_limit_period_hours INTEGER DEFAULT NULL;

-- Create table to log patient activities like auto_plan
CREATE TABLE IF NOT EXISTS public.patient_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster queries on logs
CREATE INDEX IF NOT EXISTS idx_patient_activity_logs_patient_action 
ON public.patient_activity_logs(patient_id, action_type, created_at);

-- RLS Policies for patient_activity_logs
ALTER TABLE public.patient_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins and dietitians can read everything
CREATE POLICY "Admins and dietitians can view activity logs"
ON public.patient_activity_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'dietitian')
  )
);

-- Patients can view their own logs
CREATE POLICY "Patients can view own activity logs"
ON public.patient_activity_logs FOR SELECT
USING (
  auth.uid() = patient_id
);

-- Users can insert logs for themselves
CREATE POLICY "Patients can insert own activity logs"
ON public.patient_activity_logs FOR INSERT
WITH CHECK (
  auth.uid() = patient_id
);

-- Optionally, system/RPCs might insert logs, they bypass RLS if SECURITY DEFINER
