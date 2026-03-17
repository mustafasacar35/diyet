
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deepDebug() {
    const log = [];
    log.push('--- Deep Debugging Categories ---');

    // Search for anything starting with 'ATI'
    const { data: items, error } = await supabase
        .from('foods')
        .select('id, name, category')
        .ilike('category', 'ATI%'); // fuzzy match

    if (error) {
        log.push('Error: ' + error.message);
        fs.writeFileSync('debug_result.json', JSON.stringify(log, null, 2));
        return;
    }

    log.push(`Found ${items.length} items starting with 'ATI'`);

    // Group by category string EXACTLY
    const catMap = {};
    items.forEach(item => {
        if (!catMap[item.category]) catMap[item.category] = [];
        catMap[item.category].push(item.id);
    });

    const results = [];

    for (const [cat, ids] of Object.entries(catMap)) {
        const entry = {
            category: cat,
            count: ids.length,
            length: cat.length,
            charCodes: [...cat].map(c => c.charCodeAt(0)),
            isStandard: cat === 'ATIŞTIRMALIKLAR',
            action: 'None'
        };

        if (!entry.isStandard) {
            entry.action = 'Migrating...';
            const { error: updateError } = await supabase
                .from('foods')
                .update({ category: 'ATIŞTIRMALIKLAR' })
                .in('id', ids);

            if (updateError) entry.action = 'Failed: ' + updateError.message;
            else entry.action = 'Fixed!';
        }
        results.push(entry);
    }

    fs.writeFileSync('debug_result.json', JSON.stringify(results, null, 2));
    console.log('Results written to debug_result.json');
}

deepDebug();
