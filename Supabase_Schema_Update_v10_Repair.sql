-- ================================================
-- Diet Editor - Schema Repair (v10)
-- Fixes missing columns and permissions causing 400 Bad Request
-- ================================================

-- 1. Ensure 'sort_order' exists in diet_meals (Phase 4 requirement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diet_meals' AND column_name = 'sort_order') THEN
        ALTER TABLE diet_meals ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Ensure 'is_locked' exists in diet_meals (Phase 5 requirement)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diet_meals' AND column_name = 'is_locked') THEN
        ALTER TABLE diet_meals ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Ensure Open Access Policies (Fix missing days issue)
-- Re-apply policies to ensure they correct
DROP POLICY IF EXISTS "Enable all for authenticated" ON patients;
DROP POLICY IF EXISTS "Public Access" ON patients;
CREATE POLICY "Public Access" ON patients FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_plans;
DROP POLICY IF EXISTS "Public Access" ON diet_plans;
CREATE POLICY "Public Access" ON diet_plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_weeks;
DROP POLICY IF EXISTS "Public Access" ON diet_weeks;
CREATE POLICY "Public Access" ON diet_weeks FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_days;
DROP POLICY IF EXISTS "Public Access" ON diet_days;
CREATE POLICY "Public Access" ON diet_days FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_meals;
DROP POLICY IF EXISTS "Public Access" ON diet_meals;
CREATE POLICY "Public Access" ON diet_meals FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for public" ON foods;
CREATE POLICY "Public Access" ON foods FOR ALL USING (true);

-- Done
SELECT 'Repair completed. Missing columns added and policies updated.' as status;
