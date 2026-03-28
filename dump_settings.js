
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function dumpSettings() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('key', 'food_management_options')
            .single();

        if (error) throw error;
        console.log('--- JSON START ---');
        console.log(JSON.stringify(data, null, 2));
        console.log('--- JSON END ---');
    } catch (e) {
        console.error('Error:', e.message);
    }
}
dumpSettings();
