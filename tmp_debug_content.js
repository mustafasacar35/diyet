const https = require('https');

const url = 'https://edcxbjneplsktmlrkvix.supabase.co/rest/v1/';
const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkY3hiam5lcGxza3RtbHJrdml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDYzNjgsImV4cCI6MjA4NDIyMjM2OH0.-ZghlLIjfODUpMYG_suT_hXv2owcezNU4NcORxEsvaw';

function fetchTable(tableName, query) {
    const options = {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` }
    };
    return new Promise((resolve) => {
        https.get(`${url}${tableName}?${query}`, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        });
    });
}

async function checkContent() {
    const appSet = await fetchTable('app_settings', 'select=*');
    const dietAppSet = await fetchTable('diet_app_settings', 'select=*');

    console.log('APP_SETTINGS CONTENT:', appSet);
    console.log('DIET_APP_SETTINGS CONTENT:', dietAppSet);
}

checkContent();
