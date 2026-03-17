
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMeta() {
    const { data, error } = await supabase
        .from('diet_meals')
        .select('id, meal_time, foods(name), generation_meta')
        .not('generation_meta', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent Meals Meta:', JSON.stringify(data, null, 2));
    }
}

checkMeta();
