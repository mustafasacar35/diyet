ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS variety_exempt_words TEXT[] DEFAULT '{}'::TEXT[];
