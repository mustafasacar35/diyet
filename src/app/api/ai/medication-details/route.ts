import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Initialize Supabase Admin Client (Lazy loaded via lib/supabase-admin)
// const supabaseAdmin = ... (Removed manual init)

const DEFAULT_PROMPT = `You are an expert Clinical Pharmacist and Functional Medicine Practitioner specializing in Drug-Nutrient Interactions. 
Your task is to analyze the medication "{{medication_name}}" and generate a detailed JSON object strictly following the provided schema.

Your analysis must go beyond basic warnings. You must identify:
1. "Mechanism": Explain the biochemical reason (e.g., CYP450 inhibition, Chelation, Vitamin K antagonism, Potassium sparing).
2. "Target Keywords": A slash-separated string of specific food names and tags that the software should look for (e.g., "Ispanak/Pazı/Roka").
3. "Clinical Advice": Actionable advice for the patient (e.g., "Separate by 2 hours", "Maintain consistent intake", "Strictly avoid").

### JSON SCHEMA (Strictly Follow This):
{
  "name": "Standardized Drug Name (TR)",
  "generic_name": "Active Ingredient (TR)",
  "category": "Specific medical category (TR) (e.g. Antihipertansif, Antikoagülan, NSAID, PPI).",
  "description": "Detailed clinical description focusing on mechanism of action (TR).",
  "interaction_rules": [
    {
      "target_keywords": "Slash separated list of specific foods/tags (e.g. 'Greyfurt/Pomelo/Turunç')",
      "severity": "strict_block" | "consistency_warning" | "timing_restriction" | "beneficial_pairing",
      "mechanism": "Detailed explanation of WHY this interaction happens (TR). Mention enzymes, absorption, or metabolism.",
      "clinical_advice": "Specific instruction for the patient (TR). (e.g., 'İlacı aldıktan 2 saat sonra tüketin' or 'Tamamen yasaklayın')."
    }
  ]
}

### ONE-SHOT EXAMPLE (Model Your Output Exactly Like This):
Input: "Coumadin"
Output:
{
  "name": "Coumadin",
  "generic_name": "Varfarin Sodyum",
  "category": "Antikoagülan",
  "description": "K vitamini antagonistidir. Pıhtılaşma faktörlerinin sentezini engelleyerek kanı sulandırır. Terapötik aralığı (INR) dardır, beslenme ile çok etkileşir.",
  "interaction_rules": [
    {
      "target_keywords": "Ispanak/Pazı/Brokoli/Brüksel Lahanası/Semizotu/Roka/Maydanoz",
      "severity": "consistency_warning",
      "mechanism": "Bu sebzeler yüksek K Vitamini içerir. K vitamini, ilacın bloke etmeye çalıştığı pıhtılaşma yolağını aktive eder ve ilacın etkisini sıfırlar (INR düşer).",
      "clinical_advice": "Tamamen yasak değildir. Ancak 'SABİT MİKTAR' kuralı uygulanmalıdır. Her gün 1 porsiyon yiyorsanız, bunu değiştirmeyin. Ani artış veya azalış yapmayın."
    },
    {
      "target_keywords": "Greyfurt/Greyfurt Suyu/Pomelo",
      "severity": "strict_block",
      "mechanism": "Greyfurt, karaciğerde ilacı parçalayan CYP2C9 enzimini bloke eder. İlaç kanda birikir ve zehirlenme/kanama riski yaratır.",
      "clinical_advice": "İlaç kullanıldığı sürece bu meyvelerden kesinlikle uzak durulmalıdır."
    }
  ]
}

### YOUR TASK:
Generate the JSON for: "{{medication_name}}"
Do not output markdown code blocks. Return only the raw JSON string.`;

export async function POST(req: NextRequest) {
    try {
        const { medicationName } = await req.json();

        if (!medicationName) {
            return NextResponse.json({ error: 'Medication name is required' }, { status: 400 });
        }

        if (!genAI) {
            return NextResponse.json({ error: 'Gemini API not configured' }, { status: 503 });
        }

        // 1. Fetch system prompt (Try DB first, fall back to default)
        let promptTemplate = DEFAULT_PROMPT;
        // Upgraded to gemini-3-pro-preview as requested by user
        let modelName = 'gemini-3-pro-preview';

        try {
            const { data: promptData, error: promptError } = await supabaseAdmin
                .from('system_prompts')
                .select('*')
                .eq('key', 'medication_details')
                .single();

            if (!promptError && promptData) {
                promptTemplate = promptData.prompt_template;
                // If DB has a model, use it, but prefer the known working 3.0 one
                if (promptData.model && !promptData.model.includes('pro') && !promptData.model.includes('1.5') && !promptData.model.includes('2.0')) {
                    modelName = promptData.model;
                }
            }
        } catch (dbError) {
            console.error('Database connection error:', dbError);
        }

        const prompt = promptTemplate.replace('{{medication_name}}', medicationName);

        // 2. Call Gemini
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 3. Parse JSON
        // Gemini might wrap output in markdown code blocks like ```json ... ```
        const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = text.match(jsonBlockRegex);
        let jsonString = match ? match[1] : text;

        console.log("--- GEMINI RAW RESPONSE ---\n", text, "\n---------------------------");

        // Clean up
        jsonString = jsonString.trim();
        if (jsonString.startsWith('```')) {
            jsonString = jsonString.replace(/^```(json)?/, '').replace(/```$/, '');
        }

        let aiData;
        try {
            aiData = JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse Gemini response:', text);
            return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
        }

        // 4. Transform Data for Frontend
        // The frontend expects: 
        // interaction_rules: [{ keyword, rule_type, match_name, match_tags, notes }]

        const interaction_rules = (aiData.interaction_rules || []).flatMap((rule: any) => {
            let keywords: string[] = [];

            // Handle different formats for target_keywords
            if (Array.isArray(rule.target_keywords)) {
                // If AI returns an array, join them with slash for grouping
                keywords = [rule.target_keywords.join(' / ')];
            } else if (typeof rule.target_keywords === 'string') {
                // Keep as is (allow slash separated)
                keywords = [rule.target_keywords];
            }

            // Clean up keywords
            keywords = keywords.map((k: string) => k.trim()).filter((k: string) => k.length > 0);

            // Map Severity to Frontend Rule Type
            let ruleType = 'negative'; // Default strict
            if (rule.severity === 'consistency_warning' || rule.severity === 'timing_restriction') {
                ruleType = 'warning';
            } else if (rule.severity === 'beneficial_pairing') {
                ruleType = 'positive';
            }

            // Create a rule (One rule per grouped keyword string)
            return keywords.map((k: string) => ({
                keyword: k,
                rule_type: ruleType,
                match_name: true,
                match_tags: true,
                mechanism: rule.mechanism,
                clinical_advice: rule.clinical_advice,
                // Combine Mechanism + Clinical Advice into Notes (keep for backward compat or other uses)
                notes: `[MEKANİZMA]: ${rule.mechanism}\n\n[TAVSİYE]: ${rule.clinical_advice}`
            }));
        });

        return NextResponse.json({
            name: aiData.name,
            generic_name: aiData.generic_name,
            category: aiData.category,
            description: aiData.description,
            interaction_rules: interaction_rules
        });

    } catch (error: any) {
        console.error('AI API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
