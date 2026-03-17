-- Enable Read Access to Foods Table for All Authenticated Users
-- This fixes the issue where the Patient Panel cannot see any foods in the "Alternatif Bul" dialog.

-- 1. Enable RLS on foods (just in case it's not enabled, though usually it is)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON foods;
DROP POLICY IF EXISTS "Authenticated can read foods" ON foods;
DROP POLICY IF EXISTS "Public can read foods" ON foods;

-- 3. Create a permissive policy for ALL authenticated users (Patients, Admins, etc.)
-- Foods are considered public catalogue data for the app.
CREATE POLICY "Authenticated can read foods" 
ON foods 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. Also allow Service Role / Admin explicitly if needed (usually covered by authenticated or bypassed)
-- But just to be safe for "anon" if used (unlikely for patient portal):
-- CREATE POLICY "Anon can read foods" ON foods FOR SELECT TO anon USING (true); -- Optional: Uncomment if needed
