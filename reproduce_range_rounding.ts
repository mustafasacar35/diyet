
export { }
const scalableUnits = [
    'adet', 'porsiyon', 'dilim', 'gram', 'gr', 'ml', 'litre', 'bardak',
    'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı', 'kase', 'kepçe', 'avuç', 'yaprak', 'dal'
];

function getScaledFoodNameV6(originalName: string, multiplier: number, units: string[]) {
    console.log(`\n--- Testing: "${originalName}" (x${multiplier}) ---`);

    // 1. Normalize Whitespace
    const normalizedName = originalName.replace(/\s+/g, ' ');
    const lowerName = normalizedName.toLocaleLowerCase('tr-TR');

    // 2. Sort & Escape Units
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);
    const escapedUnits = sortedUnits.map(u => u.toLocaleLowerCase('tr-TR').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // 3. Regex with Range Support
    // Attempting to match "4-5" as a single group.
    // Pattern: (\d+\s*-\s*\d+ | [\d,.]+|numberWords)
    const numberWords = "bir|iki|üç|dört|beş|yarım";
    const rangePattern = "\\d+\\s*-\\s*\\d+"; // Simple range pattern
    const pattern = new RegExp(`(${rangePattern}|[\\d,.]+|${numberWords})[\\s\\-\\(\\)]*(${escapedUnits.join('|')})`, 'g');

    // Note: The above regex might be tricky because [\d,.]+ matches the start of "4-5".
    // We must put rangePattern FIRST in alternation.

    console.log("Pattern:", pattern);

    const parts: any[] = [];
    let lastIndex = 0;
    let match;
    let foundMatch = false;

    while ((match = pattern.exec(lowerName)) !== null) {
        foundMatch = true;
        const fullMatch = match[0];
        const valStr = match[1];
        const unit = match[2];
        const startIdx = match.index;

        // Extract original text
        if (startIdx > lastIndex) {
            parts.push(normalizedName.substring(lastIndex, startIdx));
        }

        console.log(`MATCH match[0]: "${fullMatch}"`);
        console.log(`Value Group: "${valStr}"`);
        console.log(`Unit Group: "${unit}"`);

        // Parsing Logic
        let displayValue = "";

        // Check for Range "4-5"
        if (valStr.includes('-')) {
            const [minStr, maxStr] = valStr.split('-').map(s => s.trim());
            const min = parseFloat(minStr);
            const max = parseFloat(maxStr);

            if (!isNaN(min) && !isNaN(max)) {
                // Scale
                let newMin = min * multiplier;
                let newMax = max * multiplier;

                // Rounding Logic (User Request)
                // "tekli rakamları (1 haricindeki) ikiye bölüp bir üst tam sayıya yuvarlasın"
                // e.g. 5 * 0.5 = 2.5 -> 3.
                // But 1 * 0.5 = 0.5 -> Yarım? Range inputs usually integers. 
                // Let's assume Math.ceil for typically integral units like 'yaprak' if not 0.5.

                // Helper to format
                const formatVal = (val: number) => {
                    // Special Rule: 0.5 -> Yarım (even in range?) "Yarım-3"? Weird.
                    // Usually ranges are "2-3".
                    // If val is 0.5, maybe just say 0.5? Or "Yarım".
                    // User said "2,5 yaprak olmaz... 3 yaprak olmalı".
                    // So default to ceil for these whole-unit types.

                    if (val === 0.5) return "Yarım"; // Maybe?

                    // If porsiyon, allow 1.5?
                    if (unit === 'porsiyon' && val === 1.5) return "1.5"; // Or "Bir Buçuk"

                    // Default Ceil Check
                    // If it was an integer and became decimal, round UP.
                    // 4 -> 2 (Int). 5 -> 2.5 -> 3 (Int).
                    if (val % 1 !== 0) return Math.ceil(val).toString();
                    return val.toString();
                }

                displayValue = `${formatVal(newMin)}-${formatVal(newMax)} ${unit}`;
                console.log(`Range Result: ${displayValue}`);
            }
        } else {
            // Single Value Logic
            // ... (Existing + Rounding Fix)
            let originalAmount = 0;
            if (valStr === 'bir') originalAmount = 1;
            else if (valStr === 'iki') originalAmount = 2
            else if (valStr === 'yarım') originalAmount = 0.5
            else originalAmount = parseFloat(valStr.replace(',', '.'));

            const newAmount = originalAmount * multiplier;
            const isHalf = Math.abs(newAmount - 0.5) < 0.01;

            if (isHalf && unit === 'yemek kaşığı') {
                displayValue = "1 tatlı kaşığı";
            } else if (isHalf) {
                displayValue = `Yarım ${unit}`;
            } else {
                // Rounding Fix
                if (newAmount % 1 !== 0 && unit !== 'porsiyon') {
                    displayValue = `${Math.ceil(newAmount)} ${unit}`;
                } else {
                    displayValue = `${newAmount} ${unit}`;
                }
            }
        }

        parts.push(`[${displayValue || fullMatch}]`);
        lastIndex = startIdx + fullMatch.length;
    }

    if (lastIndex < normalizedName.length) {
        parts.push(normalizedName.substring(lastIndex));
    }

    console.log("Final String:", parts.join(""));
}

getScaledFoodNameV6("4-5 yaprak roka", 0.5, scalableUnits);
getScaledFoodNameV6("4 yaprak marul, 4-5 yaprak roka", 0.5, scalableUnits);
getScaledFoodNameV6("1 yemek kaşığı zeytinyağı", 0.5, scalableUnits);
getScaledFoodNameV6("Yeşillikler (4 yaprak marul, 4-5 yaprak roka...)", 0.5, scalableUnits);
