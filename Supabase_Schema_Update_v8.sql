-- Add is_locked column to diet_meals table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'diet_meals' AND column_name = 'is_locked') THEN
        ALTER TABLE diet_meals ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
