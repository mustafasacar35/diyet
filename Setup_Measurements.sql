-- 1. Measurement Definitions (Types)
CREATE TABLE IF NOT EXISTS public.measurement_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE, -- If NULL, it is a SYSTEM Default visible to all capable of adding custom types? No.
    -- Better: System defaults have patient_id NULL. Custom ones have patient_id.
    name TEXT NOT NULL,
    unit TEXT DEFAULT 'cm',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id), -- Who created this definition
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Definitions
ALTER TABLE public.measurement_definitions ENABLE ROW LEVEL SECURITY;

-- Everyone can read system defaults (where patient_id is NULL)
CREATE POLICY "Read system definitions"
ON public.measurement_definitions FOR SELECT
TO authenticated
USING (patient_id IS NULL);

-- Users can read definitions for their assigned patients (or allow patients to read their own definitions)
-- For simplicity, if you have access to the patient, you have access to their definitions.
CREATE POLICY "Read patient specific definitions"
ON public.measurement_definitions FOR SELECT
TO authenticated
USING (
  patient_id IS NOT NULL AND (
    -- Access Check: Use same logic as Patients table access?
    -- Or simply: 
    -- 1. Patient viewing own definitions
    (EXISTS (SELECT 1 FROM public.patients WHERE id = measurement_definitions.patient_id AND (user_id = auth.uid() OR id::text = current_setting('request.jwt.claim.sub', true))))
    OR
    -- 2. Dietitians/Doctors assigned
    (public.get_my_role() IN ('admin', 'doctor', 'dietitian')) -- Simplified access for staff, detail check could be added
  )
);

-- Dietitians/Admins can INSERT/UPDATE definitions
CREATE POLICY "Staff manage definitions"
ON public.measurement_definitions FOR ALL
TO authenticated
USING (public.get_my_role() IN ('admin', 'doctor', 'dietitian'))
WITH CHECK (public.get_my_role() IN ('admin', 'doctor', 'dietitian'));


-- 2. Patient Measurement Logs
CREATE TABLE IF NOT EXISTS public.patient_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    values JSONB NOT NULL DEFAULT '{}'::jsonb, -- Key: definition_id (or name), Value: number
    note TEXT,
    is_seen_by_dietitian BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Logs
ALTER TABLE public.patient_measurements ENABLE ROW LEVEL SECURITY;

-- Patient: View Own, Create Own
CREATE POLICY "Patients view own measurements"
ON public.patient_measurements FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_measurements.patient_id AND (user_id = auth.uid() OR id::text = current_setting('request.jwt.claim.sub', true)))
);

CREATE POLICY "Patients insert own measurements"
ON public.patient_measurements FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.patients WHERE id = patient_measurements.patient_id AND (user_id = auth.uid() OR id::text = current_setting('request.jwt.claim.sub', true)))
);

-- Staff: View/Manage Assigned
CREATE POLICY "Staff view assigned measurements"
ON public.patient_measurements FOR SELECT
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'doctor') OR
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = patient_measurements.patient_id AND dietitian_id = auth.uid()))
);

CREATE POLICY "Staff manage assigned measurements"
ON public.patient_measurements FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'doctor') OR
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = patient_measurements.patient_id AND dietitian_id = auth.uid()))
);


-- 3. Initial Data (Defaults)
INSERT INTO public.measurement_definitions (name, unit, sort_order, patient_id)
SELECT name, unit, idx, NULL
FROM (VALUES 
    ('Bel', 'cm', 1),
    ('Kalça', 'cm', 2),
    ('Sağ Uyluk', 'cm', 3),
    ('Sol Uyluk', 'cm', 4),
    ('Sağ Diz', 'cm', 5),
    ('Sol Diz', 'cm', 6),
    ('Sağ Baldır', 'cm', 7),
    ('Sol Baldır', 'cm', 8),
    ('Sağ Bilek', 'cm', 9),
    ('Sol Bilek', 'cm', 10),
    ('Sağ Kol', 'cm', 11),
    ('Sol Kol', 'cm', 12),
    ('Kilo', 'kg', 13)
) AS v(name, unit, idx)
WHERE NOT EXISTS (SELECT 1 FROM public.measurement_definitions WHERE patient_id IS NULL AND name = v.name);
