const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL is not set in .env.local');
        return;
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase in many environments
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, '..', 'Supabase_Schema_AI.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        console.log('Executing SQL...');
        await client.query(sqlContent);
        console.log('Migration completed successfully.');

    } catch (err) {
        fs.writeFileSync('migration_error.log', 'Migration failed: ' + err.message + '\n' + JSON.stringify(err, null, 2));
        console.error('Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
