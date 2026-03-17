-- Enable RLS on Diet Tables (if not already enabled)
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 1. DIET PLANS
-- ==============================================================================

-- Policy: Patients view own plans
CREATE POLICY "Patients view own plans"
ON public.diet_plans FOR SELECT
TO authenticated
USING (
    patient_id = auth.uid() OR
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
);

-- Policy: Staff (Admin/Doctor) view all plans
CREATE POLICY "Staff view all plans"
ON public.diet_plans FOR SELECT
TO authenticated
USING (public.get_my_role() IN ('admin', 'doctor'));

-- Policy: Dietitians view assigned patients' plans
CREATE POLICY "Dietitians view assigned plans"
ON public.diet_plans FOR SELECT
TO authenticated
USING (
    public.get_my_role() = 'dietitian' AND
    EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = diet_plans.patient_id AND dietitian_id = auth.uid())
);

-- Policy: Staff manage plans (Insert/Update/Delete)
CREATE POLICY "Staff manage plans"
ON public.diet_plans FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'doctor') OR
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = diet_plans.patient_id AND dietitian_id = auth.uid()))
)
WITH CHECK (
    public.get_my_role() IN ('admin', 'doctor') OR
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments WHERE patient_id = diet_plans.patient_id AND dietitian_id = auth.uid()))
);


-- ==============================================================================
-- 2. DIET WEEKS
-- ==============================================================================

-- Policy: View Weeks
CREATE POLICY "View weeks"
ON public.diet_weeks FOR SELECT
TO authenticated
USING (
    -- Patient owns the plan
    EXISTS (SELECT 1 FROM public.diet_plans WHERE id = diet_weeks.diet_plan_id AND (patient_id = auth.uid() OR patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())))
    OR
    -- Staff can see
    public.get_my_role() IN ('admin', 'doctor')
    OR
    -- Dietitian assigned
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.diet_plans dp JOIN public.patient_assignments pa ON dp.patient_id = pa.patient_id WHERE dp.id = diet_weeks.diet_plan_id AND pa.dietitian_id = auth.uid()))
);

-- Policy: Staff manage weeks
CREATE POLICY "Staff manage weeks"
ON public.diet_weeks FOR ALL
TO authenticated
USING (
    public.get_my_role() IN ('admin', 'doctor') OR
    (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.diet_plans dp JOIN public.patient_assignments pa ON dp.patient_id = pa.patient_id WHERE dp.id = diet_weeks.diet_plan_id AND pa.dietitian_id = auth.uid()))
);

-- ==============================================================================
-- 3. DIET DAYS
-- ==============================================================================

-- View Days
CREATE POLICY "View days"
ON public.diet_days FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_weeks dw JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id 
    WHERE dw.id = diet_days.diet_week_id AND (
        -- Patient check
        (dp.patient_id = auth.uid() OR dp.patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
        OR
        -- Staff check
        public.get_my_role() IN ('admin', 'doctor')
        OR
        -- Dietitian check
        (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);

-- Manage Days
CREATE POLICY "Staff manage days"
ON public.diet_days FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_weeks dw JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id 
    WHERE dw.id = diet_days.diet_week_id AND (
        public.get_my_role() IN ('admin', 'doctor') OR
        (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);

-- ==============================================================================
-- 4. DIET MEALS
-- ==============================================================================

-- View Meals
CREATE POLICY "View meals"
ON public.diet_meals FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_days dd JOIN public.diet_weeks dw ON dd.diet_week_id = dw.id JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id
    WHERE dd.id = diet_meals.diet_day_id AND (
        -- Patient
        (dp.patient_id = auth.uid() OR dp.patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid()))
        OR
        -- Staff
        public.get_my_role() IN ('admin', 'doctor')
        OR
        -- Dietitian
        (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);

-- Manage Meals
CREATE POLICY "Staff manage meals"
ON public.diet_meals FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.diet_days dd JOIN public.diet_weeks dw ON dd.diet_week_id = dw.id JOIN public.diet_plans dp ON dw.diet_plan_id = dp.id
    WHERE dd.id = diet_meals.diet_day_id AND (
        public.get_my_role() IN ('admin', 'doctor') OR
        (public.get_my_role() = 'dietitian' AND EXISTS (SELECT 1 FROM public.patient_assignments pa WHERE pa.patient_id = dp.patient_id AND pa.dietitian_id = auth.uid()))
    ))
);
