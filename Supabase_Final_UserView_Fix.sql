-- ==============================================================================
-- FINAL FIX: user_management_view (Includes valid_until AND max_devices)
-- ==============================================================================
-- Bu script, yönetici panelindeki kullanıcı tablosunda hem "Cihaz Limiti" hem de 
-- "Kayıt Geçerlilik Tarihi (valid_until)" bilgilerinin görünmesini sağlar.

-- Step 1: Drop existing view
DROP VIEW IF EXISTS public.user_management_view;

-- Step 2: Recreate with all necessary columns
CREATE VIEW public.user_management_view AS
SELECT 
    p.id,
    p.role,
    p.full_name,
    p.title,
    p.avatar_url,
    p.max_devices,
    p.valid_until,
    p.created_at,
    p.updated_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Step 3: Grant access
GRANT SELECT ON public.user_management_view TO authenticated;
GRANT SELECT ON public.user_management_view TO service_role;

-- Step 4: Force reload schema cache (for good measure)
NOTIFY pgrst, 'reload schema';

SELECT 'View fixed with valid_until and max_devices. Please refresh the Admin page.' as status;
