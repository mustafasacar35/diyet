/**
 * Find hacer@demo.com by email and link to patient
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const PATIENT_ID = "77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae"
const EMAIL = "hacer@demo.com"

async function main() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log("🔍 Finding hacer@demo.com...")

    // Method 1: Search in profiles by email pattern
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .ilike('full_name', '%HACER%')
        .limit(5)

    console.log("Profiles with HACER:", profile)

    // Method 2: Get user by email using admin API  
    // listUsers has pagination, search through all pages
    let page = 1
    let found = null

    while (true) {
        const { data: { users } } = await supabase.auth.admin.listUsers({
            page: page,
            perPage: 100
        })

        if (!users || users.length === 0) break

        const hacer = users.find(u => u.email === EMAIL)
        if (hacer) {
            found = hacer
            break
        }

        page++
        if (page > 10) break // Safety limit
    }

    if (found) {
        console.log(`✅ Found auth user: ${found.id}`)

        // Update patient
        const { error } = await supabase
            .from('patients')
            .update({ user_id: found.id, email: EMAIL })
            .eq('id', PATIENT_ID)

        if (error) {
            console.log("❌ Update error:", error.message)
        } else {
            console.log("✅ Patient linked to auth user")
        }
    } else {
        console.log("❌ Auth user not found in any page")

        // List all users for debugging
        const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 50 })
        console.log("\nAll auth users:")
        allUsers?.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    }
}

main().catch(console.error)
