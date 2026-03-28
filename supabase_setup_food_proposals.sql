-- Create table for storing food proposals from photo logs
create table if not exists food_proposals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  image_url text,
  suggested_name text not null,
  calories numeric,
  protein numeric,
  carbs numeric,
  fat numeric,
  portion_unit text default 'porsiyon',
  status text default 'pending', -- 'pending', 'approved', 'rejected'
  ai_analysis jsonb,
  created_at timestamptz default now(),
  processed_at timestamptz
);

-- RLS Policies
alter table food_proposals enable row level security;

-- Policy: Users can insert their own proposals
create policy "Users can insert their own proposals"
  on food_proposals for insert
  with check (auth.uid() = user_id);

-- Policy: Users can view their own proposals
create policy "Users can view their own proposals"
  on food_proposals for select
  using (auth.uid() = user_id);

-- Policy: Admins/Dietitians can view all proposals
create policy "Admins can view all proposals"
  on food_proposals for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'dietitian')
    )
  );

-- Policy: Admins/Dietitians can update proposals
create policy "Admins can update proposals"
  on food_proposals for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'dietitian')
    )
  );
