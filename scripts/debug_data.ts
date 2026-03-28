
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugData() {
    console.log('Fetching Diet Types...')
    const { data: dietTypes, error: dietError } = await supabase
        .from('diet_types')
        .select('*')

    if (dietError) {
        console.error('Error fetching diet types:', dietError)
    }

    console.log('Fetching Sample Foods (LowCarb/Keto)...')
    const { data: foods, error: foodError } = await supabase
        .from('foods')
        .select('name, lowcarb, keto, id')
        .or('lowcarb.eq.true,keto.eq.true')
        .limit(50)

    if (foodError) {
        console.error('Error fetching foods:', foodError)
    }

    const output = {
        dietTypes: dietTypes || [],
        foods: foods || [],
        error: dietError || foodError
    }

    fs.writeFileSync('debug_result.json', JSON.stringify(output, null, 2))
    console.log('Results written to debug_result.json')
}

debugData()
