-- =====================================================
-- HACER ID KONTROLÜ VE DÜZELTMESİ
-- =====================================================

-- 1. Profiles tablosunda HACER var mı? Hangi ID ile?
SELECT id, full_name, role FROM profiles WHERE full_name ILIKE '%hacer%';

-- 2. Auth.users tablosunda HACER
SELECT id, email FROM auth.users WHERE email ILIKE '%hacer%';

-- 3. Patients tablosunda HACER
SELECT id, full_name, user_id, email FROM patients WHERE full_name ILIKE '%hacer%';

-- SORUN AÇIKLAMASI:
-- Profiles tablosunda ID: 9c691075-82c8-47f8-93a0-78f553fa2643
-- Auth.users tablosunda ID: b1cca998-b190-414d-a2d6-04ee0138e14a
-- Patients tablosunda user_id: b1cca998-b190-414d-a2d6-04ee0138e14a

-- Impersonate, profiles tablosundaki ID'yi kullanıyor ama
-- patient plan sorgusu user_id ile eşleşme arıyor.

-- ÇÖZÜM: Profiles tablosundaki HACER kaydını doğru ID ile güncelle
-- (Eğer eski yanlış kayıt varsa sil ve doğru olanı ekle)

DELETE FROM profiles WHERE id = '9c691075-82c8-47f8-93a0-78f553fa2643';

INSERT INTO profiles (id, full_name, role, created_at)
VALUES ('b1cca998-b190-414d-a2d6-04ee0138e14a', 'HACER YILBAŞI', 'patient', NOW())
ON CONFLICT (id) DO UPDATE SET full_name = 'HACER YILBAŞI', role = 'patient';

-- Patients tablosundaki user_id'yi de doğru ID ile güncelle (zaten yapılmış olabilir)
UPDATE patients 
SET user_id = 'b1cca998-b190-414d-a2d6-04ee0138e14a'
WHERE id = '77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae';

-- Sonucu doğrula
SELECT 'profiles' as source, id, full_name, role FROM profiles WHERE full_name ILIKE '%hacer%'
UNION ALL
SELECT 'patients.user_id', user_id, full_name, NULL FROM patients WHERE full_name ILIKE '%hacer%';
