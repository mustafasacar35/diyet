const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkPrompts() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query('SELECT * FROM system_prompts');
        console.log('System Prompts:', res.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkPrompts();
