-- =====================================================
-- FIX: patients tablosuna updated_at sütunu ekle
-- veya trigger'ı düzelt
-- =====================================================

-- Seçenek 1: updated_at sütununu ekle (ÖNERİLEN)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Şimdi profiles kaydını ekle (trigger artık çalışacak)
INSERT INTO profiles (id, full_name, role, created_at)
VALUES ('b1cca998-b190-414d-a2d6-04ee0138e14a', 'HACER YILBAŞI', 'patient', NOW())
ON CONFLICT (id) DO UPDATE SET full_name = 'HACER YILBAŞI', role = 'patient';

-- HACER'in diyetisyen atamasını kontrol et
SELECT 
    p.id,
    p.full_name,
    p.dietitian_id,
    d.full_name as dietitian_name
FROM patients p
LEFT JOIN dietitians d ON p.dietitian_id = d.id
WHERE p.id = '77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae';
