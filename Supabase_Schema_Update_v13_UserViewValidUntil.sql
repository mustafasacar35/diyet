-- ==============================================================================
-- UPDATE user_management_view TO INCLUDE valid_until
-- ==============================================================================
-- Bu güncelleme, yönetici panelindeki kullanıcı tablosunda "Erişim Bitiş" tarihinin 
-- (valid_until) boş ("Belirtilmedi") görünmesi sorununu çözer. View tablo yeniden yaratılır.

-- Step 1: Drop existing view
DROP VIEW IF EXISTS public.user_management_view;

-- Step 2: Recreate with valid_until
CREATE VIEW public.user_management_view AS
SELECT 
    p.id,
    p.role,
    p.full_name,
    p.title,
    p.avatar_url,
    p.max_devices,
    p.valid_until,  -- YENİ EKLENEN SATIR
    p.created_at,
    p.updated_at,
    u.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant access to authenticated users
GRANT SELECT ON public.user_management_view TO authenticated;

SELECT 'View Updated with valid_until. Refresh Users Page.' as status;
