"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export function usePlannerMetadata() {
    const [categories, setCategories] = useState<string[]>([])
    const [roles, setRoles] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMetadata() {
            setLoading(true)

            try {
                // 1. First attempt to fetch dynamic options from app_settings
                const { data: settingsData } = await supabase
                    .from('app_settings')
                    .select('value')
                    .eq('key', 'food_management_options')
                    .single()

                if (settingsData?.value) {
                    const { categories: dynamicCats, roles: dynamicRoles } = settingsData.value
                    if (dynamicCats && Array.isArray(dynamicCats)) {
                        setCategories(dynamicCats)
                    }
                    if (dynamicRoles && Array.isArray(dynamicRoles)) {
                        // Handle both string array and object array for roles
                        const formattedRoles = dynamicRoles.map((r: any) =>
                            typeof r === 'string' ? r : (r.value || r.label)
                        )
                        setRoles(formattedRoles)
                    }
                    setLoading(false)
                    return // If we have dynamic settings, we prefer them
                }

                // 2. Fallback to distinct categories/roles from foods table
                const { data: catData } = await supabase
                    .from('foods')
                    .select('category')
                    .not('category', 'is', null)

                if (catData) {
                    const uniqueCats = Array.from(new Set(catData.map((f: any) => f.category)))
                        .filter(c => c && c.trim() !== '')
                        .sort() as string[]
                    setCategories(uniqueCats)
                }

                const { data: roleData } = await supabase
                    .from('foods')
                    .select('role')
                    .not('role', 'is', null)

                if (roleData) {
                    const uniqueRoles = Array.from(new Set(roleData.map((f: any) => f.role)))
                        .filter(r => r && r.trim() !== '')
                        .sort() as string[]
                    setRoles(uniqueRoles)
                }
            } catch (err) {
                console.error("Error fetching planner metadata:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchMetadata()
    }, [])

    return { categories, roles, loading }
}
