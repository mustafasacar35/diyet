-- Add 'food' to the allowed rule_type values
alter table import_rules drop constraint if exists import_rules_rule_type_check;

alter table import_rules add constraint import_rules_rule_type_check 
  check (rule_type in ('replace', 'ignore', 'header', 'food'));
