
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMigration() {
    console.log('--- Debugging Categories ---');

    // Fetch ALL unique categories to see exactly what we are dealing with (including invisible chars)
    const { data: foods, error } = await supabase
        .from('foods')
        .select('category');

    if (error) {
        console.error(error);
        return;
    }

    const uniqueCats = [...new Set(foods.map(f => f.category))].sort();
    console.log('All Unique Categories (as loaded):');
    uniqueCats.forEach(c => {
        console.log(`'${c}' (len: ${c ? c.length : 0})`);
    });

    // Try to specifically target 'ATIŞTIRILMALIKLAR'
    console.log('\n--- Targeting Specfic Typos ---');
    const typos = ['ATIŞTIRILMALIKLAR', 'ATIŞTIRMALIK', 'APERATIF', 'AKSAM'];

    for (const typo of typos) {
        const { data: items, error: searchError } = await supabase
            .from('foods')
            .select('id, name, category')
            .eq('category', typo);

        if (searchError) console.error(searchError);

        console.log(`Searching for exact '${typo}': Found ${items?.length || 0} items`);
        if (items && items.length > 0) {
            console.log('Sample item:', items[0]);

            // Attempt update
            const { error: updateError } = await supabase
                .from('foods')
                .update({ category: 'ATIŞTIRMALIKLAR' }) // Default target for debugging
                .eq('id', items[0].id); // Try updating just one by ID to verify permissions/logic

            if (updateError) console.error(`Failed to update item ${items[0].id}:`, updateError);
            else console.log(`Successfully updated item ${items[0].id} by ID as a test.`);
        }
    }
}

debugMigration();
