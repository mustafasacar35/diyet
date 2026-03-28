const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
    const { data: plans, error } = await sb.from('diet_plans').select('id, status, created_at, diet_weeks(id, title, weight_log, start_date)').eq('patient_id', '8e89f7b8-06da-461e-9c91-9566382954a1');
    if (error) console.error("Error:", error);
    require('fs').writeFileSync('plans.json', JSON.stringify(plans, null, 2));
}

checkPlans();
