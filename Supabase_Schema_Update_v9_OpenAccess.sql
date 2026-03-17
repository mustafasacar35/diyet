-- ================================================
-- Diet Editor - Schema Update V9 (Open Access)
-- Enables public access for development (Anon Role)
-- ================================================

-- 1. Patients
DROP POLICY IF EXISTS "Enable all for authenticated" ON patients;
DROP POLICY IF EXISTS "Public Access" ON patients;
CREATE POLICY "Public Access" ON patients FOR ALL USING (true);

-- 2. Diet Plans
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_plans;
DROP POLICY IF EXISTS "Public Access" ON diet_plans;
CREATE POLICY "Public Access" ON diet_plans FOR ALL USING (true);

-- 3. Diet Weeks
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_weeks;
DROP POLICY IF EXISTS "Public Access" ON diet_weeks;
CREATE POLICY "Public Access" ON diet_weeks FOR ALL USING (true);

-- 4. Diet Days
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_days;
DROP POLICY IF EXISTS "Public Access" ON diet_days;
CREATE POLICY "Public Access" ON diet_days FOR ALL USING (true);

-- 5. Diet Meals
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_meals;
DROP POLICY IF EXISTS "Public Access" ON diet_meals;
CREATE POLICY "Public Access" ON diet_meals FOR ALL USING (true);

-- 6. Foods (Already public but ensuring)
DROP POLICY IF EXISTS "Enable all for public" ON foods;
CREATE POLICY "Public Access" ON foods FOR ALL USING (true);

-- Done
SELECT 'All tables are now publicly accessible for development.' as status;
