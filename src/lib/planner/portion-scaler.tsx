import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import React from 'react'

const DEFAULT_SCALABLE_UNITS = [
    'adet', 'tane', 'porsiyon', 'dilim', 'gram', 'gr', 'ml', 'litre', 'bardak',
    'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı', 'kase', 'kepçe', 'avuç',
    'yaprak', 'dal'
]

const NUMBER_WORDS: Record<string, number> = {
    'bir': 1, 'iki': 2, 'üç': 3, 'dört': 4, 'beş': 5, 'yarım': 0.5
}

const REVERSE_NUMBER_WORDS: Record<string, string> = {
    '1': 'Bir', '2': 'İki', '3': 'Üç', '4': 'Dört', '5': 'Beş', '0.5': 'Yarım'
}

export function useScalableUnits() {
    const [units, setUnits] = useState<string[]>(DEFAULT_SCALABLE_UNITS)

    useEffect(() => {
        async function load() {
            // Try to load global settings (works for Dietitian)
            const { data } = await supabase
                .from('planner_settings')
                .select('portion_settings')
                .eq('scope', 'global')
                .maybeSingle()

            if (data?.portion_settings?.scalable_units && Array.isArray(data.portion_settings.scalable_units)) {
                // Merge with defaults to ensure basic units always work
                const merged = Array.from(new Set([...DEFAULT_SCALABLE_UNITS, ...data.portion_settings.scalable_units]))
                setUnits(merged)
            }
        }
        load()
    }, [])

    return units
}

