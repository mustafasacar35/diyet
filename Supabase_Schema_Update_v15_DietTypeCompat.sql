-- ================================================
-- Diet Editor - Schema Update V15 (Diet Type Compatibility)
-- Add compatibility rules to diet types
-- ================================================

-- 1. Add compatibility columns to 'diet_types' table
ALTER TABLE diet_types
ADD COLUMN IF NOT EXISTS allowed_tags TEXT[] DEFAULT '{}', -- e.g. ['KETOGENIC', 'LOW_CARB', 'GLUTEN_FREE']
ADD COLUMN IF NOT EXISTS banned_keywords TEXT[] DEFAULT '{}'; -- e.g. ['sugar', 'bread', 'pasta']

-- 2. Ensure 'diet_types' column exists in 'foods' table (from v4)
-- This column holds the tags for each food (e.g. ['KETOGENIC', 'VEGAN'])
ALTER TABLE foods 
ADD COLUMN IF NOT EXISTS diet_tags TEXT[] DEFAULT '{}'; 
-- Note: In v4 we added 'diet_types' column, but let's standardize on 'diet_tags' 
-- or reuse 'diet_types' text[] column if already populated.
-- Let's check consistency. If 'diet_types' column exists in foods, we can rename it or use it.
-- For clarity, let's assume we use the existing 'diet_types' column in 'foods' table as tags.
-- But to be safe and clear, let's create a specific 'diet_tags' if we want to separate logic, 
-- or just update the comment that 'diet_types' in foods table refers to tags.

-- Re-running this to be sure:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'foods' AND column_name = 'diet_tags') THEN
        ALTER TABLE foods ADD COLUMN diet_tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 3. Update RLS if needed (Public Access already exists, so skipping)
