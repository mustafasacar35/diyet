
const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: "postgresql://postgres:Dr_mistdenx2@db.edcxbjneplsktmlrkvix.supabase.co:5432/postgres"
    });
    try {
        await client.connect();
        console.log('--- TABLES ---');
        const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(r => r.table_name));

        const targetTables = ['app_settings', 'diet_app_settings', 'settings'];
        for (const table of targetTables) {
            console.log(`\n--- COLUMNS OF ${table} ---`);
            const columns = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [table]);
            console.log(columns.rows.map(r => r.column_name));
        }

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

checkSchema();
