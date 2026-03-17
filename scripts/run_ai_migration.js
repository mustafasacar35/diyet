require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
    const sqlFilePath = path.join(__dirname, '..', 'Supabase_Schema_AI.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running SQL migration from Supabase_Schema_AI.sql...');

    // Supabase JS client doesn't support raw SQL execution directly on the public API usually, 
    // but if we have the service role key and pg-functions or similar, we might. 
    // However, simpler is to use the dashboard or a direct PG connection. 
    // Since I don't have direct PG access here easily without installing pg, 
    // I will try to use the `rpc` if a tailored function exists, or just log instructions.

    // WAIT: The user has `scripts/run_migration_v52.js` in context. Let me see how they run migrations.
    // Viewing that file would be better.

    // For now, I'll assume we can't easily run raw SQL via JS SDK unless there's an `exec_sql` RPC.
    // I will check for an existing RPC for SQL execution.

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Error running migration via RPC:', error);
        console.log('If exec_sql RPC does not exist, please copy the content of Supabase_Schema_AI.sql and run it in the Supabase SQL Editor.');
    } else {
        console.log('Migration completed successfully via RPC.');
    }
}

runMigration();
