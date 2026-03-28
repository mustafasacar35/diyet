-- Enable RLS for programs (if not already)
-- ALTER TABLE patient_programs ENABLE ROW LEVEL SECURITY; -- REMOVED TABLE DOES NOT EXIST
ALTER TABLE program_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_template_weeks ENABLE ROW LEVEL SECURITY;

-- Allow Patients to read their OWN programs (via templates)

-- DROP POLICY IF EXISTS "Allow Read Programs" ON patient_programs; -- REMOVED

DROP POLICY IF EXISTS "Allow Read Templates" ON program_templates;
CREATE POLICY "Allow Read Templates" ON program_templates
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow Read Template Weeks" ON program_template_weeks;
CREATE POLICY "Allow Read Template Weeks" ON program_template_weeks
FOR SELECT
USING (true);
