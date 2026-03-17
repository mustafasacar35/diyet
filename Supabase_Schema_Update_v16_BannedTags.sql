-- Add banned_tags column to diet_types table
ALTER TABLE diet_types ADD COLUMN IF NOT EXISTS banned_tags text[] DEFAULT '{}';

-- Notes: 
-- banned_keywords: Checks against food name (existing)
-- banned_tags: Will check against food compatibility_tags or tags
