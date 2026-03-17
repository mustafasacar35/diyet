
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
    const output = ["--- DEBUGGING DIET RULES ---"];

    // 1. Fetch ALL Rules (no filter)
    const { data: rules, error: rulesError } = await supabase
        .from('planning_rules')
        .select('*');

    if (rulesError) {
        output.push("Error fetching rules: " + JSON.stringify(rulesError));
    } else {
        output.push(`Found ${rules.length} rules in total:`);
        rules.forEach(r => {
            output.push(`- Rule [${r.name}] (Type: ${r.rule_type}, Active: ${r.is_active})`);
            output.push(`  Definition: ${JSON.stringify(r.definition, null, 2)}`);
        });
    }

    output.push("\n--- INSPECTING TARGET FOODS ---");

    // 2. Search for Kuruyemiş - by role
    const { data: nutsRole } = await supabase
        .from('foods')
        .select('id, name, category, role')
        .eq('role', 'nuts')
        .limit(5);

    if (nutsRole && nutsRole.length > 0) {
        output.push(`\nItems with role='nuts':`);
        nutsRole.forEach(f => output.push(`  - [${f.name}] Category: '${f.category}'`));
    } else {
        output.push(`\nNo items found with role='nuts'`);
    }

    // 3. Search for Kuruyemiş - by category (case variations)
    const { data: nutsCat } = await supabase
        .from('foods')
        .select('id, name, category, role')
        .ilike('category', '%kuruyemiş%')
        .limit(5);

    if (nutsCat && nutsCat.length > 0) {
        output.push(`\nItems with category like 'kuruyemiş':`);
        nutsCat.forEach(f => output.push(`  - [${f.name}] Category: '${f.category}', Role: '${f.role}'`));
    } else {
        output.push(`\nNo items found with category like 'kuruyemiş'`);
    }

    // 4. Get DISTINCT roles from foods table
    const { data: allFoods } = await supabase
        .from('foods')
        .select('role');

    if (allFoods) {
        const roles = [...new Set(allFoods.map(f => f.role).filter(Boolean))];
        output.push(`\n--- ALL DISTINCT ROLES IN DB ---`);
        output.push(roles.join(', '));
    }

    // 5. Get DISTINCT categories from foods table
    const { data: allCats } = await supabase
        .from('foods')
        .select('category');

    if (allCats) {
        const cats = [...new Set(allCats.map(f => f.category).filter(Boolean))];
        output.push(`\n--- ALL DISTINCT CATEGORIES IN DB ---`);
        output.push(cats.join(', '));
    }

    fs.writeFileSync('rules_dump.txt', output.join('\n'), 'utf8');
    console.log("Dump written to rules_dump.txt");
}

run();
