
const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://edcxbjneplsktmlrkvix.supabase.co';
const supabaseKey = 'YourActualSupabaseKey'; // Replace this with the actual key

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
    const { data, error } = await supabase
        .from('diet_days')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data from diet_days:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in diet_days:', Object.keys(data[0]));
        if ('is_active' in data[0]) {
            console.log('Column is_active EXISTS');
        } else {
            console.log('Column is_active MISSING');
        }
    } else {
        console.log('No data in diet_days to check columns');
    }
}

checkColumn();
