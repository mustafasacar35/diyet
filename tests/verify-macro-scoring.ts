
import { Planner } from '../src/lib/planner/engine';

// Mock context and food
const mockFoodLowProtein = {
    id: '1',
    name: 'Low Protein Food',
    protein: 2,
    carbs: 20,
    fat: 5,
    calories: 130
};

const mockFoodHighProtein = {
    id: '2',
    name: 'High Protein Food',
    protein: 25,
    carbs: 5,
    fat: 5,
    calories: 160
};

const mockContext = {
    weeklySelectedIds: new Map(),
    slotTargetMacros: {
        protein: 30,
        carbs: 50,
        fat: 20
    },
    slotMacros: {
        protein: 0,
        carbs: 0,
        fat: 0
    } // Empty slot so far
};

async function testMacroScoring() {
    console.log("Initializing Planner for Macro Scoring Test...");
    const planner = new Planner('test-user', 'test-user-id');

    // Manually inject settings to avoid database calls
    // @ts-ignore
    planner.settings = {
        variety_preference: 'balanced',
        weights: [], // No standard weights to isolate macro score
        macro_priorities: {
            protein: 0,
            carb: 0,
            fat: 0
        }
    };

    // @ts-ignore - Mock rules to empty
    planner.rules = [];

    console.log("\n--- Test 1: No Priorities (0,0,0) ---");
    // @ts-ignore
    let scoreLow = planner.calculateScore(mockFoodLowProtein, mockContext);
    // @ts-ignore
    let scoreHigh = planner.calculateScore(mockFoodHighProtein, mockContext);

    console.log(`Low Protein Food Score: ${scoreLow}`);
    console.log(`High Protein Food Score: ${scoreHigh}`);

    if (Math.abs(scoreLow - scoreHigh) < 500) { // Should be close (only difference might be random variance or small calorie budget diff)
        console.log("PASS: Scores similar without priorities.");
    } else {
        console.log("WARN: Unexpected score difference without priorities.");
    }

    console.log("\n--- Test 2: High Protein Priority (10,0,0) ---");
    // @ts-ignore
    planner.settings.macro_priorities = { protein: 10, carb: 0, fat: 0 };

    // @ts-ignore
    scoreLow = planner.calculateScore(mockFoodLowProtein, mockContext);
    // @ts-ignore
    scoreHigh = planner.calculateScore(mockFoodHighProtein, mockContext);

    console.log(`Low Protein Food Score: ${scoreLow}`);
    console.log(`High Protein Food Score: ${scoreHigh}`);

    if (scoreHigh > scoreLow + 5000) { // Should be significantly higher. 25g * 10 * 25 = 6250 vs 2g*10*25 = 500
        console.log("PASS: High protein food scored much higher.");
    } else {
        console.log("FAIL: Priority did not boost protein food enough.");
    }

    console.log("\n--- Test 3: High Carb Priority (0,10,0) ---");
    // @ts-ignore
    planner.settings.macro_priorities = { protein: 0, carb: 10, fat: 0 };

    // @ts-ignore
    scoreLow = planner.calculateScore(mockFoodLowProtein, mockContext); // 20g carbs
    // @ts-ignore
    scoreHigh = planner.calculateScore(mockFoodHighProtein, mockContext); // 5g carbs

    console.log(`Low Protein (High Carb) Food Score: ${scoreLow}`);
    console.log(`High Protein (Low Carb) Food Score: ${scoreHigh}`);

    if (scoreLow > scoreHigh + 2000) {
        console.log("PASS: High carb food scored higher check.");
    } else {
        console.log("FAIL: Priority did not boost carb food enough.");
    }

    console.log("\n--- Test 4: Over Target Penalty ---");
    // Context where protein is already full
    const fullContext = {
        ...mockContext,
        slotMacros: {
            protein: 30, // Target reached
            carbs: 0,
            fat: 0
        }
    };

    // @ts-ignore
    planner.settings.macro_priorities = { protein: 10, carb: 0, fat: 0 };

    // Adding more protein should be penalized
    // @ts-ignore
    const penaltiesScore = planner.calculateScore(mockFoodHighProtein, fullContext);
    console.log(`Score when Adding Protein to Full Target: ${penaltiesScore}`);

    if (penaltiesScore < 0) {
        console.log("PASS: Penalized for exceeding target.");
    } else {
        console.log("FAIL: Should be penalized.");
    }
}

testMacroScoring().catch(e => console.error(e));
