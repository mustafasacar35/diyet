
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('--- Inspecting Categories ---');

    // 1. Get distinct categories from foods
    const { data: foods, error: foodsError } = await supabase
        .from('foods')
        .select('category');

    if (foodsError) {
        console.error('Error fetching foods:', foodsError.message);
    } else {
        // Distinct and sort
        const categories = [...new Set(foods.map(f => f.category))].filter(Boolean).sort();
        console.log('Unique Categories in "foods":', JSON.stringify(categories, null, 2));
    }

    // 2. Get categories from food_categories table
    const { data: foodCategories, error: catsError } = await supabase
        .from('food_categories')
        .select('name')
        .order('name');

    if (catsError) {
        console.log('Error fetching food_categories:', catsError.message);
    } else {
        const catNames = foodCategories.map(c => c.name);
        console.log('Categories in "food_categories":', JSON.stringify(catNames, null, 2));
    }
}

inspect();
