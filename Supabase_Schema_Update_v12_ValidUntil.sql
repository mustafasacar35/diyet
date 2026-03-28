-- ================================================
-- Diet Editor - Schema Update V12 (Patient Validity)
-- Ek Veritabanı Değişikliği: Profiles Tablosuna valid_until Eklenmesi
-- ================================================

-- 1. `valid_until` (Erişim Bitiş Tarihi) Sütununu Ekle
-- (Eğer daha önce eklenmişse hata vermemesi için doğrulama yapmıyor ama tablo yapısını güvenceye alır, DDL komutudur)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- 2. Mevcut Tüm HASTA statüsündeki ("patient") kullanıcıların süresini günceller
-- Oluşturulma tarihi + 365 Gün ekleyerek erişim süresini tanımlar.
-- "Sadece valid_until alanı boş olan hasta hesaplarını günceller"
UPDATE public.profiles
SET valid_until = created_at + INTERVAL '365 days'
WHERE role = 'patient' AND valid_until IS NULL;
