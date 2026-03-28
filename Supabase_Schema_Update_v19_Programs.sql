-- ================================================
-- Diet Editor - Schema Update V19 (Program Templates)
-- Beslenme programları şablon sistemi
-- ================================================

-- 1. Program Şablonları Ana Tablosu
CREATE TABLE IF NOT EXISTS program_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,                    -- "Lipödem Beslenmesi"
    description TEXT,
    total_weeks INTEGER DEFAULT 12,        -- Toplam hafta sayısı
    default_activity_level INTEGER DEFAULT 3 CHECK (default_activity_level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Program Hafta-Diyet Türü Eşleştirmeleri
CREATE TABLE IF NOT EXISTS program_template_weeks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_template_id UUID NOT NULL REFERENCES program_templates(id) ON DELETE CASCADE,
    week_start INTEGER NOT NULL,            -- Başlangıç haftası (1, 3, 10 vb.)
    week_end INTEGER NOT NULL,              -- Bitiş haftası (2, 9, 14 vb.)
    diet_type_id UUID REFERENCES diet_types(id),
    notes TEXT,
    UNIQUE(program_template_id, week_start) -- Her program için başlangıç haftası benzersiz
);

-- 3. Program Bazlı Yasaklar
CREATE TABLE IF NOT EXISTS program_template_restrictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_template_id UUID NOT NULL REFERENCES program_templates(id) ON DELETE CASCADE,
    restriction_type TEXT NOT NULL CHECK (restriction_type IN ('keyword', 'tag', 'food_id')),
    restriction_value TEXT NOT NULL,        -- "şeker", "gluten", veya food UUID
    reason TEXT,                            -- "Lipödem için zararlı"
    severity TEXT DEFAULT 'warn' CHECK (severity IN ('warn', 'block'))
);

-- 4. Hasta-Program İlişkisi (patients tablosuna ekle)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS program_template_id UUID REFERENCES program_templates(id);

-- 5. Aktivite düzeyi miralaması için diet_weeks güncelleme
ALTER TABLE diet_weeks
ADD COLUMN IF NOT EXISTS activity_level_inherited BOOLEAN DEFAULT false;

-- 6. RLS Politikaları
ALTER TABLE program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_template_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_template_restrictions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Public Access for Program Templates" ON program_templates;
DROP POLICY IF EXISTS "Public Access for Program Week" ON program_template_weeks;
DROP POLICY IF EXISTS "Public Access for Program Restrictions" ON program_template_restrictions;

-- Create new policies
CREATE POLICY "Public Access for Program Templates" ON program_templates FOR ALL USING (true);
CREATE POLICY "Public Access for Program Week" ON program_template_weeks FOR ALL USING (true);
CREATE POLICY "Public Access for Program Restrictions" ON program_template_restrictions FOR ALL USING (true);

-- 7. Örnek Program Verisi (İsteğe bağlı - silmek için DELETE FROM program_templates)
INSERT INTO program_templates (name, description, total_weeks, default_activity_level) VALUES
('Lipödem Beslenmesi', '16 haftalık lipödem tedavi programı. İlk 2 hafta eliminasyon, 3-9 hafta ketojenik, 10-16 hafta lowcarb.', 16, 3),
('Sporcu Beslenmesi', 'Yüksek protein ağırlıklı sporcu programı', 12, 4),
('Gebelik Beslenmesi', 'Hamilelik dönemi için dengeli beslenme programı', 40, 2)
ON CONFLICT DO NOTHING;
