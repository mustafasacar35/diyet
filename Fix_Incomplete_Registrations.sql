-- 1. DROP THE TRIGGER THAT AUTO-CREATES PATIENTS
DROP TRIGGER IF EXISTS on_profile_patient_sync ON public.profiles;

-- 2. UPDATE THE USER MANAGEMENT VIEW TO ONLY INCLUDE PATIENTS WHO COMPLETED REGISTRATION (exist in patients table)
DROP VIEW IF EXISTS public.user_management_view;

CREATE OR REPLACE VIEW public.user_management_view AS
SELECT 
    p.id,
    p.role,
    p.full_name,
    p.title,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE 
    p.role != 'patient' 
    OR (p.role = 'patient' AND EXISTS (SELECT 1 FROM public.patients pt WHERE pt.id = p.id));

GRANT SELECT ON public.user_management_view TO authenticated;
