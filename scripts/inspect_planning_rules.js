
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

try {
    const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.local')));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.log('Could not load .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking planning_rules columns...');
    const { data, error } = await supabase
        .from('planning_rules')
        .select('*')
        .limit(1);

    if (error) {
        console.log('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('Table exists but empty. Cannot infer columns from rows.');
        // Fallback: try to select specific potential columns
        const { error: err2 } = await supabase.from('planning_rules').select('is_strict, force_apply').limit(1);
        if (err2) console.log('Select strict/force check:', err2.message);
    }
}

check();
