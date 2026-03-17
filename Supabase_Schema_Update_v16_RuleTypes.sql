-- Drop the existing check constraint on rule_type
alter table import_rules drop constraint if exists import_rules_rule_type_check;

-- Add a new check constraint that includes 'header'
alter table import_rules add constraint import_rules_rule_type_check 
  check (rule_type in ('replace', 'ignore', 'header'));
