-- This migration adds AI analysis rate-limit settings to the patients table
-- allowing admins to specify how many times a patient can use AI photo/text analysis
-- over a given period of hours.

ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS ai_analysis_limit_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_analysis_limit_period_hours INTEGER DEFAULT NULL;

-- Activity Logs table already handles various action_types, we will just start using:
-- 'ai_photo_analysis'
-- 'ai_text_search'
-- in the patient_activity_logs.action_type column format.

-- Note: The admin UI will display these fields and null means unlimited usage.
