-- ================================================
-- Diet Editor - Schema Update V22 (User Settings)
-- Kullanıcı/Uygulama bazlı ayarların saklanması
-- ================================================

-- 1. Ayarlar Tablosu (Basit Key-Value Store)
-- Not: Şimdilik user_id olmadan global uygulama ayarı gibi davranacak
-- veya istenirse auth.uid() ile bağlanabilir ama şu anki yapıda auth bypass var.
-- Basitlik için tekil bir settings tablosu yapıyoruz.
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS Politikaları
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access for Settings" ON app_settings;

CREATE POLICY "Public Access for Settings" ON app_settings FOR ALL USING (true);

-- 3. Varsayılan Ayarlar (Örnek)
-- Alternative Food Default Settings
INSERT INTO app_settings (key, value) VALUES 
('food_alternative_prefs', '{
    "includeRole": true,
    "includeCategory": false,
    "includeDietType": true,
    "weights": {
        "calories": 100,
        "protein": 50,
        "carbs": 20,
        "fat": 20
    },
    "limit": 5
}'::jsonb)
ON CONFLICT DO NOTHING;
