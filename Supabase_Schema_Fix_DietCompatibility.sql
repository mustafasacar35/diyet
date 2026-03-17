-- ! CRITICAL FIX FOR DIET COMPATIBILITY FEATURES ! --

-- 1. Update 'diet_types' table with all required columns
-- These are used by the DietTypesEditor and compatibility checking logic
ALTER TABLE diet_types ADD COLUMN IF NOT EXISTS allowed_tags TEXT[] DEFAULT '{}';
ALTER TABLE diet_types ADD COLUMN IF NOT EXISTS banned_keywords TEXT[] DEFAULT '{}';
ALTER TABLE diet_types ADD COLUMN IF NOT EXISTS banned_tags TEXT[] DEFAULT '{}';

-- 2. Update 'foods' table to match the application logic
-- The application code (FoodSidebar, page.tsx) uses 'compatibility_tags' used for matching logic.
-- Ensure this column exists so foods can be filtered correctly.
ALTER TABLE foods ADD COLUMN IF NOT EXISTS compatibility_tags TEXT[] DEFAULT '{}';

-- Optional: If you created 'diet_tags' previously, you can keep it or ignore it.
-- The app currently focuses on 'compatibility_tags'.

-- 3. Force Schema Cache Reload
-- This is often automatic, but explicit notification helps.
NOTIFY pgrst, 'reload schema';
