-- =============================================
-- Migration: Add program scope to planning_rules and planner_settings
-- =============================================

-- 1. Add program_template_id to planning_rules
ALTER TABLE planning_rules 
ADD COLUMN IF NOT EXISTS program_template_id UUID REFERENCES program_templates(id) ON DELETE CASCADE;

-- 2. Add program_template_id to planner_settings
ALTER TABLE planner_settings 
ADD COLUMN IF NOT EXISTS program_template_id UUID REFERENCES program_templates(id) ON DELETE CASCADE;

-- 3. Update CHECK constraint on planning_rules.scope to allow 'program'
ALTER TABLE planning_rules DROP CONSTRAINT IF EXISTS planning_rules_scope_check;
ALTER TABLE planning_rules ADD CONSTRAINT planning_rules_scope_check 
  CHECK (scope IS NULL OR scope IN ('global', 'patient', 'program'));

-- 4. Update CHECK constraint on planner_settings.scope to allow 'program'
ALTER TABLE planner_settings DROP CONSTRAINT IF EXISTS planner_settings_scope_check;
ALTER TABLE planner_settings ADD CONSTRAINT planner_settings_scope_check 
  CHECK (scope IS NULL OR scope IN ('global', 'patient', 'program'));

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
