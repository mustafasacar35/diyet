
import fs from 'fs';
import path from 'path';
import pg from 'pg';

// Using direct connection string from .env.local
const CONNECTION_STRING = 'postgresql://postgres:Dr_mistdenx2@db.edcxbjneplsktmlrkvix.supabase.co:5432/postgres';

async function runSql() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Usage: npx tsx scripts/run_sql.ts <file.sql>');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), sqlFile);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    console.log(`Reading SQL file: ${filePath}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    console.log('Connecting to DB...');
    const client = new pg.Client({
        connectionString: CONNECTION_STRING,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected. Executing SQL...');

        const result = await client.query(sqlContent);
        console.log('SQL Executed Successfully.');
        if (result.rows && result.rows.length > 0) {
            console.log('Result:', result.rows);
        }

    } catch (err) {
        console.error('SQL Execution Failed:', err);
    } finally {
        await client.end();
    }
}

runSql();
