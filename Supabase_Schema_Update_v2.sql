-- ================================================
-- Diet Editor Enhancement - Schema Updates
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. System Settings Table (for storing configurations)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for system_settings" ON system_settings FOR ALL USING (true);

-- 2. Add date columns to diet_weeks
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Add sort_order to diet_meals for reordering
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Meal Templates Table
CREATE TABLE IF NOT EXISTS meal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    meal_types JSONB NOT NULL DEFAULT '["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for meal_templates
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for meal_templates" ON meal_templates FOR ALL USING (true);

-- 5. Insert default meal template
INSERT INTO meal_templates (name, meal_types, is_default) 
VALUES ('Standart 4 Öğün', '["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]', true)
ON CONFLICT DO NOTHING;

-- 6. Add meal_template_id to diet_days (optional, for per-day customization)
ALTER TABLE diet_days ADD COLUMN IF NOT EXISTS meal_template_id UUID REFERENCES meal_templates(id);

-- 7. Insert default filter configuration
INSERT INTO system_settings (key, value) VALUES (
    'filter_fields',
    '[
        {"value": "name", "label": "İsim", "type": "text"},
        {"value": "category", "label": "Kategori", "type": "select", "options": ["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]},
        {"value": "role", "label": "Rol", "type": "select", "options": ["mainDish", "sideDish", "drink", "supplement", "snack"]},
        {"value": "mealType", "label": "Öğün Tipi", "type": "select", "options": ["breakfast", "lunch", "dinner", "snack"]},
        {"value": "dietType", "label": "Diyet Türü", "type": "select", "options": ["ketojenik", "lowcarb", "keto", "vegan", "vejeteryan"]},
        {"value": "tags", "label": "Etiket", "type": "text"},
        {"value": "minCalories", "label": "Min Kalori", "type": "number"},
        {"value": "maxCalories", "label": "Max Kalori", "type": "number"},
        {"value": "minProtein", "label": "Min Protein", "type": "number"},
        {"value": "maxProtein", "label": "Max Protein", "type": "number"},
        {"value": "minCarbs", "label": "Min Karb", "type": "number"},
        {"value": "maxCarbs", "label": "Max Karb", "type": "number"},
        {"value": "minFat", "label": "Min Yağ", "type": "number"},
        {"value": "maxFat", "label": "Max Yağ", "type": "number"}
    ]'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Done!
SELECT 'Schema updates completed successfully!' as status;
