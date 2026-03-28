-- ================================================
-- Diet Editor Enhancement - Schema Updates V3
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
DROP POLICY IF EXISTS "Allow all for system_settings" ON system_settings;
CREATE POLICY "Allow all for system_settings" ON system_settings FOR ALL USING (true);

-- 2. Add date columns to diet_weeks
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS end_date DATE;

-- 3. Add sort_order to diet_meals for reordering
ALTER TABLE diet_meals ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Add meal_types JSONB column to diet_plans for per-patient meal configuration
-- This stores the meal types for each patient's diet plan
ALTER TABLE diet_plans ADD COLUMN IF NOT EXISTS meal_types JSONB DEFAULT '["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]';

-- 5. Add meal_types JSONB column to diet_weeks for per-week meal configuration (inheritance)
-- When a new week is created, it copies meal_types from previous week or from diet_plan
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS meal_types JSONB;

-- 6. Meal Templates Table (for global templates)
CREATE TABLE IF NOT EXISTS meal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    meal_types JSONB NOT NULL DEFAULT '["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for meal_templates
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for meal_templates" ON meal_templates;
CREATE POLICY "Allow all for meal_templates" ON meal_templates FOR ALL USING (true);

-- 7. Insert default meal template
INSERT INTO meal_templates (name, meal_types, is_default) 
VALUES ('Standart 4 Öğün', '["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]', true)
ON CONFLICT DO NOTHING;

-- 8. Insert default filter configuration
INSERT INTO system_settings (key, value) VALUES (
    'filter_fields',
    '[
        {"value": "name", "label": "İsim", "type": "text"},
        {"value": "category", "label": "Kategori", "type": "select", "options": ["KAHVALTI", "ÖĞLEN", "AKŞAM", "ARA ÖĞÜN"]},
        {"value": "role", "label": "Rol", "type": "select", "options": ["mainDish", "sideDish", "drink", "supplement", "snack"]},
        {"value": "dietType", "label": "Diyet Türü", "type": "select", "options": ["ketojenik", "lowcarb", "keto", "vegan"]},
        {"value": "tags", "label": "Etiket", "type": "text"},
        {"value": "minCalories", "label": "Min Kalori", "type": "number"},
        {"value": "maxCalories", "label": "Max Kalori", "type": "number"}
    ]'::jsonb
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Done!
SELECT 'Schema updates V3 completed successfully!' as status;
