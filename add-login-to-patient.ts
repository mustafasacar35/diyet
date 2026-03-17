/**
 * Quick script to add login credentials to a legacy patient
 * Run: npx tsx add-login-to-patient.ts
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// === CONFIGURATION ===
const PATIENT_ID = "77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae" // HACER YILBAŞI
const NEW_EMAIL = "hacer@demo.com"
const NEW_PASSWORD = "123456"
// =====================

async function main() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing environment variables!")
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    console.log("🔍 Finding patient...")

    // 1. Get patient info
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', PATIENT_ID)
        .single()

    if (patientError || !patient) {
        console.error("❌ Patient not found:", patientError)
        process.exit(1)
    }

    console.log(`✅ Found patient: ${patient.full_name}`)

    // 2. Create Auth User
    console.log(`📧 Creating auth account for ${NEW_EMAIL}...`)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: NEW_EMAIL,
        password: NEW_PASSWORD,
        email_confirm: true,
        user_metadata: {
            full_name: patient.full_name,
            role: 'patient'
        }
    })

    if (authError) {
        console.error("❌ Auth error:", authError.message)
        process.exit(1)
    }

    const authUserId = authData.user!.id
    console.log(`✅ Auth user created: ${authUserId}`)

    // 3. Create profile
    console.log("👤 Creating profile...")
    await supabase
        .from('profiles')
        .upsert({
            id: authUserId,
            role: 'patient',
            full_name: patient.full_name,
            updated_at: new Date().toISOString()
        })

    // 4. Update patient record to link
    console.log("🔗 Linking to patient record...")
    const { error: updateError } = await supabase
        .from('patients')
        .update({
            email: NEW_EMAIL,
            user_id: authUserId
        })
        .eq('id', PATIENT_ID)

    if (updateError) {
        console.error("⚠️ Patient update warning:", updateError.message)
    }

    console.log("\n" + "=".repeat(50))
    console.log("✨ SUCCESS!")
    console.log("=".repeat(50))
    console.log(`📧 E-posta: ${NEW_EMAIL}`)
    console.log(`🔑 Şifre: ${NEW_PASSWORD}`)
    console.log(`👤 Hasta: ${patient.full_name}`)
    console.log("=".repeat(50))
    console.log("\nNow this patient can login to the Patient Portal!")
}

main()
