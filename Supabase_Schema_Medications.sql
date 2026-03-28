-- =====================================================
-- İlaç-Besin Etkileşim Sistemi - Database Schema
-- =====================================================
-- Version: 1.0
-- Date: 2024-02-02
-- Purpose: Global medication database with interaction rules
-- =====================================================

-- =====================================================
-- 1. MEDICATIONS TABLE (Global Database)
-- =====================================================
CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    generic_name TEXT,
    category TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_medications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_medications_updated_at ON medications;
CREATE TRIGGER trigger_medications_updated_at
    BEFORE UPDATE ON medications
    FOR EACH ROW
    EXECUTE FUNCTION update_medications_timestamp();

-- =====================================================
-- 2. MEDICATION_INTERACTIONS TABLE (Rules)
-- =====================================================
CREATE TABLE IF NOT EXISTS medication_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('negative', 'warning', 'positive')),
    keyword TEXT NOT NULL,
    match_name BOOLEAN DEFAULT true,
    match_tags BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_med_interactions_medication ON medication_interactions(medication_id);
CREATE INDEX IF NOT EXISTS idx_med_interactions_keyword ON medication_interactions(keyword);
CREATE INDEX IF NOT EXISTS idx_med_interactions_type ON medication_interactions(rule_type);

-- =====================================================
-- 3. PATIENT_MEDICATIONS (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES medications(id) ON DELETE SET NULL,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    started_at DATE,
    ended_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_medications_patient ON patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_active ON patient_medications(patient_id) WHERE ended_at IS NULL;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trigger_patient_medications_updated_at ON patient_medications;
CREATE TRIGGER trigger_patient_medications_updated_at
    BEFORE UPDATE ON patient_medications
    FOR EACH ROW
    EXECUTE FUNCTION update_medications_timestamp();

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medications ENABLE ROW LEVEL SECURITY;

-- Medications: Herkes okuyabilir ve ekleyebilir (Admin kontrolü frontend'te)
DROP POLICY IF EXISTS "medications_select_all" ON medications;
CREATE POLICY "medications_select_all" ON medications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "medications_insert_all" ON medications;
CREATE POLICY "medications_insert_all" ON medications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "medications_update_all" ON medications;
CREATE POLICY "medications_update_all" ON medications
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "medications_delete_all" ON medications;
CREATE POLICY "medications_delete_all" ON medications
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Medication Interactions: Herkes okuyabilir ve düzenleyebilir
DROP POLICY IF EXISTS "interactions_select_all" ON medication_interactions;
CREATE POLICY "interactions_select_all" ON medication_interactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "interactions_insert_all" ON medication_interactions;
CREATE POLICY "interactions_insert_all" ON medication_interactions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "interactions_update_all" ON medication_interactions;
CREATE POLICY "interactions_update_all" ON medication_interactions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "interactions_delete_all" ON medication_interactions;
CREATE POLICY "interactions_delete_all" ON medication_interactions
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Patient Medications: Sadece ilgili hasta veya authenticated users
DROP POLICY IF EXISTS "patient_medications_select_own" ON patient_medications;
CREATE POLICY "patient_medications_select_own" ON patient_medications
    FOR SELECT USING (
        patient_id = auth.uid() OR auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "patient_medications_insert_own" ON patient_medications;
CREATE POLICY "patient_medications_insert_own" ON patient_medications
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "patient_medications_update_own" ON patient_medications;
CREATE POLICY "patient_medications_update_own" ON patient_medications
    FOR UPDATE USING (
        auth.uid() IS NOT NULL
    );

DROP POLICY IF EXISTS "patient_medications_delete_own" ON patient_medications;
CREATE POLICY "patient_medications_delete_own" ON patient_medications
    FOR DELETE USING (
        auth.uid() IS NOT NULL
    );

-- =====================================================
-- 5. SAMPLE DATA (Common Medications)
-- =====================================================

INSERT INTO medications (name, generic_name, category, description) VALUES
-- Antikoagülanlar (Kan Sulandırıcılar)
('Coumadin', 'Warfarin', 'Antikoagülan', 'K vitamini metabolizmasını etkiler'),
('Plavix', 'Clopidogrel', 'Antikoagülan', 'Trombosit agregasyonunu önler'),

-- Antidiyabetikler
('Glucophage', 'Metformin', 'Antidiyabetik', 'İnsülin duyarlılığını artırır'),
('Glucophage XR', 'Metformin XR', 'Antidiyabetik', 'Uzun salınımlı metformin'),
('Jardiance', 'Empagliflozin', 'Antidiyabetik (SGLT2)', 'Böbreklerden glukoz atılımını artırır'),

-- Tiroid Hormonları
('Levotiroksin', 'Levothyroxine', 'Tiroid Hormonu', 'Hipotiroidi tedavisi'),
('Euthyrox', 'Levothyroxine', 'Tiroid Hormonu', 'T4 hormonu'),

-- Hipertansiyon
('Norvasc', 'Amlodipine', 'Antihipertansif (CCB)', 'Kalsiyum kanal blokörü'),
('Diovan', 'Valsartan', 'Antihipertansif (ARB)', 'Anjiyotensin reseptör blokörü'),

-- Kolesterol
('Lipitor', 'Atorvastatin', 'Statin', 'Kolesterol düşürücü'),
('Crestor', 'Rosuvastatin', 'Statin', 'HMG-CoA redüktaz inhibitörü')

ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. SAMPLE INTERACTION RULES
-- =====================================================

-- Warfarin (K vitamini ile etkileşim)
INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_tags, notes) 
SELECT id, 'negative', 'k vitamini', true, 'K vitamini kan pıhtılaşmasını artırır'
FROM medications WHERE name = 'Coumadin'
ON CONFLICT DO NOTHING;

INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_tags, notes)
SELECT id, 'negative', 'ıspanak', true, 'Yüksek K vitamini içeriği'
FROM medications WHERE name = 'Coumadin';

INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_tags, notes)
SELECT id, 'negative', 'brokoli', true, 'Yüksek K vitamini içeriği'
FROM medications WHERE name = 'Coumadin';

INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_tags, notes)
SELECT id, 'negative', 'lahana', true, 'Yüksek K vitamini içeriği'
FROM medications WHERE name = 'Coumadin';

-- Metformin (Alkol etkileşimi)
INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_name, notes)
SELECT id, 'warning', 'alkol', true, 'Laktik asidoz riski artabilir'
FROM medications WHERE name = 'Glucophage';

-- Levotiroksin (Kalsiyum, demir etkileşimi)
INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_tags, notes)
SELECT id, 'warning', 'kalsiyum', true, 'Emilimi azaltabilir, 4 saat ara bırakın'
FROM medications WHERE name = 'Levotiroksin';

INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_tags, notes)
SELECT id, 'warning', 'demir', true, 'Emilimi azaltabilir'
FROM medications WHERE name = 'Levotiroksin';

-- Statin (Greyfurt etkileşimi)
INSERT INTO medication_interactions (medication_id, rule_type, keyword, match_name, notes)
SELECT id, 'negative', 'greyfurt', true, 'CYP3A4 enzimini bloke eder, ilaç seviyesini tehlikeli şekilde artırır'
FROM medications WHERE name IN ('Lipitor', 'Crestor');

-- =====================================================
-- 7. HELPER FUNCTIONS
-- =====================================================

-- Get active medications for a patient
CREATE OR REPLACE FUNCTION get_active_patient_medications(p_patient_id UUID)
RETURNS TABLE (
    medication_id UUID,
    medication_name TEXT,
    generic_name TEXT,
    dosage TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.medication_id,
        pm.medication_name,
        m.generic_name,
        pm.dosage,
        m.category
    FROM patient_medications pm
    LEFT JOIN medications m ON pm.medication_id = m.id
    WHERE pm.patient_id = p_patient_id
      AND (pm.ended_at IS NULL OR pm.ended_at > CURRENT_DATE)
    ORDER BY pm.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Get all interaction rules for patient's medications
CREATE OR REPLACE FUNCTION get_patient_medication_rules(p_patient_id UUID)
RETURNS TABLE (
    medication_name TEXT,
    rule_type TEXT,
    keyword TEXT,
    match_name BOOLEAN,
    match_tags BOOLEAN,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.medication_name,
        mi.rule_type,
        mi.keyword,
        mi.match_name,
        mi.match_tags,
        mi.notes
    FROM patient_medications pm
    JOIN medication_interactions mi ON pm.medication_id = mi.medication_id
    WHERE pm.patient_id = p_patient_id
      AND (pm.ended_at IS NULL OR pm.ended_at > CURRENT_DATE)
    ORDER BY mi.rule_type DESC; -- negative first
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Medications schema successfully created!';
    RAISE NOTICE '📋 Tables: medications, medication_interactions, patient_medications';
    RAISE NOTICE '🔐 RLS policies enabled';
    RAISE NOTICE '📊 Sample medications and rules inserted';
    RAISE NOTICE '🛠️ Helper functions created';
END $$;
