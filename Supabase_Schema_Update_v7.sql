-- Add sort_order column to diet_meals if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diet_meals' AND column_name = 'sort_order') THEN
        ALTER TABLE diet_meals ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;
