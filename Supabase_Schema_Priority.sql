-- Add sort_order to planning_rules for explicit ordering
alter table planning_rules 
add column if not exists sort_order integer default 0;

-- Optional: Update existing rules to have some default order based on creation
with ranked as (
  select id, row_number() over (order by created_at) as rn
  from planning_rules
)
update planning_rules
set sort_order = ranked.rn
from ranked
where planning_rules.id = ranked.id;
