-- ==============================================================================
-- HASTA ÇİFT KAYITLARINI TEMİZLE
-- ==============================================================================

-- 1. Çift kayıtları bul (aynı isimle birden fazla kayıt)
SELECT full_name, COUNT(*) as count, array_agg(id) as patient_ids
FROM patients
GROUP BY full_name
HAVING COUNT(*) > 1;

-- 2. Her hasta için hangi kaydın diyet planı olduğunu kontrol et
SELECT 
    p.id as patient_id,
    p.full_name,
    p.user_id,
    p.created_at,
    (SELECT COUNT(*) FROM diet_plans WHERE patient_id = p.id) as plan_count
FROM patients p
WHERE p.full_name ILIKE '%hacer%'
ORDER BY plan_count DESC;

-- 3. HACER için: Diyet planı OLAN kaydı koru, olmayanı sil
-- Önce hangi ID'nin planı olduğunu görün, sonra diğerini silin

-- Plan olan HACER kaydı (KORUYACAĞIMIZ):
-- ID: 77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae (muhtemelen bu, plan var)

-- Plan OLMAYAN HACER kaydı (SİLİNECEK):
-- Bu kayıt profiles sync ile oluşturulmuş, planı yok

-- 4. Güvenli silme - sadece planı olmayan ve profiles sync ile oluşturulmuş olanı sil
DELETE FROM patients 
WHERE full_name = 'HACER YILBAŞI' 
  AND id NOT IN (
    SELECT DISTINCT patient_id FROM diet_plans WHERE patient_id IS NOT NULL
  );

-- 5. Kalan HACER kaydının user_id'sini doğru auth ID ile güncelle
-- (Zaten yapılmış olabilir)
UPDATE patients 
SET user_id = 'b1cca998-b190-414d-a2d6-04ee0138e14a'
WHERE id = '77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae';

-- 6. Sonucu doğrula
SELECT id, full_name, user_id, created_at FROM patients WHERE full_name ILIKE '%hacer%';
