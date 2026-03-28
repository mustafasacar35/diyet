-- Add enable_name_similarity_check column to planner_settings table
ALTER TABLE planner_settings 
ADD COLUMN IF NOT EXISTS enable_name_similarity_check BOOLEAN DEFAULT false;

-- Add description for the new column
COMMENT ON COLUMN planner_settings.enable_name_similarity_check IS 'If true, prevents selecting foods with similar names in the same meal regardless of tags.';
