
export { }
const scalableUnits = [
    'adet', 'porsiyon', 'dilim', 'gram', 'gr', 'ml', 'litre', 'bardak',
    'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı', 'kase', 'kepçe', 'avuç'
];

// Mocking logic from portion-scaler.tsx with Locale Fix
function getScaledFoodNameV5(originalName: string, multiplier: number, units: string[]) {
    // 1. Normalize Whitespace (preserve case)
    const normalizedName = originalName.replace(/\s+/g, ' ');

    // 2. Create Lowercase version for Matching
    const lowerName = normalizedName.toLocaleLowerCase('tr-TR');

    // 3. Sort Units & Escape (lowercase them too for matching)
    // Note: units in DB might be Mixed Case? Assuming they are lowercase or we lower them.
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);
    const escapedUnits = sortedUnits.map(u => u.toLocaleLowerCase('tr-TR').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // 4. Regex (No 'i' flag needed if we lowercased everything, but 'g' needed)
    const numberWords = "bir|iki|üç|dört|beş|yarım";
    const pattern = new RegExp(`([\\d,.]+|${numberWords})[\\s\\-\\(\\)]*(${escapedUnits.join('|')})`, 'g');

    console.log(`\nTesting V5: "${originalName}"`);
    console.log("Lower Name:", lowerName);
    console.log("Regex:", pattern);

    let match;
    let foundMatch = false;
    let lastIndex = 0;

    // We match against lowerName
    while ((match = pattern.exec(lowerName)) !== null) {
        foundMatch = true;
        const fullMatch = match[0];
        const valStr = match[1];
        const unit = match[2];
        const startIdx = match.index;

        console.log(`Matched (Lower): "${fullMatch}" at ${startIdx}`);

        // Extract original text using indices
        // VERIFY: Does toLocaleLowerCase change length?
        // "İ".length = 1, "i".length = 1. "I".length = 1, "ı".length = 1.
        // Seems safe for Turkish for single chars.

        const preMatchOriginal = normalizedName.substring(lastIndex, startIdx);
        console.log(`Pre-Match Original: "${preMatchOriginal}"`);

        // Parse Amount
        let parsedAmount = 0;
        if (valStr === 'bir') parsedAmount = 1; // It is already lowercased
        else if (valStr === 'iki') parsedAmount = 2
        else if (valStr === 'yarım') parsedAmount = 0.5
        else parsedAmount = parseFloat(valStr.replace(',', '.'));

        const newAmount = parsedAmount * multiplier;
        const isHalf = Math.abs(newAmount - 0.5) < 0.01;

        if (isHalf && unit === 'yemek kaşığı') { // unit is from regex which is from escapedUnits (lower)
            console.log("Result: 1 tatlı kaşığı");
        } else {
            console.log(`Result: ${newAmount} ${unit}`);
        }

        lastIndex = startIdx + fullMatch.length;
    }

    if (!foundMatch) {
        console.log("NO MATCH FOUND");
    }
}

function getScaledFoodNameV4(originalName: string, multiplier: number, units: string[]) {
    // 1. Normalize
    const normalizedName = originalName.replace(/\s+/g, ' ');

    // 2. Sort Units
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);

    // 3. Escape Units
    const escapedUnits = sortedUnits.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // 4. Regex
    const numberWords = "bir|iki|üç|dört|beş|yarım";
    // Check if | inside parens works as expected for alternation with [\d,.]+
    // Pattern: ([digits]|word|word)[separator](unit)
    const pattern = new RegExp(`([\\d,.]+|${numberWords})[\\s\\-\\(\\)]*(${escapedUnits.join('|')})`, 'gi');

    console.log(`\nTesting: "${originalName}" (x${multiplier})`);
    console.log("Regex:", pattern);

    let match;
    let foundMatch = false;

    while ((match = pattern.exec(normalizedName)) !== null) {
        foundMatch = true;
        const valStr = match[1];
        const unit = match[2];
        const originalAmount = parseFloat(valStr.replace(',', '.'));

        console.log(`Matched: "${match[0]}"`);
        console.log(`ValStr: "${valStr}"`);
        console.log(`Unit: "${unit}"`);

        // Emulate parsing logic
        let parsedAmount = 0;
        const lowerVal = valStr.toLowerCase();
        if (lowerVal === 'bir') parsedAmount = 1;
        else if (lowerVal === 'iki') parsedAmount = 2
        else if (lowerVal === 'yarım') parsedAmount = 0.5
        else parsedAmount = parseFloat(valStr.replace(',', '.'));

        console.log(`Parsed Amount: ${parsedAmount}`);
        const newAmount = parsedAmount * multiplier;
        console.log(`New Amount: ${newAmount}`);

        const isHalf = Math.abs(newAmount - 0.5) < 0.01;

        if (isHalf && unit.toLowerCase() === 'yemek kaşığı') {
            console.log("Result: 1 tatlı kaşığı");
        } else {
            console.log(`Result: ${newAmount} ${unit}`);
        }
    }

    if (!foundMatch) {
        console.log("NO MATCH FOUND");
    }
}

getScaledFoodNameV4("Bir yemek kaşığı tahin içerisine", 0.5, scalableUnits);
getScaledFoodNameV4("1 yemek kaşığı tahin", 0.5, scalableUnits);
getScaledFoodNameV4("Bir", 0.5, scalableUnits); // Should not match unit

getScaledFoodNameV5("Bir yemek kaşığı tahin", 0.5, scalableUnits);
getScaledFoodNameV5("İki Porsiyon Döner", 0.5, scalableUnits); // Test Turkish I
