
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
    console.log('Checking planner_settings...');

    const { data, error } = await supabase
        .from('planner_settings')
        .select('*')
        .eq('scope', 'global');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Global Settings Found:', data.length);
    if (data.length > 0) {
        console.log('Slot Config:', JSON.stringify(data[0].slot_config, null, 2));
    } else {
        console.log('No global settings found.');

        // Check for any settings
        const { data: all, error: err2 } = await supabase.from('planner_settings').select('*').limit(5);
        console.log('Any settings found?', all?.length);
        if (all?.length) console.log('First setting scope:', all[0].scope);
    }
}

checkSettings();
