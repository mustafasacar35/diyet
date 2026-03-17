/**
 * Debug: Check all profiles and auth users
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
    console.log("URL:", supabaseUrl)
    console.log("Key exists:", !!supabaseServiceKey)
    console.log("Key prefix:", supabaseServiceKey?.substring(0, 20) + "...")

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. List all profiles
    console.log("\n📋 All Profiles:")
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .limit(20)

    if (profileError) {
        console.log("Profile error:", profileError.message)
    } else {
        profiles?.forEach(p => console.log(`  - ${p.full_name} (${p.role}) - ${p.id}`))
    }

    // 2. List auth users
    console.log("\n👤 Auth Users (page 1):")
    const { data, error: authError } = await supabase.auth.admin.listUsers({ perPage: 20 })

    if (authError) {
        console.log("Auth error:", authError.message)
    } else {
        console.log(`Found ${data?.users?.length || 0} users`)
        data?.users?.forEach(u => console.log(`  - ${u.email} - ${u.id}`))
    }

    // 3. Check if hacer is in patients
    console.log("\n🏥 Patients with HACER:")
    const { data: patients } = await supabase
        .from('patients')
        .select('id, full_name, email, user_id')
        .ilike('full_name', '%HACER%')

    patients?.forEach(p => console.log(`  - ${p.full_name} | email: ${p.email} | user_id: ${p.user_id}`))
}

main().catch(console.error)
