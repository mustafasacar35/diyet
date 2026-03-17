const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB to reload schema cache...");

        // NOTIFY pgrst for reloading schemas in Supabase
        await client.query('NOTIFY pgrst, \'reload schema\';');
        console.log("Notified PostgREST to reload schema.");
    } catch (err) {
        console.error("Connection error", err.stack);
    } finally {
        await client.end();
    }
}

run();
