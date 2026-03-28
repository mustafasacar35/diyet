require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnostic() {
  console.log('--- START DIAGNOSTIC ---')
  
  const { data: viewData, error: viewError } = await supabase.from('user_management_view').select('*').limit(1)
  if (viewError) {
    console.error('VIEW ERROR:', viewError.message)
  } else if (viewData && viewData.length > 0) {
    console.log('VIEW COLUMNS:', JSON.stringify(Object.keys(viewData[0])))
    console.log('SAMPLE DATA:', JSON.stringify(viewData[0]))
  } else {
    console.log('VIEW IS EMPTY')
  }

  const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').limit(1)
  if (profileError) {
    console.error('PROFILE TABLE ERROR:', profileError.message)
  } else if (profileData && profileData.length > 0) {
    console.log('PROFILE TABLE COLUMNS:', JSON.stringify(Object.keys(profileData[0])))
  }
  
  console.log('--- END DIAGNOSTIC ---')
}

diagnostic()
