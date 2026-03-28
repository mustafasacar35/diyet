
-- Update policies to allow public access for development
-- Run this in Supabase SQL Editor

-- 1. Patients
DROP POLICY IF EXISTS "Enable all for authenticated" ON patients;
CREATE POLICY "Enable all for public" ON patients FOR ALL USING (true);

-- 2. Diet Plans
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_plans;
CREATE POLICY "Enable all for public" ON diet_plans FOR ALL USING (true);

-- 3. Diet Weeks
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_weeks;
CREATE POLICY "Enable all for public" ON diet_weeks FOR ALL USING (true);

-- 4. Diet Days
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_days;
CREATE POLICY "Enable all for public" ON diet_days FOR ALL USING (true);

-- 5. Diet Meals
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_meals;
CREATE POLICY "Enable all for public" ON diet_meals FOR ALL USING (true);

-- 6. Planner Settings
DROP POLICY IF EXISTS "Enable all for authenticated" ON planner_settings;
CREATE POLICY "Enable all for public" ON planner_settings FOR ALL USING (true);

-- 7. Planning Rules
DROP POLICY IF EXISTS "Enable all for authenticated" ON planning_rules;
CREATE POLICY "Enable all for public" ON planning_rules FOR ALL USING (true);

-- 8. Foods (Important for auto-planner filtering)
DROP POLICY IF EXISTS "Enable all for authenticated" ON foods;
CREATE POLICY "Enable all for public" ON foods FOR ALL USING (true);

-- 9. Diet Types (Important for matching)
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_types;
CREATE POLICY "Enable all for public" ON diet_types FOR ALL USING (true);
