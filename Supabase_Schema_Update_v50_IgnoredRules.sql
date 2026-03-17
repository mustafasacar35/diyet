
-- Add is_ignored column to planning_rules table
ALTER TABLE planning_rules 
ADD COLUMN IF NOT EXISTS is_ignored boolean DEFAULT false;

-- Add comment
COMMENT ON COLUMN planning_rules.is_ignored IS 'If true, this rule is ignored/hidden for the patient (soft delete equivalent for cloned rules)';
