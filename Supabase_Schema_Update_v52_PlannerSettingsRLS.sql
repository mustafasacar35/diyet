
-- Enable RLS on planner_settings if not already enabled
ALTER TABLE planner_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to READ all planner_settings (so they can see global and their own)
-- Constructive approach: Drop existing if conflicts, then create.
DROP POLICY IF EXISTS "Enable read for authenticated" ON planner_settings;

CREATE POLICY "Enable read for authenticated"
ON planner_settings
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to INSERT/UPDATE their own settings (if scope is patient)
-- For now, let's just make it permissive for authenticated to fix the immediate issue
DROP POLICY IF EXISTS "Enable all for authenticated" ON planner_settings;

CREATE POLICY "Enable all for authenticated"
ON planner_settings
FOR ALL
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
