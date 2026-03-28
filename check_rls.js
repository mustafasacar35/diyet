
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkRLS() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', 'food_management_options')
            .single();

        if (error) {
            console.error('RLS/Fetch Error:', error.message);
        } else {
            console.log('Success - Settings fetched:', JSON.stringify(data.value, null, 2));
        }
    } catch (e) {
        console.error('Unexpected Error:', e.message);
    }
}
checkRLS();
