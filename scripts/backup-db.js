const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Supabase credentials not found in .env.local');
    process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  Warning: Using ANON KEY. Some data might be restricted by RLS. Use SUPABASE_SERVICE_ROLE_KEY for full backup.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// List of tables to backup
const TABLES = [
    'patients',
    'foods',
    'food_micronutrients',
    'diet_types',
    'diet_plans',
    'diet_weeks',
    'diet_days',
    'diet_meals',
    'diet_snapshots',
    'diseases',
    'disease_rules',
    'patient_diseases',
    'patient_lab_results',
    'patient_medications',
    'medication_interactions',
    'planner_settings',
    'measurements',
    'checklist_logs'
];

async function backup() {
    try {
        console.log(`🔌 Connecting to Supabase: ${SUPABASE_URL}`);

        // 1. Create backup directory with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, '../backups', timestamp);

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        console.log(`📂 Backup directory created: ${backupDir}`);

        // 2. Dump each table to JSON
        for (const table of TABLES) {
            process.stdout.write(`⏳ Backing up table: ${table}... `);

            // Fetch all rows (using pagination if needed, but for simplicity fetching max 100000 rows?)
            // Supabase limits result size. We should paginate.

            let allRows = [];
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            try {
                // First check if table exists or is accessible by fetching 1 row
                const check = await supabase.from(table).select('count', { count: 'exact', head: true });
                if (check.error) {
                    console.log(`❌ Failed: ${check.error.message}`);
                    continue;
                }

                while (hasMore) {
                    const { data, error } = await supabase
                        .from(table)
                        .select('*')
                        .range(page * pageSize, (page + 1) * pageSize - 1);

                    if (error) throw error;

                    if (data.length > 0) {
                        allRows = allRows.concat(data);
                        page++;
                        if (data.length < pageSize) hasMore = false;
                    } else {
                        hasMore = false;
                    }
                }

                const filePath = path.join(backupDir, `${table}.json`);
                fs.writeFileSync(filePath, JSON.stringify(allRows, null, 2));
                console.log(`✅ Saved ${allRows.length} rows`);

            } catch (err) {
                console.log(`❌ Error: ${err.message}`);
            }
        }

        console.log('\n🎉 Backup completed successfully!');
        console.log(`📍 Location: ${backupDir}`);

    } catch (err) {
        console.error('❌ Backup process failed:', err);
    }
}

backup();
