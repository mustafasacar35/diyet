"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

/**
 * Synchronizes patient weight, activity and optionally other body measurements
 * across patient profile, current diet week, and measurement history.
 */
export async function syncPatientWeightAndActivityAction(
    patientId: string,
    newWeight: number,
    newActivity: number,
    activeWeekId?: string | null,
    updater: 'Hasta' | 'Diyetisyen' | 'Sistem' = 'Sistem',
    measurements?: Record<string, number>, // Additional body measurements
    weekNumber?: number
) {
    console.log("SYNC ACTION CALLED:", { patientId, newWeight, newActivity, activeWeekId, updater, measurements, weekNumber });
    let success = true
    const errors: string[] = []

    try {
        // 1. Update Patient's Base Profile
        const patientUpdate: any = {}
        if (newWeight && newWeight > 0) patientUpdate.weight = newWeight
        if (newActivity && newActivity > 0) patientUpdate.activity_level = newActivity

        if (Object.keys(patientUpdate).length > 0) {
            const { error: patientError } = await supabaseAdmin
                .from('patients')
                .update(patientUpdate)
                .eq('id', patientId)

            if (patientError) {
                errors.push(`Patient update failed: ${patientError.message}`)
                success = false
            }
        }

        // 2. Update Current Week log (if one is provided)
        if (activeWeekId) {
            const weekUpdate: any = {}
            if (newWeight && newWeight > 0) weekUpdate.weight_log = newWeight
            if (newActivity && newActivity > 0) weekUpdate.activity_level_log = newActivity

            if (Object.keys(weekUpdate).length > 0) {
                const { error: weekError } = await supabaseAdmin
                    .from('diet_weeks')
                    .update(weekUpdate)
                    .eq('id', activeWeekId)

                if (weekError) {
                    errors.push(`Week update failed: ${weekError.message}`)
                    success = false
                }
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
            
            // Search for an existing log for this week (via JSONB metadata) OR for today
            let existingLog = null
            
            // Try searching by week ID first (stronger link)
            if (activeWeekId) {
                const { data: weekLinkedLog } = await supabaseAdmin
                    .from('patient_measurements')
                    .select('id, values')
                    .eq('patient_id', patientId)
                    .contains('values', { _diet_week_id: activeWeekId })
                    .maybeSingle()
                
                existingLog = weekLinkedLog
            }

            // Fallback to today if no week link found
            if (!existingLog) {
                const { data: dailyLog } = await supabaseAdmin
                    .from('patient_measurements')
                    .select('id, values')
                    .eq('patient_id', patientId)
                    .eq('date', today)
                    .maybeSingle()
                
                existingLog = dailyLog
            }

            const noteText = updater === 'Sistem' 
                ? `Sistem tarafından güncellendi` 
                : `${updater} tarafından güncellendi (Plan Paneli)`

            const updatedValues: Record<string, any> = {
                ...(existingLog?.values || {}),
                [weightDef.id]: newWeight,
                // Inject metadata for weekly tracking
                _diet_week_id: activeWeekId || (existingLog?.values?._diet_week_id),
                _week_number: weekNumber || (existingLog?.values?._week_number)
            }

            // Merge additional measurements if provided
            if (measurements) {
                Object.entries(measurements).forEach(([defId, val]) => {
                    updatedValues[defId] = val
                })
            }

            if (existingLog) {
                const { error: logError } = await supabaseAdmin
                    .from('patient_measurements')
                    .update({ 
                        values: updatedValues, 
                        note: noteText,
                        updated_at: new Date().toISOString()
                    })
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
                        values: updatedValues,
                        note: noteText,
                        is_seen_by_dietitian: updater === 'Hasta' ? false : true,
                        created_by: null // Could set to auth.uid() if we had it here
                    }])

                if (logError) {
                    errors.push(`Log insert failed: ${logError.message}`)
                    success = false
                }
            }
        } else {
            console.warn("Weight measurement definition not found, skipping history log sync.")
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
