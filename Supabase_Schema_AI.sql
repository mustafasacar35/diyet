-- =====================================================
-- AI PROMPTS SYSTEM - Database Schema
-- =====================================================

-- 1. SYSTEM_PROMPTS TABLE
CREATE TABLE IF NOT EXISTS system_prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE, -- e.g. 'medication_details', 'interaction_rules'
    description TEXT,
    prompt_template TEXT NOT NULL,
    model TEXT DEFAULT 'gemini-pro',
    temperature NUMERIC DEFAULT 0.7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- 2. RLS POLICIES
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (likely admins) to read/write
CREATE POLICY "Enable all for authenticated users" ON system_prompts
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. INITIAL DATA (Medication Details Prompt)
INSERT INTO system_prompts (key, description, prompt_template, model)
VALUES (
    'medication_details',
    'Generates detailed information and interaction rules for a given medication name.',
    'You are a clinical pharmacist assistant. 
Output a JSON object for the medication "{{medication_name}}". 
The JSON schema must be strictly followed:
{
  "name": "Standardized Name (TR)",
  "generic_name": "Active Ingredient (TR)",
  "category": "One of: Antikoagülan, Antidiyabetik, Tiroid Hormonu, Statin, Antibiyotik, Ağrı Kesici, Vitamin, Mineral, Diğer",
  "description": "Brief medical description (TR) (max 200 chars)",
  "interaction_rules": [
    {
      "keyword": "Main affected food/nutrient (TR)",
      "rule_type": "negative" | "warning" | "positive",
      "match_name": true,
      "match_tags": true,
      "notes": "Short explanation of interaction (TR)"
    }
  ]
}
Do not include markdown formatting (```json). Just the raw JSON string.',
    'gemini-pro'
) ON CONFLICT (key) DO NOTHING;
