"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

export async function syncPatientWeightAndActivityAction(
    patientId: string,
    newWeight: number,
    newActivity: number,
    activeWeekId?: string | null,
    updater: 'Hasta' | 'Diyetisyen' | 'Sistem' = 'Sistem'
) {
    console.log("SYNC ACTION CALLED:", { patientId, newWeight, newActivity, activeWeekId, updater });
    let success = true
    const errors: string[] = []

    try {
        // 1. Update Patient's Base Profile
        const { error: patientError } = await supabaseAdmin
            .from('patients')
            .update({
                weight: newWeight,
                activity_level: newActivity
            })
            .eq('id', patientId)

        if (patientError) {
            errors.push(`Patient update failed: ${patientError.message}`)
            success = false
        }

        // 2. Update Current Week log (if one is provided)
        if (activeWeekId) {
            const { error: weekError } = await supabaseAdmin
                .from('diet_weeks')
                .update({
                    weight_log: newWeight,
                    activity_level_log: newActivity
                })
                .eq('id', activeWeekId)

            if (weekError) {
                errors.push(`Week update failed: ${weekError.message}`)
                success = false
            }
        }

        // 3. Add to Measurement History
        const { data: defs } = await supabaseAdmin
            .from('measurement_definitions')
            .select('id, name')
            .or(`patient_id.is.null,patient_id.eq.${patientId}`)

        const weightDef = defs?.find(d =>
            d.name.toLowerCase().includes('kilo') ||
            d.name.toLowerCase() === 'ağırlık'
        )

        if (weightDef) {
            const today = new Date().toISOString().split('T')[0]

            const { data: existingLog } = await supabaseAdmin
                .from('patient_measurements')
                .select('id, values')
                .eq('patient_id', patientId)
                .eq('date', today)
                .maybeSingle()

            const noteText = `Sistem tarafından güncellendi (${updater} Paneli)`

            if (existingLog) {
                const updatedValues = {
                    ...existingLog.values,
                    [weightDef.id]: newWeight
                }
                const { error: logError } = await supabaseAdmin
                    .from('patient_measurements')
                    .update({ values: updatedValues, note: noteText })
                    .eq('id', existingLog.id)

                if (logError) {
                    errors.push(`Log update failed: ${logError.message}`)
                    success = false
                }
            } else {
                const { error: logError } = await supabaseAdmin
                    .from('patient_measurements')
                    .insert([{
                        patient_id: patientId,
                        date: today,
                        values: { [weightDef.id]: newWeight },
                        note: noteText,
                        is_seen_by_dietitian: false
                    }])

                if (logError) {
                    errors.push(`Log insert failed: ${logError.message}`)
                    success = false
                }
            }
        } else {
            console.warn("Weight measurement definition not found, skipping history log.")
        }

    } catch (err: any) {
        errors.push(`Unexpected sync error: ${err.message}`)
        success = false
    }

    return { success, errors }
}

export async function updateWeekWeightAction(weekId: string, newWeight: number) {
    const { error } = await supabaseAdmin.from('diet_weeks').update({ weight_log: newWeight }).eq('id', weekId)
    if (error) return { success: false, error: error.message }
    return { success: true }
}
