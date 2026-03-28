require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnostic() {
  const { data, error } = await supabase.from('user_management_view').select('id, full_name, valid_until').limit(3)
  if (error) console.log('ERROR:', error.message)
  else console.log('VIEW_DATA:', JSON.stringify(data, null, 2))
}

diagnostic()
