-- ==============================================================================
-- MASTER FIX SCRIPT (Run this to fix "Empty View" and Access Issues)
-- ==============================================================================

-- 1. Ensure Helper Function Exists (Critical for RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Repair Missing Days (Insert days 1-7 for weeks that have none)
INSERT INTO public.diet_days (diet_week_id, day_number, notes)
SELECT 
    w.id as diet_week_id,
    d.day_num as day_number,
    '' as notes
FROM 
    public.diet_weeks w
CROSS JOIN 
    (SELECT generate_series(1, 7) as day_num) d
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM public.diet_days dd 
        WHERE dd.diet_week_id = w.id 
        AND dd.day_number = d.day_num
    );

-- 3. Reset and Re-Apply RLS Policies (Safely)

-- Enable RLS
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/errors
DROP POLICY IF EXISTS "Patients view own plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Staff view all plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Dietitians view assigned plans" ON public.diet_plans;
DROP POLICY IF EXISTS "Staff manage plans" ON public.diet_plans;

DROP POLICY IF EXISTS "View weeks" ON public.diet_weeks;
DROP POLICY IF EXISTS "Staff manage weeks" ON public.diet_weeks;

DROP POLICY IF EXISTS "View days" ON public.diet_days;
DROP POLICY IF EXISTS "Staff manage days" ON public.diet_days;

DROP POLICY IF EXISTS "View meals" ON public.diet_meals;
DROP POLICY IF EXISTS "Staff manage meals" ON public.diet_meals;


-- --- POLICIES ---

-- PLANS
CREATE POLICY "Patients view own plans" ON public.diet_plans FOR SELECT TO authenticated
USING (patient_id = auth.uid() OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()));

CREATE POLICY "Staff view all plans" ON public.diet_plans FOR SELECT TO authenticated
USING (public.get_my_role() IN ('admin', 'doctor'));

CREATE POLICY "Dietitians view assigned plans" ON public.diet_plans FOR SELECT TO authenticated
USING (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = diet_plans.patient_id AND dietitian_id = auth.uid()));

CREATE POLICY "Staff manage plans" ON public.diet_plans FOR ALL TO authenticated
USING (public.get_my_role() IN ('admin', 'doctor') OR (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = diet_plans.patient_id AND dietitian_id = auth.uid())));

-- WEEKS
CREATE POLICY "View weeks" ON public.diet_weeks FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_plans WHERE id = diet_weeks.diet_plan_id AND (patient_id = auth.uid() OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())))
    OR public.get_my_role() IN ('admin', 'doctor')
    OR (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.diet_plans dp JOIN public.patient_assignments pa ON dp.patient_id = pa.patient_id WHERE dp.id = diet_weeks.diet_plan_id AND pa.dietitian_id = auth.uid()))
);

CREATE POLICY "Staff manage weeks" ON public.diet_weeks FOR ALL TO authenticated
USING (
    public.get_my_role() IN ('admin', 'doctor') OR
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.diet_plans dp JOIN public.patient_assignments pa ON dp.patient_id = pa.patient_id WHERE dp.id = diet_weeks.diet_plan_id AND pa.dietitian_id = auth.uid()))
);

-- DAYS
CREATE POLICY "View days" ON public.diet_days FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_weeks dw JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id 
    WHERE dw.id = diet_days.diet_week_id AND (
        (dp.patient_id = auth.uid() OR dp.patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
        OR public.get_my_role() IN ('admin', 'doctor')
        OR (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);

CREATE POLICY "Staff manage days" ON public.diet_days FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_weeks dw JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id 
    WHERE dw.id = diet_days.diet_week_id AND (
        public.get_my_role() IN ('admin', 'doctor') OR
        (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);

-- MEALS
CREATE POLICY "View meals" ON public.diet_meals FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_days dd JOIN public.diet_weeks dw ON dd.diet_week_id = dw.id JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id
    WHERE dd.id = diet_meals.diet_day_id AND (
        (dp.patient_id = auth.uid() OR dp.patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
        OR public.get_my_role() IN ('admin', 'doctor')
        OR (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);

CREATE POLICY "Staff manage meals" ON public.diet_meals FOR ALL TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_days dd JOIN public.diet_weeks dw ON dd.diet_week_id = dw.id JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id
    WHERE dd.id = diet_meals.diet_day_id AND (
        public.get_my_role() IN ('admin', 'doctor') OR
        (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);
