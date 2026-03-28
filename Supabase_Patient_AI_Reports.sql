-- =============================================
-- Patient AI Reports Table + System Prompt
-- =============================================

-- 1. Create patient_ai_reports table
CREATE TABLE IF NOT EXISTS patient_ai_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL DEFAULT 'comprehensive',
    audience TEXT NOT NULL DEFAULT 'doctor',
    title TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    raw_response TEXT,
    input_snapshot JSONB,
    model_used TEXT,
    prompt_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT DEFAULT 'dietitian'
);

-- 2. Index for fast patient lookups
CREATE INDEX IF NOT EXISTS idx_patient_ai_reports_patient_id ON patient_ai_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_ai_reports_created_at ON patient_ai_reports(created_at DESC);

-- 3. RLS Policy (public access for dev)
ALTER TABLE patient_ai_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_ai_reports_all" ON patient_ai_reports;
CREATE POLICY "patient_ai_reports_all" ON patient_ai_reports FOR ALL USING (true);

-- 4. Insert system prompt for patient analysis
INSERT INTO system_prompts (key, description, prompt_template, model, temperature)
VALUES (
    'patient_comprehensive_analysis',
    'Hasta için kapsamlı AI analiz raporu oluşturur. Tüm sağlık parametrelerini çapraz analiz eder.',
    'Sen deneyimli bir Klinik Beslenme Uzmanı, İç Hastalıkları Uzmanı ve Klinik Farmakoloji danışmanısın.

Aşağıdaki hasta verilerini dikkatlice analiz et ve kapsamlı bir değerlendirme raporu oluştur.

## HASTA VERİLERİ:

### Demografik Bilgiler:
{{patient_demographics}}

### Hastalıklar:
{{diseases}}

### Kullandığı İlaçlar:
{{medications}}

### Tahlil Sonuçları (Son Değerler + Trend):
{{lab_results}}

### Vücut Ölçümleri (Trend):
{{measurements}}

### Uygulanan Diyet Türü:
{{diet_type}}

### Klinik Notlar / Seyir:
{{clinical_notes}}

### Besin Tercihleri:
{{liked_disliked_foods}}

## HEDEF KİTLE: {{audience}}
(Eğer "doctor" ise klinik/teknik dil kullan. Eğer "patient" ise sade, motive edici, anlaşılır dilde yaz.)

## GÖREV:
Aşağıdaki başlıkları kapsayan detaylı bir analiz raporu oluştur. Her bölümde NEDEN-SONUÇ ilişkilerini açıkla.

Yanıtını aşağıdaki JSON şemasına STRICTLY uygun olarak ver:

{
  "summary": "Genel değerlendirme özeti (3-5 cümle)",
  "risk_factors": [
    { "title": "Risk başlığı", "severity": "high|medium|low", "details": "Detaylı açıklama" }
  ],
  "drug_interactions": [
    { "drug1": "İlaç 1", "drug2": "İlaç 2 veya besin/hastalık", "interaction": "Etkileşim açıklaması", "severity": "high|medium|low", "recommendation": "Öneri" }
  ],
  "nutrient_disease_links": [
    { "nutrient": "Besin/Mikrobesin", "disease": "Hastalık", "relationship": "İlişki türü ve açıklama", "recommendation": "Beslenme önerisi" }
  ],
  "diet_warnings": [
    { "warning": "Uyarı başlığı", "reason": "Neden", "suggestion": "Alternatif öneri" }
  ],
  "supplement_recommendations": [
    { "supplement": "Takviye adı", "reason": "Neden gerekli", "dosage_note": "Doz notu", "timing": "Ne zaman alınmalı" }
  ],
  "nutrition_advice": [
    { "food_group": "Besin grubu", "advice": "Öneri", "reason": "Neden" }
  ],
  "symptoms_to_watch": [
    { "symptom": "Belirti", "possible_cause": "Olası neden", "action": "Ne yapılmalı" }
  ],
  "additional_tests": [
    { "test": "Tahlil/Test adı", "reason": "Neden istenmeli" }
  ],
  "overall_recommendations": "Genel öneriler ve sonuç paragrafı"
}

Markdown kod bloğu kullanma. Sadece ham JSON döndür.',
    'gemini-2.0-flash',
    0.4
)
ON CONFLICT (key) DO UPDATE SET
    description = EXCLUDED.description,
    prompt_template = EXCLUDED.prompt_template,
    model = EXCLUDED.model,
    temperature = EXCLUDED.temperature,
    updated_at = NOW();
