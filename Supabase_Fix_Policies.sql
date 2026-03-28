-- Fix permissions for Weeks, Days and Meals to ensure persistence works
-- This enables ALL operations for EVERYONE (Development mode)

-- 1. Weeks
ALTER TABLE diet_weeks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for everyone on diet_weeks" ON diet_weeks;
CREATE POLICY "Enable all for everyone on diet_weeks" ON diet_weeks FOR ALL USING (true) WITH CHECK (true);

-- 2. Days
ALTER TABLE diet_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for everyone on diet_days" ON diet_days;
CREATE POLICY "Enable all for everyone on diet_days" ON diet_days FOR ALL USING (true) WITH CHECK (true);

-- 3. Meals
ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for everyone on diet_meals" ON diet_meals;
CREATE POLICY "Enable all for everyone on diet_meals" ON diet_meals FOR ALL USING (true) WITH CHECK (true);
