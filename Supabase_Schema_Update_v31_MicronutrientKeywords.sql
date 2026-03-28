-- Micronutrient Keyword Matching Feature v2
-- Keywords now stored as JSONB arrays with match_type property
-- Format: [{"keyword": "yumurta", "match_type": "both"}, ...]
-- match_type options: "name" (only name), "tag" (only tags), "both" (both)

-- 1. Drop old TEXT[] columns if they exist and add new JSONB columns
ALTER TABLE micronutrients 
DROP COLUMN IF EXISTS compatible_keywords,
DROP COLUMN IF EXISTS incompatible_keywords;

ALTER TABLE micronutrients 
ADD COLUMN IF NOT EXISTS compatible_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS incompatible_keywords JSONB DEFAULT '[]'::jsonb;

-- 2. Add comments for documentation
COMMENT ON COLUMN micronutrients.compatible_keywords IS 'JSONB array of keywords with match_type: [{keyword, match_type: "name"|"tag"|"both"}]';
COMMENT ON COLUMN micronutrients.incompatible_keywords IS 'JSONB array of keywords for foods that block absorption';

-- 3. Example data (optional - uncomment to test)
-- UPDATE micronutrients SET compatible_keywords = '[
--   {"keyword": "yumurta", "match_type": "both"},
--   {"keyword": "somon", "match_type": "name"},
--   {"keyword": "balık", "match_type": "tag"}
-- ]'::jsonb WHERE name = 'D Vitamini';

-- Verify
SELECT name, compatible_keywords, incompatible_keywords FROM micronutrients ORDER BY name;
