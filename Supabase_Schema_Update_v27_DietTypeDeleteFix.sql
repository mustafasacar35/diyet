-- Fix FK constraint to allow deleting diet types without error
ALTER TABLE diet_weeks 
DROP CONSTRAINT IF EXISTS diet_weeks_assigned_diet_type_id_fkey;

ALTER TABLE diet_weeks 
ADD CONSTRAINT diet_weeks_assigned_diet_type_id_fkey 
FOREIGN KEY (assigned_diet_type_id) 
REFERENCES diet_types(id) 
ON DELETE SET NULL;
