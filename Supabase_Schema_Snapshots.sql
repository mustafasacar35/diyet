-- Snapshots table for backup/restore of diet weeks
-- Stores the full state of a week (days and meals) before major changes (like Auto-Plan overwrite)

create table if not exists diet_snapshots (
  id uuid primary key default uuid_generate_v4(),
  diet_week_id uuid references diet_weeks(id) on delete cascade,
  snapshot_data jsonb not null, -- Stores structure { days: [ { id, note, meals: [...] } ] }
  created_at timestamp with time zone default now(),
  description text -- e.g. "Auto-plan overwrite backup"
);

alter table diet_snapshots enable row level security;

-- Policies
create policy "Enable all for authenticated" on diet_snapshots for all using (auth.role() = 'authenticated');
