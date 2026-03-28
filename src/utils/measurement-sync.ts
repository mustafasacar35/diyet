import { SupabaseClient } from '@supabase/supabase-js'

export async function syncPatientWeightAndActivity(
    supabase: SupabaseClient,
    patientId: string,
    newWeight: number,
    newActivity: number,
    activeWeekId?: string | null
) {
    let success = true
    const errors: string[] = []

    try {
        // 1. Update Patient's Base Profile
        const { error: patientError } = await supabase
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
            const { error: weekError } = await supabase
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
        // First, find the "Weight" definition ID for this patient or globally
        const { data: defs } = await supabase
            .from('measurement_definitions')
            .select('id, name')
            .or(`patient_id.is.null,patient_id.eq.${patientId}`)

        const weightDef = defs?.find(d =>
            d.name.toLowerCase().includes('kilo') ||
            d.name.toLowerCase() === 'ağırlık'
        )

        if (weightDef) {
            const today = new Date().toISOString().split('T')[0]

            // Try to find if a record already exists for today
            const { data: existingLog } = await supabase
                .from('patient_measurements')
                .select('id, values')
                .eq('patient_id', patientId)
                .eq('date', today)
                .maybeSingle()

            if (existingLog) {
                // Update existing record for today
                const updatedValues = {
                    ...existingLog.values,
                    [weightDef.id]: newWeight
                }
                const { error: logError } = await supabase
                    .from('patient_measurements')
                    .update({ values: updatedValues })
                    .eq('id', existingLog.id)

                if (logError) {
                    errors.push(`Log update failed: ${logError.message}`)
                    success = false
                }
            } else {
                // Insert a new record for today
                const { error: logError } = await supabase
                    .from('patient_measurements')
                    .insert([{
                        patient_id: patientId,
                        date: today,
                        values: { [weightDef.id]: newWeight },
                        note: 'Sistem tarafından güncellendi (Profil/Panel)',
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
