
export { }
const scalableUnits = [
    'adet', 'porsiyon', 'dilim', 'gram', 'gr', 'ml', 'litre', 'bardak',
    'yemek kaşığı', 'tatlı kaşığı', 'çay kaşığı', 'kase', 'kepçe', 'avuç'
];

function getScaledFoodName(originalName: string, multiplier: number, units: string[]) {
    // Sort units by length descending to avoid partial matches (e.g. match "gram" inside "program")
    // Although "gram" is usually distinct. But "kaşık" vs "yemek kaşığı".
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);

    // Original Regex from codebase
    // const pattern = new RegExp(`([\\d,.]+)[^\\d\\w]*(${sortedUnits.join('|')})`, 'gi')

    // Testing the current codebase regex (without sort, as existing code might not sort)
    // NOTE: The existing code in portion-scaler.tsx DOES NOT explicitely sort by length in the snippet I saw!
    // Step 22348: const merged = Array.from(new Set([...DEFAULT_SCALABLE_UNITS, ...]))
    // It does NOT sort. 

    const pattern = new RegExp(`([\\d,.]+)[^\\d\\w]*(${units.join('|')})`, 'gi');

    console.log("Testing Regex:", pattern);

    const match = pattern.exec(originalName);
    if (match) {
        console.log("MATCH FOUND!");
        console.log("Full Match:", match[0]);
        console.log("Value:", match[1]);
        console.log("Unit:", match[2]);

        const valStr = match[1];
        const unit = match[2];
        const originalAmount = parseFloat(valStr.replace(',', '.'));
        const newAmount = originalAmount * multiplier;
        console.log("Original Amount:", originalAmount);
        console.log("New Amount:", newAmount);
        console.log(`Result: ${newAmount} ${unit}`);
    } else {
        console.log("NO MATCH FOUND");
    }
}

console.log("--- TEST 1: Default Order ---");
getScaledFoodName("2 yemek kaşığı ev yoğurdu", 0.5, scalableUnits);

console.log("\n--- TEST 2: Scrambled Order (simulating DB merge) ---");
const scrambled = ['kaşık', 'yemek kaşığı', 'adet'];
getScaledFoodName("2 yemek kaşığı ev yoğurdu", 0.5, scrambled);

console.log("\n--- TEST 5: User Reported Failures ---");

// Mocking logic from portion-scaler.tsx
function getScaledFoodNameV3(originalName: string, multiplier: number, units: string[]) {
    const normalizedName = originalName.replace(/\s+/g, ' ');
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`([\\d,.]+)[\\s\\-\\(\\)]*(${sortedUnits.join('|')})`, 'gi');

    console.log(`\nTesting: "${originalName}" (x${multiplier})`);
    console.log("Normalized:", normalizedName);

    let match;
    let foundMatch = false;

    while ((match = pattern.exec(normalizedName)) !== null) {
        foundMatch = true;
        const valStr = match[1];
        const unit = match[2];
        const originalAmount = parseFloat(valStr.replace(',', '.'));
        const newAmount = originalAmount * multiplier;

        console.log(`Matched: ${match[0]} -> Val: ${valStr} (${originalAmount}) -> New: ${newAmount}`);

        if (newAmount === 0.5) {
            console.log(`Result: Yarım ${unit}`);
        } else {
            console.log(`Result: ${newAmount} ${unit}`);
        }
    }

    if (!foundMatch) {
        console.log("NO MATCH - Fallback Applied");
    }
}

getScaledFoodNameV3("*Lor ekmeği (0.5 dilim)", 1.0, scalableUnits); // Test if 0.5 matches Yarım logic
getScaledFoodNameV3("Tavuklu Bamya (1 porsiyon)", 0.5, scalableUnits); // Test regex on parens

console.log("\n--- TEST 4: User Reported Case ---");
// Regex from Step 22512
// const pattern = new RegExp(`([\\d,.]+)[\\s\\-\\(\\)]*(${sortedUnits.join('|')})`, 'gi')

function getScaledFoodNameV2(originalName: string, multiplier: number, units: string[]) {
    const sortedUnits = [...units].sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`([\\d,.]+)[\\s\\-\\(\\)]*(${sortedUnits.join('|')})`, 'gi');

    console.log("Regex:", pattern);

    let lastIndex = 0;
    let match;
    let foundMatch = false;
    let result = "";

    while ((match = pattern.exec(originalName)) !== null) {
        foundMatch = true;
        const fullMatch = match[0];
        const valStr = match[1];
        const unit = match[2];
        const startIdx = match.index;

        if (startIdx > lastIndex) {
            result += originalName.substring(lastIndex, startIdx);
        }

        const originalAmount = parseFloat(valStr.replace(',', '.'));
        const newAmount = originalAmount * multiplier;
        result += `${newAmount} ${unit}`;

        lastIndex = startIdx + fullMatch.length;
    }

    if (foundMatch) {
        if (lastIndex < originalName.length) {
            result += originalName.substring(lastIndex);
        }
        console.log("Scaled Result:", result);
    } else {
        console.log("NO MATCH - Fallback would apply");
    }
}

getScaledFoodNameV2("Yoğurt 2 yemek kaşığı Ev Yoğurdu", 2.0, scalableUnits);
getScaledFoodNameV2("2 yemek kaşığı", 2.0, scalableUnits);
getScaledFoodNameV2("2 yemek kaşığı", 0.5, scalableUnits);
