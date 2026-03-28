-- Foods tablosu için RLS ayarları
-- Bu scripti Supabase SQL Editor'de çalıştırın

-- 1. RLS Aktifleştir
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- 2. Authenticated users (tüm giriş yapmış kullanıcılar) için OKUMA izni ver
-- Önce eski policy varsa kaldıralım (hata vermemesi için)
DROP POLICY IF EXISTS "Authenticated users can read foods" ON foods;

-- Yeni policy oluştur
CREATE POLICY "Authenticated users can read foods" 
ON foods FOR SELECT 
TO authenticated 
USING (true);

-- Kontrol et: public users (giriş yapmamış) için de okuma izni gerekebilir mi?
-- Şimdilik sadece authenticated yeterli görünüyor.
