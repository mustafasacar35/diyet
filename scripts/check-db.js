const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await sb.from('diet_weeks').select('id, title, weight_log, start_date, diet_plans!inner(patient_id)').eq('diet_plans.patient_id', '8e89f7b8-06da-461e-9c91-9566382954a1');
    console.log("Error:", error);
    console.log("Data:", JSON.stringify(data, null, 2));

    const { data: p } = await sb.from('patients').select('weight').eq('id', '8e89f7b8-06da-461e-9c91-9566382954a1');
    console.log("Patient Data:", JSON.stringify(p, null, 2));
}

check();
