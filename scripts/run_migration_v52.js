
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const sqlPath = path.join(__dirname, '../Supabase_Schema_Update_v52_PlannerSettingsRLS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration:', sqlPath);

    // Split by semicolon to run statements individually if needed, but for policies it's better as one block usually.
    // However, supabase-js doesn't have a direct SQL execution method unless via RPC.

    // Fallback: Using RPC "exec_sql" if it exists, otherwise warn.
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.error('RPC Error:', error);
        console.log('Trying alternative RPC names (execute_sql)...');
        const { data: d2, error: e2 } = await supabase.rpc('execute_sql', { sql_query: sql });
        if (e2) console.error('RPC execute_sql Error:', e2);
        else console.log('Migration successful via execute_sql');
    } else {
        console.log('Migration successful via exec_sql');
    }
}

runMigration();
