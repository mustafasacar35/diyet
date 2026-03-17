
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function broadDebug() {

    // 1. Get ALL categories distinct
    const { data: foods, error } = await supabase
        .from('foods')
        .select('category')
        .order('category');

    if (error) {
        fs.writeFileSync('debug_result.json', JSON.stringify({ error: error.message }, null, 2));
        return;
    }

    const allCats = [...new Set(foods.map(f => f.category))].sort();

    // 2. Filter for suspicious ones
    const suspicious = allCats.filter(c =>
        c.includes('ATI') ||
        c.includes('APER') ||
        c.includes('AKSAM') ||
        c.includes('ARA')
    );

    const analysis = suspicious.map(cat => ({
        category: cat,
        length: cat ? cat.length : 0,
        charCodes: cat ? [...cat].map(c => c.charCodeAt(0)) : [],
        isStandard: [
            'ATIŞTIRMALIKLAR',
            'AKŞAM',
            'ARA ÖĞÜN'
        ].includes(cat)
    }));

    // 3. Migrate any non-standard found here immediately
    const actions = [];
    for (const item of analysis) {
        if (!item.isStandard) {
            let target = null;
            if (item.category.includes('ATI') || item.category === 'APERATIF') target = 'ATIŞTIRMALIKLAR';
            if (item.category === 'AKSAM') target = 'AKŞAM';
            if (item.category === 'ARA OGUN') target = 'ARA ÖĞÜN';

            if (target) {
                const { error: updateError } = await supabase
                    .from('foods')
                    .update({ category: target })
                    .eq('category', item.category);
                actions.push(`Migrated '${item.category}' -> '${target}' (${updateError ? 'Failed' : 'Success'})`);
            }
        }
    }

    // 4. Check food_categories table
    const { data: fcData, error: fcError } = await supabase
        .from('food_categories')
        .select('name')
        .order('name');

    if (fcError) {
        console.error('Error fetching food_categories:', fcError);
    }

    const fcNames = fcData ? fcData.map(c => c.name) : [];

    // 5. Clean up food_categories table if needed
    const badFc = fcNames.filter(c =>
        !['KAHVALTI', 'ÖĞLEN', 'AKŞAM', 'ARA ÖĞÜN',
            'SALATALAR', 'MEZELER', 'ÇORBALAR', 'EKMEKLER',
            'MEYVELER', 'KURUYEMİŞLER', 'TATLILAR', 'İÇECEKLER',
            'KOLLAJEN', 'TOSTLAR', 'ATIŞTIRMALIKLAR', 'GENEL', 'DİĞER'
        ].includes(c)
    );

    for (const bad of badFc) {
        const { error: delError } = await supabase
            .from('food_categories')
            .delete()
            .eq('name', bad);
        if (delError) actions.push(`Failed to delete bad category '${bad}' from table: ${delError.message}`);
        else actions.push(`Deleted bad category '${bad}' from food_categories table.`);
    }

    fs.writeFileSync('debug_result.json', JSON.stringify({
        allCategories: allCats,
        suspiciousAnalysis: analysis,
        actions: actions,
        foodCategoriesTable: fcNames,
        cleanedFoodCategories: badFc
    }, null, 2));
}


broadDebug();
