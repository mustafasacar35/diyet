import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function useAiLimit() {
    const [aiEligibility, setAiEligibility] = useState<{
        isEligible: boolean;
        remainingCount: number | null;
        nextAvailableTime: Date | null;
        limitPeriodHours: number | null;
    }>({ isEligible: true, remainingCount: null, nextAvailableTime: null, limitPeriodHours: null })

    const [isLoadingLimit, setIsLoadingLimit] = useState(false)

    const checkAiEligibility = useCallback(async (patientId: string, actionType: 'photo' | 'search' = 'photo') => {
        setIsLoadingLimit(true)
        console.log(`[AI-LIMIT] checkAiEligibility called for ${actionType} with patientId:`, patientId)
        try {
            // Fetch limits (new specific ones or fallback to combined)
            const { data: patient, error: patientError } = await supabase
                .from('patients')
                .select('ai_photo_limit_count, ai_photo_limit_period_hours, ai_search_limit_count, ai_search_limit_period_hours, ai_analysis_limit_count, ai_analysis_limit_period_hours')
                .eq('id', patientId)
                .single()

            console.log("[AI-LIMIT] Patient query result:", { patient, patientError: patientError?.message })

            if (patientError || !patient) {
                console.warn("[AI-LIMIT] Patient not found or error, allowing unlimited")
                setAiEligibility({ isEligible: true, remainingCount: null, nextAvailableTime: null, limitPeriodHours: null })
                return true
            }

            // Determine which limits to use based on actionType
            let limitCount: number | null = null
            let limitHours: number | null = null

            if (actionType === 'photo') {
                limitCount = patient.ai_photo_limit_count ?? patient.ai_analysis_limit_count
                limitHours = patient.ai_photo_limit_period_hours ?? patient.ai_analysis_limit_period_hours
            } else {
                limitCount = patient.ai_search_limit_count ?? patient.ai_analysis_limit_count
                limitHours = patient.ai_search_limit_period_hours ?? patient.ai_analysis_limit_period_hours
            }

            limitCount = limitCount ? Number(limitCount) : null
            limitHours = limitHours ? Number(limitHours) : null

            console.log(`[AI-LIMIT] Resolved limits for ${actionType}:`, { limitCount, limitHours })

            if (!limitCount || !limitHours || isNaN(limitCount) || isNaN(limitHours)) {
                console.log("[AI-LIMIT] No limits configured for this type, allowing unlimited")
                setAiEligibility({ isEligible: true, remainingCount: null, nextAvailableTime: null, limitPeriodHours: null })
                return true
            }

            const timeThreshold = new Date(Date.now() - (limitHours * 60 * 60 * 1000)).toISOString()
            
            // Filter logs by type and time
            const logTypes = actionType === 'photo' ? ['ai_photo_analysis'] : ['ai_text_search']

            const { count, data, error } = await supabase
                .from('patient_activity_logs')
                .select('created_at', { count: 'exact', head: false })
                .eq('patient_id', patientId)
                .in('action_type', logTypes)
                .gte('created_at', timeThreshold)
                .order('created_at', { ascending: true })

            if (error || typeof count !== 'number') {
                console.error("[AI-LIMIT] Usage count query error:", error)
                setAiEligibility({ isEligible: true, remainingCount: null, nextAvailableTime: null, limitPeriodHours: null })
                return true
            }

            const isEligible = count < limitCount
            let nextAvailableTime: Date | null = null
            if (!isEligible && data && data.length > 0) {
                const oldestLogTime = new Date(data[0].created_at).getTime()
                nextAvailableTime = new Date(oldestLogTime + (limitHours * 60 * 60 * 1000))
            }

            console.log(`[AI-LIMIT] ${actionType} RESULT:`, { isEligible, count, limitCount, nextAvailableTime })

            setAiEligibility({
                isEligible,
                remainingCount: Math.max(0, limitCount - count),
                nextAvailableTime,
                limitPeriodHours: limitHours
            })
            
            return isEligible
        } finally {
            setIsLoadingLimit(false)
        }
    }, [])

    const recordAiUsage = useCallback(async (patientId: string, type: 'ai_photo_analysis' | 'ai_text_search') => {
        console.log("[AI-LIMIT] recordAiUsage called:", { patientId, type })
        
        let clientIp = 'Bilinmiyor';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            clientIp = ipData.ip || 'Bilinmiyor';
        } catch { }

        const { error } = await supabase.from('patient_activity_logs').insert({
            patient_id: patientId,
            action_type: type,
            metadata: { ip_address: clientIp }
        })
        
        if (error) {
            console.error("[AI-LIMIT] FAILED to insert usage log:", error.message, error.details, error.hint)
        } else {
            console.log("[AI-LIMIT] Successfully recorded usage log for", patientId, type)
        }
    }, [])

    return { aiEligibility, isLoadingLimit, checkAiEligibility, recordAiUsage }
}
