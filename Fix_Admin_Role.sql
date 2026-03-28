-- =====================================================
-- ADMIN ROLÜNÜ DÜZELT
-- mustafasacar@hotmail.com için
-- =====================================================

-- 1. Mevcut profiles kaydını kontrol et
SELECT id, full_name, role, email FROM profiles WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'mustafasacar@hotmail.com'
);

-- 2. Auth.users'dan ID'yi al
SELECT id, email FROM auth.users WHERE email = 'mustafasacar@hotmail.com';

-- 3. Admin rolünü geri ver (Yukarıdan aldığınız ID'yi buraya yapıştırın)
-- Veya direkt email ile auth.users'dan ID çekerek güncelle:
UPDATE profiles 
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mustafasacar@hotmail.com');

-- Sonucu doğrula
SELECT id, full_name, role FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'mustafasacar@hotmail.com');
