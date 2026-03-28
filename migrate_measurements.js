const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    console.log('Adding columns to patient_measurements...');
    await client.query(`
      ALTER TABLE public.patient_measurements 
      ADD COLUMN IF NOT EXISTS diet_week_id UUID REFERENCES public.diet_weeks(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS week_number INTEGER;
    `);
    
    console.log('Adding index on diet_week_id...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_patient_measurements_diet_week_id ON public.patient_measurements(diet_week_id);
    `);

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
