-- Add patient_id column to diet_types to support patient-specific customization
ALTER TABLE diet_types 
ADD COLUMN IF NOT EXISTS patient_id uuid REFERENCES patients(id) ON DELETE CASCADE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_diet_types_patient_id ON diet_types(patient_id);

-- Update RLS policies (if any exist, otherwise they are open by default in this project setup usually)
-- Assuming unrestricted access based on previous files, but good to note.
