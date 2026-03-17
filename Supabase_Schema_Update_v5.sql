-- Add start_date and end_date columns to diet_weeks table
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE diet_weeks ADD COLUMN IF NOT EXISTS end_date DATE;

-- Optional: Update existing weeks with some default dates if needed (e.g., based on creation time)
-- For now, we leave them null and handle it in the UI or let user set them.
