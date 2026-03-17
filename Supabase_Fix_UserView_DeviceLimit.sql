-- ==============================================================================
-- UPDATE user_management_view TO INCLUDE max_devices
-- ==============================================================================
-- Bu güncelleme, kullanıcı düzenleme dialogunda cihaz limitinin görünmesini sağlar.
-- View sütun sırası değiştiği için DROP ve CREATE yapılıyor.

-- Step 1: Drop existing view
DROP VIEW IF EXISTS public.user_management_view;

-- Step 2: Recreate with max_devices
CREATE VIEW public.user_management_view AS
SELECT 
    p.id,
    p.role,
    p.full_name,
    p.title,
    p.avatar_url,
    p.max_devices,  -- Added for device limit editing
    p.created_at,
    p.updated_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant access to authenticated users
GRANT SELECT ON public.user_management_view TO authenticated;

SELECT 'View Updated with max_devices. Refresh Users Page.' as status;
