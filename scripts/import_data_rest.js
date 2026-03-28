
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Credentials missing in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
    console.log("🚀 Starting Import via REST API...");

    const dataPath = path.join(__dirname, '..', 'src', 'data', 'food_list.json');
    if (!fs.existsSync(dataPath)) {
        console.error("❌ food_list.json not found");
        return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    let allFoods = [];

    if (jsonData.categories) {
        for (const cat of jsonData.categories) {
            const categoryName = cat.name;
            for (const item of cat.items) {
                const meta = {
                    role: item.role,
                    mealType: item.mealType,
                    dietTypes: item.dietTypes,
                    keto: item.keto,
                    lowcarb: item.lowcarb,
                    portionFixed: item.portionFixed,
                    fillerLunch: item.fillerLunch,
                    fillerDinner: item.fillerDinner,
                    compatibilityTags: item.compatibilityTags,
                    incompatibilityTags: item.incompatibilityTags,
                    seasonRange: item.seasonRange,
                    isReversedSeason: item.isReversedSeason,
                    notes: item.notes
                };

                allFoods.push({
                    name: item.name,
                    category: categoryName,
                    calories: item.calories || 0,
                    protein: item.protein || 0,
                    carbs: item.carbs || 0,
                    fat: item.fat || 0,
                    portion_unit: 'porsiyon',
                    standard_amount: item.minQuantity || 1,
                    tags: item.tags || [],
                    meta: meta
                });
            }
        }
    }

    console.log(`📦 Prepared ${allFoods.length} items. Uploading in batches...`);

    const BATCH_SIZE = 500;
    for (let i = 0; i < allFoods.length; i += BATCH_SIZE) {
        const batch = allFoods.slice(i, i + BATCH_SIZE);

        const { error } = await supabase.from('foods').insert(batch);

        if (error) {
            console.error(`❌ Error importing batch ${i}:`, error.message);
        } else {
            console.log(`✅ Imported batch ${i} - ${i + batch.length}`);
        }
    }

    console.log("✨ Import finished!");
}

importData();
