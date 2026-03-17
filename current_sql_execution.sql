-- Enable RLS on diet_types if not already
ALTER TABLE diet_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON diet_types;
DROP POLICY IF EXISTS "Allow All" ON diet_types;

-- Create a permissive policy for diet_types
-- This is necessary because diet_types can be Global (public) or Patient-Specific
-- For now, letting authenticated users (and anon if needed/dev) read all is safest for specific ID queries
CREATE POLICY "Allow All" ON diet_types
FOR ALL
USING (true)
WITH CHECK (true);
