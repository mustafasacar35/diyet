-- Create a table for Import Parser Rules
create table if not exists import_rules (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  rule_type text not null check (rule_type in ('replace', 'ignore')),
  pattern text not null,
  replacement text,
  description text -- Optional description
);

-- Enable RLS (allow all for Public Dev)
alter table import_rules enable row level security;

create policy "Allow Public Access" on import_rules
  for all using (true) with check (true);
