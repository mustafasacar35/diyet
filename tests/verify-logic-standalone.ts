
// Mocking the logic found in engine.ts to verify algorithm correctness

const MACRO_FACTOR = 25;

const scoreMacro = (foodAmount: number, currentAmount: number, targetAmount: number, priority: number) => {
    if (!priority || priority <= 0) return 0;
    if (!targetAmount || targetAmount <= 0) return 0;

    const remaining = targetAmount - currentAmount;
    if (remaining <= 0) {
        // Already over target: Penalize further addition
        // Penalty: Amount * Priority * Factor
        return -1 * foodAmount * priority * MACRO_FACTOR;
    } else {
        // Under target: Reward filling the gap
        // Don't reward over-filling excessively.
        const usefulAmount = Math.min(foodAmount, remaining * 1.2); // Allow slight overfill as useful
        const wasteAmount = Math.max(0, foodAmount - usefulAmount);

        // Reward useful part, Penalize waste part (lighter penalty)
        return (usefulAmount * priority * MACRO_FACTOR) - (wasteAmount * priority * (MACRO_FACTOR / 2));
    }
};

const mockFoodLowProtein = { protein: 2, carbs: 20, fat: 5 };
const mockFoodHighProtein = { protein: 25, carbs: 5, fat: 5 };
const mockContext = {
    slotMacros: { protein: 0, carbs: 0, fat: 0 },
    slotTargetMacros: { protein: 30, carbs: 50, fat: 20 }
};

function runTest() {
    console.log("--- Testing Standalone Macro Logic ---");

    // Test 1: Priority Protein 10
    const priorityP = 10;
    const scoreHighP = scoreMacro(mockFoodHighProtein.protein, mockContext.slotMacros.protein, mockContext.slotTargetMacros.protein, priorityP);
    const scoreLowP = scoreMacro(mockFoodLowProtein.protein, mockContext.slotMacros.protein, mockContext.slotTargetMacros.protein, priorityP);

    console.log(`Priority Protein=10`);
    console.log(`High Protein Food (${mockFoodHighProtein.protein}g) Score: ${scoreHighP}`);
    console.log(`Low Protein Food (${mockFoodLowProtein.protein}g) Score: ${scoreLowP}`);

    if (scoreHighP > scoreLowP * 5) {
        console.log("PASS: High protein prioritized correctly.");
    } else {
        console.log("FAIL: High protein not prioritized enough.");
    }

    // Test 2: Priority Carb 10
    const priorityC = 10;
    const scoreHighC = scoreMacro(mockFoodHighProtein.carbs, mockContext.slotMacros.carbs, mockContext.slotTargetMacros.carbs, priorityC);
    const scoreLowC = scoreMacro(mockFoodLowProtein.carbs, mockContext.slotMacros.carbs, mockContext.slotTargetMacros.carbs, priorityC);

    console.log(`\nPriority Carb=10`);
    console.log(`High Carb Food (${mockFoodLowProtein.carbs}g) Score: ${scoreLowC}`); // Note: variable naming is tricky, LowProtein has HighCarb
    console.log(`Low Carb Food (${mockFoodHighProtein.carbs}g) Score: ${scoreHighC}`);

    if (scoreLowC > scoreHighC * 2) {
        console.log("PASS: High carb prioritized correctly.");
    } else {
        console.log("FAIL: High carb not prioritized enough.");
    }

    // Test 3: Penalties
    const filledContextMacros = { protein: 35, carbs: 0, fat: 0 }; // 5 over target
    const scoreOverload = scoreMacro(mockFoodHighProtein.protein, filledContextMacros.protein, mockContext.slotTargetMacros.protein, 10);
    console.log(`\nOverload Score (Adding 25g to already full): ${scoreOverload}`);

    if (scoreOverload < 0) {
        console.log("PASS: Penalized correctly.");
    } else {
        console.log("FAIL: Should be negative.");
    }
}

runTest();
