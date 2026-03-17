-- Add parent_diet_type_id to track the origin of patient-specific diet types
ALTER TABLE diet_types 
ADD COLUMN IF NOT EXISTS parent_diet_type_id uuid REFERENCES diet_types(id) ON DELETE SET NULL;

-- Create index for parent lookups
CREATE INDEX IF NOT EXISTS idx_diet_types_parent_id ON diet_types(parent_diet_type_id);

-- Add comment explaining the usage
COMMENT ON COLUMN diet_types.parent_diet_type_id IS 'References the global diet_type this record was copied from. Used for inheritance/override logic.';
