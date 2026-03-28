
const https = require('https');

const url = 'https://edcxbjneplsktmlrkvix.supabase.co/rest/v1/';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkY3hiam5lcGxza3RtbHJrdml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDYzNjgsImV4cCI6MjA4NDIyMjM2OH0.-ZghlLIjfODUpMYG_suT_hXv2owcezNU4NcORxEsvaw';

const options = {
    headers: {
        'apikey': apiKey,
        'Authorization': `Bearer ${apiKey}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const spec = JSON.parse(data);
            const definitions = spec.definitions || {};

            console.log('--- ALL TABLES ---');
            Object.keys(definitions).forEach(t => console.log('- ' + t));

            ['app_settings', 'diet_app_settings', 'system_settings'].forEach(tableName => {
                if (definitions[tableName]) {
                    console.log(`\n--- COLUMNS FOR ${tableName} ---`);
                    Object.keys(definitions[tableName].properties).forEach(p => console.log('  * ' + p));
                } else {
                    console.log(`\nTable ${tableName} NOT FOUND`);
                }
            });
        } catch (e) {
            console.log('Error:', e.message);
        }
    });
});
