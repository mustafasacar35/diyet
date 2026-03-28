import { Planner } from './src/lib/planner/engine3';

async function testAffinity() {
    const planner = new Planner('some-user-id', 'some-patient-id');
    await planner.init();
    
    // Simulate current slot items
    const foodBorek = {
        id: 'borek-id',
        name: 'Ketojenik Ispanaklı Börek',
        category: 'ANA YEMEK',
        role: 'mainDish',
        calories: 100, protein: 5, carbs: 5, fat: 5
    };
    
    const foodEkmek = {
        id: 'ekmek-id',
        name: 'Haşhaş Ezmesi Ekmeği',
        category: 'EKMEKLER',
        role: 'bread',
        calories: 50, protein: 2, carbs: 10, fat: 1
    };

    const context = {
        dayIndex: 0,
        slotName: 'ÖĞLEN',
        selectedFoods: [],
        slotSelectedFoods: [foodBorek] // Börek is already selected
    };

    console.log('--- Testing Affinity Rule for Ekmek ---');
    // We expect a conflict if there's a forbidden rule between Börek and Ekmek
    const score = await (planner as any).scoreFood(foodEkmek, 500, context);
    console.log('Score for Ekmek:', score);
    
    console.log('--- Tester Logs ---');
    (planner as any).logs.forEach((l: any) => console.log(`[${l.type}] ${l.message}: ${l.details}`));
}

testAffinity().catch(console.error);
