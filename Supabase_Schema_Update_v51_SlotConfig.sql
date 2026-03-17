
-- Add slot_config column to planner_settings table
ALTER TABLE planner_settings 
ADD COLUMN IF NOT EXISTS slot_config jsonb DEFAULT '{}'::jsonb;
