const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("DATABASE_URL not found in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database...");

        console.log("Reloading PostgREST schema cache...");
        await client.query("NOTIFY pgrst, 'reload schema';");

        console.log("Schema cache reloaded successfully!");

    } catch (err) {
        console.error("Error executing SQL:", err);
    } finally {
        await client.end();
    }
}

run();
