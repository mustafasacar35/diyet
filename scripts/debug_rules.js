
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envConfig = dotenv.parse(envLocal);

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("--- Checking Planning Rules Schema & Data ---");

    // 1. Check if we can select 'pending_global_approval'
    const { data: checkCol, error: colError } = await supabase
        .from('planning_rules')
        .select('id, pending_global_approval')
        .limit(1);

    if (colError) {
        console.error("❌ Error selecting pending_global_approval column:", colError.message);
        console.log("It seems the schema update hasn't been applied.");
    } else {
        console.log("✅ Column 'pending_global_approval' exists.");
    }

    // 2. Count pending rules
    const { count, error: countError } = await supabase
        .from('planning_rules')
        .select('*', { count: 'exact', head: true })
        .eq('pending_global_approval', true);

    if (countError) {
        console.error("❌ Error counting pending rules:", countError.message);
    } else {
        console.log(`ℹ️ Found ${count} rules waiting for approval.`);
    }

    // 3. Test the Join Query
    console.log("\n--- Testing Join Query ---");
    const { data: joinData, error: joinError } = await supabase
        .from('planning_rules')
        .select(`
            id,
            name,
            pending_global_approval,
            patients (
                first_name,
                last_name
            )
        `)
        .eq('pending_global_approval', true);

    if (joinError) {
        console.error("❌ Join Query Error:", joinError.message);
        console.log("Hint: Check foreign key relationships explicitly.");
    } else if (joinData) {
        console.log(`✅ Join Query Success. Returned ${joinData.length} rows.`);
        if (joinData.length > 0) {
            console.log("Sample Data:", JSON.stringify(joinData[0], null, 2));
        }
    }
}

check();
