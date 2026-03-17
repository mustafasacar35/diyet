const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB");

        // Using IF NOT EXISTS safely by querying table schema first, or just try catch
        try {
            await client.query('ALTER TABLE patients ADD COLUMN phone text;');
            console.log("Added phone column.");
        } catch (e) {
            console.log("Phone column might exist:", e.message);
        }

        try {
            await client.query('ALTER TABLE patients ADD COLUMN patient_goals text[];');
            console.log("Added patient_goals column.");
        } catch (e) {
            console.log("patient_goals column might exist:", e.message);
        }
    } catch (err) {
        console.error("Connection error", err.stack);
    } finally {
        await client.end();
    }
}

run();
