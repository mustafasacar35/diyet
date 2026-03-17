
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();

        console.log('--- Tables ---');
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(tables.rows.map(r => r.table_name).join(', '));

        console.log('\n--- Columns of app_settings ---');
        const columns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'app_settings'
        `);
        console.log(columns.rows);

        console.log('\n--- Columns of diet_app_settings ---');
        const dietColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'diet_app_settings'
        `);
        console.log(dietColumns.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
