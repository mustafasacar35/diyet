
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envLocal = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const envConfig = dotenv.parse(envLocal);

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
    // 1. Find a patient rule
    const { data: rules } = await supabase
        .from('planning_rules')
        .select('id, name')
        .eq('scope', 'patient')
        .limit(1);

    if (!rules || rules.length === 0) {
        console.log("No patient rules found to update. Please create a patient rule first via the app.");
        // Try to create one? Nah, too complex with patient_id.
        return;
    }

    const rule = rules[0];
    console.log(`Found rule: ${rule.name} (${rule.id}). Updating to pending...`);

    // 2. Update to pending
    const { error } = await supabase
        .from('planning_rules')
        .update({ pending_global_approval: true })
        .eq('id', rule.id);

    if (error) {
        console.error("Error updating rule:", error);
    } else {
        console.log("✅ Rule updated to pending_global_approval = true");
    }
}

run();
