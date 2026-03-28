const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('patient_measurements')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns found:', Object.keys(data[0]));
  } else {
    // If no data, we can try to get the table definition via RPC or just assume it's empty
    console.log('No data found to infer columns. Attempting to select specific columns...');
    const { error: colError } = await supabase
      .from('patient_measurements')
      .select('diet_week_id')
      .limit(1);
    
    if (colError) {
      console.log('diet_week_id does NOT exist.');
    } else {
      console.log('diet_week_id exists.');
    }
  }
}

check();
