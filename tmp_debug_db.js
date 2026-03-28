const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: "postgresql://postgres:Dr_mistdenx2@db.edcxbjneplsktmlrkvix.supabase.co:5432/postgres"
    });
    try {
        await client.connect();
        console.log('Connected to DB');

        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log('Tables in public schema:', tables.rows.map(r => r.table_name));

        const appSettingsCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'app_settings';
        `);
        console.log('Columns in app_settings:', appSettingsCols.rows);

        const dietAppSettingsCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'diet_app_settings';
        `);
        console.log('Columns in diet_app_settings:', dietAppSettingsCols.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
