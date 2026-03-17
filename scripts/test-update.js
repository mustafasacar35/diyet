const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log("Fetching active week for patient 8e89f7b8-06da-461e-9c91-9566382954a1");
    // Get plan and week
    const { data: plans } = await supabaseAdmin.from('diet_plans').select('id, diet_weeks(id)').eq('patient_id', '8e89f7b8-06da-461e-9c91-9566382954a1').eq('status', 'active');

    if (!plans || plans.length === 0) return console.log("No active plan");
    const weekId = plans[0].diet_weeks[0].id;
    console.log("Week ID:", weekId);

    // Simulate updating weight
    const { data, error } = await supabaseAdmin
        .from('diet_weeks')
        .update({
            weight_log: 58.4,
            activity_level_log: 3
        })
        .eq('id', weekId)
        .select();

    console.log("Update Error:", error);
    console.log("Update Data:", JSON.stringify(data, null, 2));
}

testUpdate();
