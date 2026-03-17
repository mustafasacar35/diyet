-- Add new columns to planner_settings table if they don't exist

-- 1. Variety Preference
alter table "public"."planner_settings" 
add column if not exists "variety_preference" text default 'balanced';

-- 2. Macro Priorities (stored as JSONB)
alter table "public"."planner_settings" 
add column if not exists "macro_priorities" jsonb default '{"protein": 5, "carb": 5, "fat": 5}'::jsonb;

-- 3. Name Similarity Settings
alter table "public"."planner_settings" 
add column if not exists "enable_name_similarity_check" boolean default false;

alter table "public"."planner_settings" 
add column if not exists "name_similarity_exempt_words" text[] default array[]::text[];

-- 4. Ensure portion_settings is JSONB (it likely is, but good to check/comment)
-- It should already exist. If not:
-- alter table "public"."planner_settings" add column if not exists "portion_settings" jsonb default '{}'::jsonb;
