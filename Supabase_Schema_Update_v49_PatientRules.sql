-- =====================================================
-- PATIENT-SPECIFIC RULES SCHEMA UPDATE
-- =====================================================
-- Version: v49
-- Purpose: Add patient-scope support to planning_rules table

-- 1. Add scope column (global or patient)
ALTER TABLE planning_rules 
ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'patient'));

-- 2. Add patient_id reference for patient-scoped rules
ALTER TABLE planning_rules 
ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;

-- 3. Add source_rule_id to track which global rule was cloned
ALTER TABLE planning_rules 
ADD COLUMN IF NOT EXISTS source_rule_id UUID REFERENCES planning_rules(id) ON DELETE SET NULL;

-- 4. Add pending_global_approval flag for promoting patient rules to global
ALTER TABLE planning_rules 
ADD COLUMN IF NOT EXISTS pending_global_approval BOOLEAN DEFAULT false;

-- 5. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_planning_rules_patient 
ON planning_rules(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_planning_rules_source 
ON planning_rules(source_rule_id) WHERE source_rule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_planning_rules_scope 
ON planning_rules(scope);

-- 6. Update existing rules to have explicit 'global' scope
UPDATE planning_rules SET scope = 'global' WHERE scope IS NULL;
