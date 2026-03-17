-- Add preferences column to patients table for storing UI states (dashboard visibility, etc.)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Policy ensures patients can update their own preferences
DROP POLICY IF EXISTS "Patients can update own preferences" ON patients;
CREATE POLICY "Patients can update own preferences"
ON patients FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
