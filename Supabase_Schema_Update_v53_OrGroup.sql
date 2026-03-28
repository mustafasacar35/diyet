-- EXECUTE THIS IN SUPABASE SQL EDITOR TO FIX 'OR GROUP' SAVE ERROR

-- 1. Drop existing constraint
ALTER TABLE planning_rules 
DROP CONSTRAINT IF EXISTS planning_rules_rule_type_check;

-- 2. Add new constraint including 'or_group'
ALTER TABLE planning_rules 
ADD CONSTRAINT planning_rules_rule_type_check 
CHECK (rule_type IN (
  'frequency', 
  'affinity', 
  'consistency', 
  'preference', 
  'nutritional', 
  'fixed_meal', 
  'week_override', 
  'rotation',
  'or_group'
));
