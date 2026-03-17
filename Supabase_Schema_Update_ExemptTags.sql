-- Add exempt_tags column to planner_settings
ALTER TABLE planner_settings 
ADD COLUMN IF NOT EXISTS exempt_tags TEXT[] DEFAULT '{}';

-- Update global settings with default value if needed
UPDATE planner_settings 
SET exempt_tags = ARRAY['protein', 'karbonhidrat', 'sebze', 'meyve', 'süt ürünü', 'yağ']
WHERE scope = 'global' AND (exempt_tags IS NULL OR exempt_tags = '{}');
