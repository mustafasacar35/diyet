const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase.from('foods').select('role, category').eq('category', 'KAHVALTI');

    if (error) {
        console.error(error);
        return;
    }

    const roleCounts = {};
    for (const item of data) {
        roleCounts[item.role] = (roleCounts[item.role] || 0) + 1;
    }

    console.log("KAHVALTI Roles:", roleCounts);
}

main();
