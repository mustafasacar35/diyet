/* eslint-disable @typescript-eslint/no-var-requires */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic .env parser since dotenv might not be installed or configured for this script
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            content.split('\n').forEach(line => {
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // simple unquote
                    process.env[key] = value;
                }
            });
        }
    } catch (e) {
        console.error('Failed to load .env.local', e);
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
    console.error('Make sure .env.local exists in project root.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
    'patients',
    'diet_plans',
    'diet_weeks',
    'diet_days',
    'diet_meals',
    'foods',
    'diet_types',
    'patient_notes',
    'measurements',
    'lab_results',
    'diseases',
    'medications',
    'micronutrients',
    'meal_definitions',
    'system_prompts',
    'planning_rules',
    'planner_settings',
    'user_profiles',
    'food_micronutrients',
    'food_alternatives', // if exists
    'recipes', // if exists
    'recipe_ingredients' // if exists
];

async function backup() {
    const dateStr = new Date().toISOString().split('T')[0];
    const outDir = path.join(__dirname, `../backups/${dateStr}`);

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log(`Starting backup to ${outDir}...`);

    for (const table of TABLES) {
        process.stdout.write(`Fetching ${table}... `);
        try {
            // Fetch up to 10000 rows. For larger tables, pagination is needed.
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(10000);

            if (error) {
                if (error.code === '42P01') { // undefined_table
                    console.log(`[SKIP] Table not found.`);
                } else {
                    console.log(`[ERROR] ${error.message}`);
                }
                continue;
            }

            if (!data || data.length === 0) {
                console.log(`[EMPTY] 0 rows.`);
                // Save empty array to confirm check
                const filePath = path.join(outDir, `${table}.json`);
                fs.writeFileSync(filePath, JSON.stringify([], null, 2));
                continue;
            }

            const filePath = path.join(outDir, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`[OK] Saved ${data.length} rows.`);
        } catch (e) {
            console.log(`[EXCEPTION] ${e.message}`);
        }
    }

    console.log('\nBackup complete.');
    console.log(`Files saved in: ${outDir}`);
}

backup();
