-- ================================================
-- Foods Table Expansion - Schema Update v4
-- Run this in Supabase SQL Editor
-- ================================================

-- 1. Add role column (Ana Yemek, Yan Yemek, İçecek, Ek, Atıştırmalık)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS role text;

-- 2. Add portion/quantity columns
ALTER TABLE foods ADD COLUMN IF NOT EXISTS min_quantity numeric DEFAULT 1;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS max_quantity numeric DEFAULT 1;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS step numeric DEFAULT 1;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS multiplier numeric DEFAULT 1;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS portion_fixed boolean DEFAULT false;

-- 3. Add diet type boolean columns
ALTER TABLE foods ADD COLUMN IF NOT EXISTS keto boolean DEFAULT false;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS lowcarb boolean DEFAULT false;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS vegan boolean DEFAULT false;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS vejeteryan boolean DEFAULT false;

-- 4. Add meal type columns (array of meal types this food is suitable for)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS meal_types text[] DEFAULT '{}';

-- 5. Add filler columns (for filling out meals)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS filler_lunch boolean DEFAULT false;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS filler_dinner boolean DEFAULT false;

-- 6. Add season range columns (1-12 for months)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS season_start integer DEFAULT 1;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS season_end integer DEFAULT 12;
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_reversed_season boolean DEFAULT false;

-- 7. Add compatibility tags (for matching foods together)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS compatibility_tags text[] DEFAULT '{}';
ALTER TABLE foods ADD COLUMN IF NOT EXISTS incompatibility_tags text[] DEFAULT '{}';

-- 8. Add notes column
ALTER TABLE foods ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- 9. Add diet_types array (ketojenik, lowcarb, vegan, vejeteryan)
ALTER TABLE foods ADD COLUMN IF NOT EXISTS diet_types text[] DEFAULT '{}';

-- Done!
SELECT 'Foods table expanded successfully!' as status;
