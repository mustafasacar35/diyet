-- =====================================================
-- ADMIN PROFİLİ DÜZELTME (406 HATASI ÇÖZÜMÜ)
-- ID: 9c691075-82c8-47f8-93a0-78f553fa2643
-- =====================================================

-- 1. Önce bu ID'nin profiles tablosunda olup olmadığını kontrol et
-- Eğer yoksa single() sorgusu 406 veya JSON hatası döndürür.

INSERT INTO profiles (id, full_name, role, created_at, email)
VALUES (
    '9c691075-82c8-47f8-93a0-78f553fa2643', -- Auth ID
    'Mustafa Sacar',                        -- İsim
    'admin',                                -- Rol
    NOW(),
    'mustafasacar@hotmail.com'              -- Email (opsiyonel ama iyi olur)
)
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    full_name = 'Mustafa Sacar';

-- 2. RLS Politikalarını Kontrol Et (Herkesin kendi profilini görebilmesi lazım)
-- Adminlerin her şeyi görebilmesi lazım

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Diğer kullanıcıların profilini okuma izni (Gerekirse)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true); -- Şimdilik debug için herkesi açık yapalım

-- 4. Auth User'ı da kontrol et (opsiyonel, bilgi amaçlı)
SELECT id, email, created_at FROM auth.users WHERE id = '9c691075-82c8-47f8-93a0-78f553fa2643';
