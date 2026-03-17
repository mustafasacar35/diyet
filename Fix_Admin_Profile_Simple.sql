-- =====================================================
-- ADMIN PROFİLİ DÜZELTME (FIXED)
-- ID: 9c691075-82c8-47f8-93a0-78f553fa2643
-- =====================================================

-- 1. Eksik admin profilini oluştur (Email sütunu OLMADAN)
INSERT INTO profiles (id, full_name, role, created_at)
VALUES (
    '9c691075-82c8-47f8-93a0-78f553fa2643', -- Auth ID
    'Mustafa Sacar',                        -- İsim
    'admin',                                -- Rol
    NOW()
)
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    full_name = 'Mustafa Sacar';

-- 2. Herkesin profilleri görebilmesini sağla (Login hatasını önlemek için)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);
