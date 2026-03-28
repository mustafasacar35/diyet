
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
        });
        return env;
    } catch (e) {
        console.error("Could not load .env.local", e.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const output = [];

    // Get items in KURUYEMİŞLER category
    const { data: kuruyemis } = await supabase
        .from('foods')
        .select('id, name, category, role, meal_types')
        .eq('category', 'KURUYEMİŞLER')
        .limit(10);

    if (kuruyemis && kuruyemis.length > 0) {
        output.push(`--- Items in KURUYEMİŞLER category ---`);
        kuruyemis.forEach(f => {
            output.push(`[${f.name}] Role: '${f.role}', MealTypes: [${f.meal_types}]`);
        });
    } else {
        output.push(`No items found in KURUYEMİŞLER category`);
    }

    // Get items in EKMEKLER category
    const { data: ekmek } = await supabase
        .from('foods')
        .select('id, name, category, role, meal_types')
        .eq('category', 'EKMEKLER')
        .limit(5);

    if (ekmek && ekmek.length > 0) {
        output.push(`\n--- Items in EKMEKLER category ---`);
        ekmek.forEach(f => {
            output.push(`[${f.name}] Role: '${f.role}', MealTypes: [${f.meal_types}]`);
        });
    }

    // Get items in ÇORBALAR category
    const { data: corba } = await supabase
        .from('foods')
        .select('id, name, category, role, meal_types')
        .eq('category', 'ÇORBALAR')
        .limit(5);

    if (corba && corba.length > 0) {
        output.push(`\n--- Items in ÇORBALAR category ---`);
        corba.forEach(f => {
            output.push(`[${f.name}] Role: '${f.role}', MealTypes: [${f.meal_types}]`);
        });
    }

    fs.writeFileSync('category_dump.txt', output.join('\n'), 'utf8');
    console.log("Dump written to category_dump.txt");
}

run();
