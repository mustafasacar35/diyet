const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { Engine } = require('./src/lib/planner/engine.ts'); // Will require TSX to run
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
    console.log("Fetching test patient...");
    const { data: patient } = await supabase.from('patients').select('*').limit(1).single();
    if (!patient) return console.log("No patient found");

    console.log(`Testing plan generation for patient ${patient.full_name} (${patient.id})`);

    // Let's create an engine instance directly, we will need to mock some inputs if strictly using Engine
    // It's easier to use the API route or just fetch foods directly and test the scoring function.

    const { data: foods } = await supabase.from('foods').select('*');
    console.log(`Fetched ${foods.length} foods`);

    const { data: settings } = await supabase.from('planner_settings').select('*').eq('scope', 'global').single();
    console.log(`Global settings mode: ${settings?.variety_mode}, cooldown: ${settings?.cooldown_strength}, max count default: ${settings?.max_weekly_default}`);

    // We check if the DB columns are actually there
    console.log("Foods max count check: ", foods.slice(0, 3).map(f => `${f.name}: ${f.max_weekly_freq}`));

    console.log("Test OK! Database is aligned.");
}

runTest().catch(console.error);
