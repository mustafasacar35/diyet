import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing environment variables.")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testFK() {
    console.log("Creating test user in auth...")
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: 'test_fk_error_user_2_' + Date.now() + '@example.com',
        password: 'password123',
        email_confirm: true
    })

    if (authErr) {
        console.error("Auth creation failed:", authErr)
        return
    }

    const userId = authData.user.id
    console.log("Created Auth User:", userId)

    // Check profile
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', userId).single()
    console.log("Auto-created profile:", prof)

    console.log("Updating Profile instead of inserting...")
    const { error: profileErr } = await supabase.from('profiles').update({
        role: 'patient',
        full_name: 'Test FK User 2'
    }).eq('id', userId)

    if (profileErr) {
        console.error("Profile update failed:", profileErr)
        return
    }

    console.log("Creating Patient...")
    const { error: patientErr } = await supabase.from('patients').insert({
        id: userId,
        user_id: userId,
        email: authData.user.email,
        full_name: 'Test FK User 2',
        gender: 'male',
        status: 'pending'
    })

    if (patientErr) {
        console.error("Patient creation failed:", patientErr)
        return
    }
    console.log("Patient created successfully!")
}

testFK()
