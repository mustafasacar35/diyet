/**
 * Fix Hacer's user_id to match auth user
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Find auth user for hacer@demo.com
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const hacerAuth = users?.find(u => u.email === "hacer@demo.com")

    if (!hacerAuth) {
        console.log("❌ hacer@demo.com not found in auth.users")
        return
    }

    console.log(`✅ Auth user found: ${hacerAuth.id}`)

    // 2. Update patients.user_id to match auth user
    const PATIENT_ID = "77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae"

    const { error } = await supabase
        .from('patients')
        .update({ user_id: hacerAuth.id })
        .eq('id', PATIENT_ID)

    if (error) {
        console.log("❌ Update error:", error.message)
    } else {
        console.log("✅ Patient user_id updated to match auth user")
    }

    // Verify
    const { data: patient } = await supabase
        .from('patients')
        .select('id, full_name, user_id, email')
        .eq('id', PATIENT_ID)
        .single()

    console.log("\n📋 Updated patient:")
    console.log(patient)
}

main()
