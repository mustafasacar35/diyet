
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
            console.log('--- TABLES ---');
            console.log(Object.keys(definitions).join(', '));

            Object.keys(definitions).forEach(tableName => {
                if (tableName.includes('settings')) {
                    console.log(`\nCOLUMNS for ${tableName}:`, Object.keys(definitions[tableName].properties).join(', '));
                }
            });
        } catch (e) {
            console.log('Error:', e.message);
        }
    });
});
