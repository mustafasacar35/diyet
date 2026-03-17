import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type ManualMatch = {
    id: string
    food_pattern: string
    card_filename: string
    original_text: string | null
    created_at: string
}

export type MatchBan = {
    id: string
    food_pattern: string
    card_filename: string
    original_text: string | null
    created_at: string
}

export type RecipeCard = {
    id: string
    filename: string
    url: string
    metadata: any
    created_at: string
}

export function useRecipeManager() {
    const [manualMatches, setManualMatches] = useState<ManualMatch[]>([])
    const [bans, setBans] = useState<MatchBan[]>([])
    const [cards, setCards] = useState<RecipeCard[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        try {
            // Manual Matches
            const { data: mData, error: mError } = await supabase
                .from('recipe_manual_matches')
                .select('*')

            if (mError) throw mError
            // console.log("Recipes: Manual matches fetched:", mData?.length)

            // Bans
            const { data: bData, error: bError } = await supabase
                .from('recipe_match_bans')
                .select('*')

            if (bError) throw bError
            // console.log("Recipes: Bans fetched:", bData?.length)

            // Cards
            const { data: cData, error: cError } = await supabase
                .from('recipe_cards')
                .select('*')
                .order('created_at', { ascending: false })

            if (cError) throw cError
            // console.log("Recipes: Cards fetched:", cData?.length)

            setManualMatches(mData || [])
            setBans(bData || [])
            setCards(cData || [])
        } catch (error: any) {
            console.error("Error fetching recipe data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    async function addManualMatch(food_pattern: string, card_filename: string, original_text?: string) {
        try {
            const { data, error } = await supabase.from('recipe_manual_matches').insert({
                food_pattern,
                card_filename,
                original_text: original_text || null
            }).select().single()

            if (error) throw error

            setManualMatches([data, ...manualMatches])
            setManualMatches([data, ...manualMatches])
            return true
        } catch (error: any) {
            console.error('Error adding match:', error)
            alert('Hata: ' + error.message)
            return false
        }
    }

    async function deleteManualMatch(id: string) {

        try {
            const { error } = await supabase.from('recipe_manual_matches').delete().eq('id', id)
            if (error) throw error

            setManualMatches(manualMatches.filter(m => m.id !== id))
            setManualMatches(manualMatches.filter(m => m.id !== id))
        } catch (error: any) {
            console.error('Error deleting match:', error)
        }
    }

    async function addBan(food_pattern: string, card_filename: string, original_text?: string) {
        try {
            const { data, error } = await supabase.from('recipe_match_bans').insert({
                food_pattern,
                card_filename,
                original_text: original_text || null
            }).select().single()

            if (error) throw error

            setBans([data, ...bans])
            setBans([data, ...bans])
            return true
        } catch (error: any) {
            console.error('Error adding ban:', error)
            console.error('Error adding ban:', error)
            return false
        }
    }

    async function deleteBan(id: string) {

        try {
            const { error } = await supabase.from('recipe_match_bans').delete().eq('id', id)
            if (error) throw error

            setBans(bans.filter(b => b.id !== id))
            setBans(bans.filter(b => b.id !== id))
        } catch (error: any) {
            console.error('Error deleting ban:', error)
        }
    }

    return {
        manualMatches,
        bans,
        cards,
        isLoading,
        addManualMatch,
        deleteManualMatch,
        addBan,
        deleteBan,
        updateManualMatch: async (id: string, food_pattern: string, card_filename: string, original_text?: string) => {
            try {
                const { data, error } = await supabase.from('recipe_manual_matches').update({
                    food_pattern,
                    card_filename,
                    original_text: original_text || null
                }).eq('id', id).select().single()

                if (error) throw error

                setManualMatches(manualMatches.map(m => m.id === id ? data : m))
                return true
            } catch (error: any) {
                console.error('Error updating match:', error)
                alert('Hata: ' + error.message)
                return false
            }
        },
        refresh: fetchData
    }
}
