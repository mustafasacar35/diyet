-- Kan Tetkikleri / Blood Test Parameters with Categories
-- Önce category alanını ekle, sonra tahlilleri insert et

-- ADIM 1: Category alanı ekle (zaten varsa hata vermez)
ALTER TABLE micronutrients ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'mikrobesin';

-- ADIM 2: Mevcut kayıtları güncelle (eğer daha önce kategorisiz eklenmişlerse)
UPDATE micronutrients SET category = 'mikrobesin' WHERE category IS NULL;

-- ADIM 3: Yeni tahlilleri ekle
-- Mikrobesinler (Vitamin & Mineraller) - Bunlar zaten varsa eklenmez
INSERT INTO micronutrients (name, unit, default_min, default_max, category) VALUES
('B12', 'pg/mL', 211, 911, 'mikrobesin'),
('Folik Asit', 'ng/mL', 3.89, 26.8, 'mikrobesin'),
('Demir', 'ug/dL', 60, 180, 'mikrobesin'),
('Demir Bağlama Kapasitesi', 'ug/dL', 250, 400, 'mikrobesin'),
('Ferritin', 'ng/mL', 20, 250, 'mikrobesin'),
('1-25 Dihidroksi D3', 'pg/mL', 20, 79, 'mikrobesin'),
('Mg', 'mg/dL', 1.6, 2.6, 'mikrobesin'),
('Ca', 'mg/dL', 8.6, 10.2, 'mikrobesin'),
('K', 'mEq/L', 3.5, 5.1, 'mikrobesin'),
('Na', 'mEq/L', 136, 145, 'mikrobesin'),
('Cl', 'mEq/L', 98, 106, 'mikrobesin'),
('Selenyum', 'ug/L', 70, 150, 'mikrobesin'),
('Çinko', 'ug/dL', 70, 120, 'mikrobesin'),
('Homosistein', 'umol/L', 5, 15, 'mikrobesin'),
('İyot', 'ug/L', 100, 199, 'mikrobesin')
ON CONFLICT (name) DO NOTHING;

-- Kan Tahlilleri (Hematoloji, Karaciğer, Böbrek, Tiroid, Metabolik, Lipid, İnflamasyon, Protein, Otoimmün)
INSERT INTO micronutrients (name, unit, default_min, default_max, category) VALUES
-- Hematoloji
('Hemogram', '', NULL, NULL, 'kan_tahlili'),
('PTZ', 'sn', 11, 13.5, 'kan_tahlili'),
('INR', '', 0.85, 1.15, 'kan_tahlili'),

-- Karaciğer Fonksiyonları
('AST', 'U/L', 0, 40, 'kan_tahlili'),
('ALT', 'U/L', 0, 41, 'kan_tahlili'),

-- Böbrek Fonksiyonları
('Üre', 'mg/dL', 17, 43, 'kan_tahlili'),
('Kreatinin', 'mg/dL', 0.7, 1.2, 'kan_tahlili'),

-- Tiroid
('TSH', 'mIU/L', 0.27, 4.2, 'kan_tahlili'),
('T3', 'ng/dL', 80, 200, 'kan_tahlili'),
('T4', 'ug/dL', 5.1, 14.1, 'kan_tahlili'),

-- Metabolik
('İnsülin', 'uIU/mL', 2.6, 24.9, 'kan_tahlili'),
('Glikoz', 'mg/dL', 74, 106, 'kan_tahlili'),
('HbA1c', '%', 4, 5.6, 'kan_tahlili'),
('HOMA-IR', '', NULL, 2.5, 'kan_tahlili'),

-- Lipid Paneli
('LDL', 'mg/dL', NULL, 100, 'kan_tahlili'),
('HDL', 'mg/dL', 40, NULL, 'kan_tahlili'),
('Trigliserid', 'mg/dL', NULL, 150, 'kan_tahlili'),
('Total Kolesterol', 'mg/dL', NULL, 200, 'kan_tahlili'),

-- İnflamasyon
('CRP', 'mg/L', 0, 5, 'kan_tahlili'),
('Sedimentasyon', 'mm/saat', 0, 20, 'kan_tahlili'),

-- Protein
('Total Protein', 'g/dL', 6.6, 8.3, 'kan_tahlili'),
('Albümin', 'g/dL', 3.5, 5.2, 'kan_tahlili'),

-- Otoimmün Antikorlar
('Anti-TPO', 'IU/mL', 0, 34, 'kan_tahlili'),
('Anti-TG', 'IU/mL', 0, 115, 'kan_tahlili')
ON CONFLICT (name) DO NOTHING;

-- Sonuçları kontrol et
SELECT category, COUNT(*) as count FROM micronutrients GROUP BY category ORDER BY category;
