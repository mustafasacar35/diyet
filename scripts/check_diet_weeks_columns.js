
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestWeek() {
    console.log('Checking latest diet_week slot_configs...');

    const { data: weeks, error } = await supabase
        .from('diet_weeks')
        .select('id, week_number, slot_configs, diet_plan_id')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (weeks && weeks.length > 0) {
        console.log('Latest Week:', weeks[0].week_number);
        console.log('Plan ID:', weeks[0].diet_plan_id);
        console.log('Slot Configs:', JSON.stringify(weeks[0].slot_configs, null, 2));
    } else {
        console.log('No weeks found.');
    }
}

checkLatestWeek();
