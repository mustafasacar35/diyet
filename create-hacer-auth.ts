/**
 * Create auth user for Hacer and link to existing patient
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const PATIENT_ID = "77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae"
const EMAIL = "hacer@demo.com"
const PASSWORD = "123456"

async function main() {
    if (!supabaseServiceKey) {
        console.log("❌ SUPABASE_SERVICE_ROLE_KEY missing!")
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log("🔍 Getting patient info...")

    // 1. Get patient
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', PATIENT_ID)
        .single()

    if (patientError || !patient) {
        console.log("❌ Patient not found:", patientError?.message)
        return
    }
    console.log(`✅ Found: ${patient.full_name}`)

    // 2. Create auth user
    console.log(`📧 Creating auth user: ${EMAIL}...`)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
            full_name: patient.full_name,
            role: 'patient'
        }
    })

    if (authError) {
        console.log("❌ Auth error:", authError.message)
        return
    }

    const authUserId = authData.user!.id
    console.log(`✅ Auth user created: ${authUserId}`)

    // 3. Create profile
    console.log("👤 Creating profile...")
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: authUserId,
            role: 'patient',
            full_name: patient.full_name,
            updated_at: new Date().toISOString()
        })

    if (profileError) {
        console.log("⚠️ Profile warning:", profileError.message)
    } else {
        console.log("✅ Profile created")
    }

    // 4. Update patient record
    console.log("🔗 Linking patient to auth user...")
    const { error: updateError } = await supabase
        .from('patients')
        .update({
            user_id: authUserId,
            email: EMAIL
        })
        .eq('id', PATIENT_ID)

    if (updateError) {
        console.log("⚠️ Update warning:", updateError.message)
    } else {
        console.log("✅ Patient linked")
    }

    console.log("\n" + "=".repeat(50))
    console.log("✨ BAŞARILI!")
    console.log("=".repeat(50))
    console.log(`📧 E-posta: ${EMAIL}`)
    console.log(`🔑 Şifre: ${PASSWORD}`)
    console.log(`👤 Hasta: ${patient.full_name}`)
    console.log(`🔗 Auth ID: ${authUserId}`)
    console.log("=".repeat(50))
}

main().catch(console.error)
