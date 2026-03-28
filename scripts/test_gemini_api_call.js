
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testGemini() {
    console.log('--- Testing Gemini API Logic ---');
    const medicationName = 'Ecopirin';

    // 1. Fetch Prompt
    let promptTemplate = '';
    let modelName = 'gemini-3-pro-preview';

    const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('key', 'medication_details')
        .single();

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log('Loaded Prompt from DB:', data.key);
    console.log('Model from DB:', data.model);
    promptTemplate = data.prompt_template;
    modelName = data.model;

    const prompt = promptTemplate.replace('{{medication_name}}', medicationName);

    // 2. Call Gemini
    console.log(`Calling Gemini (${modelName})...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('\n--- RAW RESPONSE ---');
        console.log(text);
        console.log('--------------------\n');

        // 3. Parse Logic (Simulated from route.ts)
        const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
        const match = text.match(jsonBlockRegex);
        let jsonString = match ? match[1] : text;
        jsonString = jsonString.trim();
        if (jsonString.startsWith('```')) jsonString = jsonString.replace(/^```(json)?/, '').replace(/```$/, '');

        const aiData = JSON.parse(jsonString);
        console.log('Parsed JSON Name:', aiData.name);

        const rules = (aiData.interaction_rules || []).flatMap(rule => {
            let keywords = [];
            if (Array.isArray(rule.target_keywords)) keywords = rule.target_keywords;
            else if (typeof rule.target_keywords === 'string') {
                if (rule.target_keywords.includes('/')) keywords = rule.target_keywords.split('/');
                else keywords = rule.target_keywords.split(',');
            }
            return keywords.map(k => k.trim()).filter(k => k.length > 0);
        });

        console.log(`Found ${rules.length} total keywords.`);
        console.log('Keywords:', rules);

    } catch (e) {
        console.error('Generative AI Error:', e);
    }
}

testGemini();
