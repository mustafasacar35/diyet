-- =====================================================
-- HACER YILBAŞI VERİ KONTROLÜ
-- =====================================================

-- 1. HACER'in diyetisyen ataması var mı?
SELECT 
    p.id,
    p.full_name,
    p.dietitian_id,
    d.full_name as dietitian_name
FROM patients p
LEFT JOIN dietitians d ON p.dietitian_id = d.id
WHERE p.id = '77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae';

-- 2. Tüm dietitians listesi
SELECT id, full_name, email, specialization FROM dietitians;

-- 3. HACER'in auth bilgileri (profiles tablosu)
-- Kullanıcılar panelinde görünmesi için profiles tablosunda olmalı
SELECT * FROM profiles WHERE id = 'b1cca998-b190-414d-a2d6-04ee0138e14a';

-- 4. Auth.users'da HACER var mı? (email: hacer@demo.com veya user_id ile)
SELECT id, email, role, created_at FROM auth.users 
WHERE id = 'b1cca998-b190-414d-a2d6-04ee0138e14a'
   OR email ILIKE '%hacer%';

-- 5. HACER için profiles kaydı oluştur (varsa atla)
INSERT INTO profiles (id, full_name, role, created_at)
SELECT 
    'b1cca998-b190-414d-a2d6-04ee0138e14a',
    'HACER YILBAŞI',
    'patient',
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = 'b1cca998-b190-414d-a2d6-04ee0138e14a'
);
