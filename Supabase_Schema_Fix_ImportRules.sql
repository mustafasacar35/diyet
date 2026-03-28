-- Ensure table exists
create table if not exists import_rules (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rule_type text not null check (rule_type in ('replace', 'ignore')),
  pattern text not null,
  replacement text,
  description text
);

-- Ensure RLS is enabled
alter table import_rules enable row level security;

-- Drop existing policy if it exists to avoid conflict (or use do block)
drop policy if exists "Allow Public Access" on import_rules;

-- Re-create policy
create policy "Allow Public Access" on import_rules
  for all using (true) with check (true);

-- Explicitly grant permissions to standard roles
grant all on import_rules to anon, authenticated, service_role;
