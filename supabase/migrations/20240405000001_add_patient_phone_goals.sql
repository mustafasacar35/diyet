-- Add phone and goals to patients table
ALTER TABLE patients ADD COLUMN phone text;
ALTER TABLE patients ADD COLUMN patient_goals text[];
