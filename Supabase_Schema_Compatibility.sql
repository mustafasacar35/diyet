-- Add compatibility_tags to foods table
alter table foods 
add column if not exists compatibility_tags text[] default '{}';

-- Optional: Create an index for faster intersection checks (GIN index)
create index if not exists foods_compatibility_tags_idx on foods using gin (compatibility_tags);
