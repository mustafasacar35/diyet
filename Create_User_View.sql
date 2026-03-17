-- ==============================================================================
-- CREATE VIEW FOR USER MANAGEMENT (With Emails)
-- ==============================================================================
-- Bu view, profiles tablosunu auth.users ile birleştirerek e-posta adreslerini sağlar.

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
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant access to authenticated users (RLS will still apply on base tables)
GRANT SELECT ON public.user_management_view TO authenticated;

SELECT 'View Created. Refresh Users Page.' as status;
