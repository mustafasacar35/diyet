-- Create micronutrients table (System level)
CREATE TABLE IF NOT EXISTS public.micronutrients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    unit TEXT DEFAULT 'mg',
    default_min NUMERIC,
    default_max NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create patient lab results table
CREATE TABLE IF NOT EXISTS public.patient_lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    micronutrient_id UUID REFERENCES public.micronutrients(id) ON DELETE CASCADE NOT NULL,
    value NUMERIC NOT NULL,
    measured_at DATE DEFAULT CURRENT_DATE NOT NULL,
    -- Reference ranges used at the time of measurement (Patient/Lab specific)
    ref_min NUMERIC,
    ref_max NUMERIC,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Associate foods with micronutrients they are rich in
CREATE TABLE IF NOT EXISTS public.food_micronutrients (
    food_id UUID REFERENCES public.foods(id) ON DELETE CASCADE NOT NULL,
    micronutrient_id UUID REFERENCES public.micronutrients(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (food_id, micronutrient_id)
);

-- RLS
ALTER TABLE public.micronutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_micronutrients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for public" ON public.micronutrients FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.patient_lab_results FOR ALL USING (true);
CREATE POLICY "Enable all for public" ON public.food_micronutrients FOR ALL USING (true);

-- Initial Data
INSERT INTO public.micronutrients (name, unit, default_min, default_max) VALUES
('B12 Vitamini', 'pg/mL', 200, 900),
('D Vitamini', 'ng/mL', 30, 100),
('Demir', 'mcg/dL', 60, 170),
('Ferritin', 'ng/mL', 30, 400),
('Magnezyum', 'mg/dL', 1.7, 2.2),
('Çinko', 'mcg/dL', 70, 120),
('Folat', 'ng/mL', 4, 20)
ON CONFLICT (name) DO NOTHING;
