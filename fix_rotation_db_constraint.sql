-- Run this in your Supabase SQL Editor to allow the new "rotation" rule type:

ALTER TABLE planning_rules 
DROP CONSTRAINT IF EXISTS planning_rules_rule_type_check;

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
  'rotation'
));
