const { Client } = require('pg');

async function runSQL() {
    const client = new Client({
        // Trying standard supabase format again
        connectionString: "postgresql://postgres.edcxbjneplsktmlrkvix:Dr_mistdenx2@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
    });

    try {
        await client.connect();
        await client.query(`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS variety_exempt_words TEXT[] DEFAULT '{}'::TEXT[];`);
        console.log("Success");
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
runSQL();
