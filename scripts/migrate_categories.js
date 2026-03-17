
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MAPPINGS = {
    'AKSAM': 'AKŞAM',
    'OGLE': 'ÖĞLEN',
    'diğer': 'DİĞER',
    'Diğer': 'DİĞER',
    'MEYVE': 'MEYVELER',
    'APERATIF': 'ATIŞTIRMALIKLAR',
    'ATIŞTIRMALIK': 'ATIŞTIRMALIKLAR',
    'Atıştırmalık': 'ATIŞTIRMALIKLAR',
    'ATIŞTIRILMALIKLAR': 'ATIŞTIRMALIKLAR', // Fix typo
    'ARA OGUN': 'ARA ÖĞÜN',
    'MEZE': 'MEZELER',
    'SALATA': 'SALATALAR',
    'CORBA': 'ÇORBALAR',
    'EKMEK': 'EKMEKLER',
    'ICECEL': 'İÇECEKLER',
    'ICECEK': 'İÇECEKLER',
    'TATLI': 'TATLILAR',
    'KAHVALTI ': 'KAHVALTI', // Trim space
};

async function migrate() {
    console.log('--- Migrating Categories ---');

    for (const [oldCat, newCat] of Object.entries(MAPPINGS)) {
        // Check count first
        const { count, error: countError } = await supabase
            .from('foods')
            .select('*', { count: 'exact', head: true })
            .eq('category', oldCat);

        if (countError) {
            console.error(`Error counting ${oldCat}:`, countError.message);
            continue;
        }

        if (count > 0) {
            console.log(`Found ${count} items for "${oldCat}". Updating to "${newCat}"...`);
            const { error: updateError, data } = await supabase
                .from('foods')
                .update({ category: newCat })
                .eq('category', oldCat)
                .select();

            if (updateError) {
                console.error(`Error updating ${oldCat}:`, updateError.message);
            } else {
                console.log(`Successfully updated ${data.length} items from "${oldCat}" to "${newCat}"`);
            }
        } else {
            // Silent for not found to keep logs clean, or just log simplified
            // console.log(`No items found for ${oldCat}.`);
        }
    }

    console.log('Migration complete.');
}

migrate();