export function getScaledFoodName(originalName: string, multiplier: number, scalableUnits: string[] = []) {
    if (!originalName) return ""

    if (multiplier === 1) return originalName

    if (scalableUnits.length > 0) {
        // Normalize whitespace: "2  yemek   kaşığı" -> "2 yemek kaşığı"
        const normalizedName = originalName.replace(/\s+/g, ' ')

        // Create Turkish lowercase version for matching to handle "Bir", "İki" correctly
        const lowerName = normalizedName.toLocaleLowerCase('tr-TR')

        // Sort by length (descending) to match longest units first
        const sortedUnits = [...scalableUnits].sort((a, b) => b.length - a.length)

        // Escape regex special characters in units and lowercase them for matching
        const escapedUnits = sortedUnits.map(u => u.toLocaleLowerCase('tr-TR').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

        // Regex Explanation:
        // Group 1: The Number or Range. Matches digits, ranges "4-5", or specific Turkish number words.
        // Group 2: The Unit
        const numberWords = "bir|iki|üç|dört|beş|yarım"
        const rangePattern = "\\d+\\s*-\\s*\\d+"
        const pattern = new RegExp(`(${rangePattern}|[\\d,.]+|${numberWords})[\\s\\-\\(\\)]*(${escapedUnits.join('|')})`, 'g')

        const parts: React.ReactNode[] = []
        let lastIndex = 0
        let match

        // Helper: Generate the final display string for a (amount + unit) pair
        const getDisplayString = (amount: number, unit: string, isWordInput: boolean): string => {
            const isHalf = Math.abs(amount - 0.5) < 0.01
            const isOneAndHalf = Math.abs(amount - 1.5) < 0.01

            // 1. Special Conversion: "0.5 yemek kaşığı" -> "1 tatlı kaşığı"
            if (isHalf && unit === 'yemek kaşığı') {
                // For consistency, if input was "Yarım yemek kaşığı", maybe "Bir tatlı kaşığı"?
                // But typically numeric conversion implies digit output unless specific logic exists.
                // User said "rakam ise rakam, yazı ise yazı".
                // 0.5 -> 1. New amount is 1. StartUnit: yemek -> NewUnit: tatlı.
                // If isWordInput ('yarım'), convert 1 to 'Bir'.
                return isWordInput ? "Bir tatlı kaşığı" : "1 tatlı kaşığı"
            }

            // 2. Special Conversion: "2n tatlı kaşığı" -> "n yemek kaşığı" (2 TK = 1 YK)
            if (unit === 'tatlı kaşığı' && amount >= 2 && Math.abs(amount % 2) < 0.01) {
                const convertedAmount = amount / 2
                const convertedUnit = 'yemek kaşığı'

                if (isWordInput) {
                    const strVal = convertedAmount.toString()
                    if (REVERSE_NUMBER_WORDS[strVal]) {
                        return `${REVERSE_NUMBER_WORDS[strVal]} ${convertedUnit}`
                    }
                    // If word map doesn't have it (e.g. 6), fall back to digit
                    return `${convertedAmount} ${convertedUnit}`
                }

                return `${convertedAmount} ${convertedUnit}`
            }

            // 3. "0.5 adet/tane" -> "Yarım" (No unit suffix)
            if (isHalf && (unit === 'adet' || unit === 'tane')) {
                return "Yarım"
            }

            // 4. "0.5" -> "Yarım unit" (Generic)
            if (isHalf) return `Yarım ${unit}`

            // 5. "1.5" -> "Bir Buçuk unit" OR Round
            if (isOneAndHalf) {
                if (['porsiyon', 'bardak', 'dilim', 'kase'].includes(unit)) {
                    // Standard wording for 1.5
                    return isWordInput ? `Bir Buçuk ${unit}` : `1.5 ${unit}`
                }
                // Round UP to integer for others
                const rounded = 2
                const word = REVERSE_NUMBER_WORDS[rounded.toString()]
                return isWordInput && word ? `${word} ${unit}` : `${rounded} ${unit}`
            }

            // 6. Rounding Logic (2.5 -> 3, except porsiyon)
            let finalAmount = amount
            if (unit !== 'porsiyon' && amount % 1 !== 0) {
                finalAmount = Math.ceil(amount)
            }

            // 7. Format Logic (Word vs Digit)
            if (isWordInput) {
                const finalStr = finalAmount.toString()
                if (REVERSE_NUMBER_WORDS[finalStr]) {
                    return `${REVERSE_NUMBER_WORDS[finalStr]} ${unit}`
                }
                // If no mapping (e.g. 6, 7), fall back to digit or keep 'Beş' limit?
                // User only mentioned "bir, iki gibi". Let's assume standard digits for >5.
            }

            const formatted = Number.isInteger(finalAmount)
                ? finalAmount.toString()
                : finalAmount.toFixed(1).replace(/\.0$/, '')

            return `${formatted} ${unit}`
        }

        // Loop through all matches in the LOWERCASE string
        while ((match = pattern.exec(lowerName)) !== null) {
            const fullMatch = match[0]
            const valStr = match[1]
            const unit = match[2]
            const startIdx = match.index

            // Add text before match (from NORMALIZED string using indices)
            if (startIdx > lastIndex) {
                parts.push(normalizedName.substring(lastIndex, startIdx))
            }

            let displayStr = ""
            // Detect if input is a word
            const isWordInput = Object.keys(NUMBER_WORDS).includes(valStr)

            // Case A: Range "4-5"
            // Ranges imply digits. We won't try to wordify ranges "Dört-Beş". User said "rakam ise rakam".
            if (valStr.includes('-')) {
                const [minStr, maxStr] = valStr.split('-').map(s => s.trim())
                const min = parseFloat(minStr)
                const max = parseFloat(maxStr)

                if (!isNaN(min) && !isNaN(max)) {
                    const newMin = min * multiplier
                    const newMax = max * multiplier

                    const simpleRound = (val: number) => {
                        if (Math.abs(val - 0.5) < 0.01) return "Yarım"
                        if (unit !== 'porsiyon' && val % 1 !== 0) return Math.ceil(val)
                        return Number.isInteger(val) ? val : val.toFixed(1).replace(/\.0$/, '')
                    }

                    displayStr = `${simpleRound(newMin)}-${simpleRound(newMax)} ${unit}`
                } else {
                    displayStr = fullMatch
                }
            }
            // Case B: Single Value
            else {
                let originalAmount = 0
                if (isWordInput) {
                    originalAmount = NUMBER_WORDS[valStr]
                } else {
                    originalAmount = parseFloat(valStr.replace(',', '.'))
                }

                if (!isNaN(originalAmount)) {
                    const newAmount = originalAmount * multiplier
                    displayStr = getDisplayString(newAmount, unit, isWordInput)
                } else {
                    displayStr = fullMatch
                }
            }

            parts.push(
                <span key={startIdx} className="text-red-600">
                    {displayStr}
                </span>
            )

            lastIndex = startIdx + fullMatch.length
        }

        if (parts.length > 0) {
            if (lastIndex < normalizedName.length) {
                parts.push(normalizedName.substring(lastIndex))
            }
            return React.createElement(React.Fragment, {}, ...parts)
        }
    }

    // Fallback Labeling (if no unit matched or scalableUnits was empty)
    let label = ""
    if (multiplier === 0.5) label = " (Yarım Porsiyon)"
    else if (multiplier === 1.5) label = " (1.5 Porsiyon)"
    else if (multiplier === 2.0) label = " (Çift Porsiyon)"
    else label = ` (x${multiplier} Porsiyon)`

    return (
        <span>
            {originalName}
            <span className="text-red-600 whitespace-nowrap">{label}</span>
        </span>
    )
}
