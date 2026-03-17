-- Add status column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Optional: Update existing rows to have 'active' status if they are null
UPDATE patients SET status = 'active' WHERE status IS NULL;
