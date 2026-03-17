-- Patient Notes Schema: Görüntüleme ve Seyir
-- v30: Patient Imaging and Observations tables

-- 1. Görüntüleme Tetkikleri (Imaging Results/Reports)
CREATE TABLE IF NOT EXISTS patient_imaging (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    image_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seyir/Gözlem Notları (Progress/Observation Notes)
CREATE TABLE IF NOT EXISTS patient_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_imaging_patient ON patient_imaging(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_imaging_date ON patient_imaging(patient_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_observations_patient ON patient_observations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_observations_date ON patient_observations(patient_id, date DESC);

-- RLS Policies
ALTER TABLE patient_imaging ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_observations ENABLE ROW LEVEL SECURITY;

-- Full access for authenticated users
CREATE POLICY "patient_imaging_all" ON patient_imaging FOR ALL USING (true);
CREATE POLICY "patient_observations_all" ON patient_observations FOR ALL USING (true);

-- Verify
SELECT 'patient_imaging' as table_name, COUNT(*) as count FROM patient_imaging
UNION ALL
SELECT 'patient_observations', COUNT(*) FROM patient_observations;
