-- Drop tables if they exist to ensure clean state (since this is a new feature)
drop table if exists public.patient_diseases cascade;
drop table if exists public.disease_rules cascade;
drop table if exists public.diseases cascade;

-- Create diseases table
create table public.diseases (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create disease_rules table
create table public.disease_rules (
  id uuid default gen_random_uuid() primary key,
  disease_id uuid references public.diseases(id) on delete cascade not null,
  rule_type text not null check (rule_type in ('negative', 'positive')), -- negative = banned/warning, positive = recommended
  keywords text[] default '{}',
  tags text[] default '{}', -- e.g. 'gluten', 'lactose' (if we map foods to tags)
  match_name boolean default true,
  match_tags boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create patient_diseases link table
create table public.patient_diseases (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  disease_id uuid references public.diseases(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(patient_id, disease_id)
);

-- Add RLS policies
alter table public.diseases enable row level security;
alter table public.disease_rules enable row level security;
alter table public.patient_diseases enable row level security;

create policy "Enable all for users" on public.diseases for all using (true) with check (true);
create policy "Enable all for users" on public.disease_rules for all using (true) with check (true);
create policy "Enable all for users" on public.patient_diseases for all using (true) with check (true);

-- Insert some sample data
insert into public.diseases (name, description) values 
('Çölyak', 'Gluten hassasiyeti ve intoleransı'),
('Diyabet (Tip 2)', 'Şeker hastalığı ve insülin direnci'),
('Gut', 'Ürik asit yüksekliği');

-- Rules for Çölyak
do $$
declare
  d_id uuid;
begin
  select id into d_id from public.diseases where name = 'Çölyak';
  if d_id is not null then
    insert into public.disease_rules (disease_id, rule_type, keywords, tags) values
    (d_id, 'negative', ARRAY['buğday', 'arpa', 'çavdar', 'ekmek', 'makarna', 'bulgur', 'börek', 'simit', 'un'], ARRAY['gluten']);
  end if;
end $$;

-- Rules for Diyabet
do $$
declare
  d_id uuid;
begin
  select id into d_id from public.diseases where name = 'Diyabet (Tip 2)';
  if d_id is not null then
    insert into public.disease_rules (disease_id, rule_type, keywords) values
    (d_id, 'negative', ARRAY['şeker', 'bal', 'reçel', 'pekmez', 'çikolata', 'pasta', 'kola', 'meyve suyu']);
    
    insert into public.disease_rules (disease_id, rule_type, keywords) values
    (d_id, 'positive', ARRAY['tarçın', 'tam tahıl', 'sebze', 'posa']);
  end if;
end $$;
