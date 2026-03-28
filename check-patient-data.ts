/**
 * Check existing data for Hacer Yılbaşı
 * Run: npx tsx check-patient-data.ts
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const PATIENT_ID = "77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae" // HACER YILBAŞI

async function main() {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    console.log("🔍 Checking patient data for HACER YILBAŞI...\n")

    // 1. Patient Info
    const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', PATIENT_ID)
        .single()

    console.log("📋 Patient Record:")
    console.log(JSON.stringify(patient, null, 2))
    console.log()

    // 2. Diet Plans
    const { data: plans, error: planError } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('patient_id', PATIENT_ID)

    if (planError) {
        console.log("❌ Plan Error:", planError.message)
    }
    console.log(`📊 Diet Plans (${plans?.length || 0}):`)
    if (plans) {
        for (const plan of plans) {
            console.log(`  - ${plan.title} (ID: ${plan.id})`)
            console.log(`    Status: ${plan.status}, Active: ${plan.is_active}`)
            console.log(`    Created: ${plan.created_at}`)
        }
    }
    console.log()

    // 3. Count weeks for each plan
    if (plans && plans.length > 0) {
        for (const plan of plans) {
            const { data: weeks } = await supabase
                .from('diet_weeks')
                .select('id, week_number, title')
                .eq('diet_plan_id', plan.id)
                .order('week_number')

            console.log(`📅 Weeks in "${plan.title}" (${weeks?.length || 0}):`)
            if (weeks) {
                for (const week of weeks) {
                    // Count days in this week
                    const { count: dayCount } = await supabase
                        .from('diet_days')
                        .select('*', { count: 'exact', head: true })
                        .eq('diet_week_id', week.id)

                    console.log(`  - Hafta ${week.week_number}: ${week.title || 'Başlıksız'} (${dayCount || 0} gün)`)
                }
            }
        }
    }
    console.log()

    // 4. Check if there are any measurements for this patient
    const { data: measurements, error: measError } = await supabase
        .from('patient_measurements')
        .select('*')
        .eq('patient_id', PATIENT_ID)
        .limit(5)

    if (measError) {
        console.log("📏 Measurements table might not exist:", measError.message)
    } else {
        console.log(`📏 Measurements: ${measurements?.length || 0} records`)
    }

    // 5. Check patient program assignment
    const { data: assignments, error: assignError } = await supabase
        .from('patient_assignments')
        .select('*')
        .eq('patient_id', PATIENT_ID)

    if (assignError) {
        console.log("👤 Assignments error:", assignError.message)
    } else {
        console.log(`👤 Assignments: ${assignments?.length || 0} records`)
        if (assignments) {
            console.log(JSON.stringify(assignments, null, 2))
        }
    }
}

main()
