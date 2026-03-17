-- =====================================================
-- AUTOMATIC MEAL PLANNER SCHEMA
-- =====================================================
-- Version: 1.1 (Updated to link with Program Templates)
-- Purpose: Tables for storing planning rules, rule sets, and scoring weights.

-- 1. PLANNING RULES
-- Stores individual rules like "No fish on Mondays" or "Main dish must have side dish"
CREATE TABLE IF NOT EXISTS planning_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('frequency', 'affinity', 'consistency', 'preference', 'nutritional', 'fixed_meal')),
    priority INTEGER DEFAULT 10, -- 1 (Lowest) to 100 (Highest)
    is_active BOOLEAN DEFAULT true,
    definition JSONB NOT NULL, -- The core logic of the rule
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Optional: if rules are user-specific
);

-- RLS for Rules
ALTER TABLE planning_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access using app logic" ON planning_rules;
CREATE POLICY "Allow read access using app logic" ON planning_rules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin manage rules" ON planning_rules;
CREATE POLICY "Allow admin manage rules" ON planning_rules FOR ALL TO authenticated USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'doctor', 'dietitian')
);

-- 2. RULE SETS (Templates)
-- Groups rules together, e.g., "High Protein Rules", "Strict Keto Rules"
CREATE TABLE IF NOT EXISTS rule_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS for Rule Sets
ALTER TABLE rule_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read public or own sets" ON rule_sets;
CREATE POLICY "Read public or own sets" ON rule_sets FOR SELECT TO authenticated USING (is_public = true OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Manage own sets" ON rule_sets;
CREATE POLICY "Manage own sets" ON rule_sets FOR ALL TO authenticated USING (owner_id = auth.uid());

-- 3. RULE SET ITEMS (Junction)
-- Many-to-Many relationship between Rule Sets and Rules
CREATE TABLE IF NOT EXISTS rule_set_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_set_id UUID REFERENCES rule_sets(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES planning_rules(id) ON DELETE CASCADE,
    override_priority INTEGER, -- Optional: Override rule priority in this specific set
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rule_set_id, rule_id)
);

ALTER TABLE rule_set_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read items" ON rule_set_items;
CREATE POLICY "Read items" ON rule_set_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Manage items" ON rule_set_items;
CREATE POLICY "Manage items" ON rule_set_items FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM rule_sets WHERE id = rule_set_items.rule_set_id AND owner_id = auth.uid())
);

-- 4. PLANNER SETTINGS (Scoring Weights)
-- Stores the weights for the optimization engine (e.g. Macros vs Tastes)
CREATE TABLE IF NOT EXISTS planner_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('global', 'patient')),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    weights JSONB DEFAULT '{
        "macro_targets": 100,
        "med_interactions": 90,
        "diet_type": 100,
        "allergen": 500,
        "disliked_food": 80,
        "liked_food": 40,
        "seasonality": 60,
        "micronutrients": 50,
        "variety": 30
    }'::jsonb,
    slot_configs JSONB DEFAULT '[
        {"name": "KAHVALTI", "min_items": 2, "max_items": 4},
        {"name": "ÖĞLEN", "min_items": 2, "max_items": 4},
        {"name": "AKŞAM", "min_items": 2, "max_items": 4},
        {"name": "ARA ÖĞÜN", "min_items": 1, "max_items": 2}
    ]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, scope, patient_id)
);

ALTER TABLE planner_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own settings" ON planner_settings;
CREATE POLICY "Manage own settings" ON planner_settings FOR ALL TO authenticated USING (user_id = auth.uid());

-- 5. INTEGRATION WITH PROGRAMS (New Section)
-- Link Rule Sets to Program Weeks
-- This allows: "In Week 1-2 (Elimination), enforce 'Elimination Ruleset' (which might say 'No Dairy')"

ALTER TABLE program_template_weeks 
ADD COLUMN IF NOT EXISTS rule_set_id UUID REFERENCES rule_sets(id) ON DELETE SET NULL;

COMMENT ON COLUMN program_template_weeks.rule_set_id IS 'Otomatik planlayıcı için bu hafta aralığında geçerli olacak ek kurallar seti (örn: Sıklık, yasaklar)';

-- 6. Helper Function for Updated At
CREATE OR REPLACE FUNCTION update_planner_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rules_updated ON planning_rules;
CREATE TRIGGER trigger_rules_updated BEFORE UPDATE ON planning_rules FOR EACH ROW EXECUTE PROCEDURE update_planner_timestamp();

DROP TRIGGER IF EXISTS trigger_settings_updated ON planner_settings;
CREATE TRIGGER trigger_settings_updated BEFORE UPDATE ON planner_settings FOR EACH ROW EXECUTE PROCEDURE update_planner_timestamp();

