ALTER TABLE patients ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
UPDATE patients SET status = 'active' WHERE status IS NULL;
