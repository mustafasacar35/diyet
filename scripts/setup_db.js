
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL missing in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function setupDatabase() {
    try {
        await client.connect();
        console.log("✅ Connected to Supabase PostgreSQL");

        // 1. Create Tables
        console.log("Creating tables...");

        await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS foods (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        category TEXT,
        calories NUMERIC DEFAULT 0,
        protein NUMERIC DEFAULT 0,
        carbs NUMERIC DEFAULT 0,
        fat NUMERIC DEFAULT 0,
        portion_unit TEXT DEFAULT 'porsiyon',
        standard_amount NUMERIC DEFAULT 1,
        tags TEXT[],
        meta JSONB DEFAULT '{}'::jsonb,
        search_tokens TSVECTOR GENERATED ALWAYS AS (to_tsvector('turkish', name || ' ' || coalesce(category, ''))) STORED,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS foods_search_idx ON foods USING GIN (search_tokens);
      
      -- Enable RLS
      ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
      
      -- Create Policy (Allow Read for everyone, Write for authenticated - for now open for simplicty of script, but usually we handle this via Supabase Dashboard or Migrations)
      -- For this script to work, we are using the 'postgres' superuser role via connection string, so RLS doesn't block us.
      -- But for the app to read, we need a policy.
      
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'foods' AND policyname = 'Enable read access for all users'
          ) THEN
              CREATE POLICY "Enable read access for all users" ON foods FOR SELECT USING (true);
          END IF;
      END
      $$;

      CREATE TABLE IF NOT EXISTS patients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        full_name TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
       ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
       DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'patients' AND policyname = 'Enable all access for authenticated users'
          ) THEN
               CREATE POLICY "Enable all access for authenticated users" ON patients FOR ALL USING (auth.role() = 'authenticated');
          END IF;
      END
      $$;


      CREATE TABLE IF NOT EXISTS diet_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
       ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;


      CREATE TABLE IF NOT EXISTS diet_weeks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        diet_plan_id UUID REFERENCES diet_plans(id) ON DELETE CASCADE,
        week_number INTEGER NOT NULL,
        title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
       ALTER TABLE diet_weeks ENABLE ROW LEVEL SECURITY;

      CREATE TABLE IF NOT EXISTS diet_days (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        diet_week_id UUID REFERENCES diet_weeks(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
       ALTER TABLE diet_days ENABLE ROW LEVEL SECURITY;

      CREATE TABLE IF NOT EXISTS diet_meals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        diet_day_id UUID REFERENCES diet_days(id) ON DELETE CASCADE,
        food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
        meal_time TEXT NOT NULL,
        portion_multiplier NUMERIC DEFAULT 1,
        custom_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
       ALTER TABLE diet_meals ENABLE ROW LEVEL SECURITY;
    `);

        console.log("✅ Schema created successfully.");

        // 2. Import Data
        const dataPath = path.join(__dirname, '..', 'src', 'data', 'food_list.json');
        if (fs.existsSync(dataPath)) {
            console.log("Found food_list.json, importing...");
            const rawData = fs.readFileSync(dataPath, 'utf8');
            const jsonData = JSON.parse(rawData);

            let importedCount = 0;

            // Flatten the category structure
            // The JSON has "categories" array, each has "items" array.
            if (jsonData.categories) {
                for (const cat of jsonData.categories) {
                    const categoryName = cat.name;
                    for (const item of cat.items) {
                        // Prepare meta
                        const meta = {
                            role: item.role,
                            mealType: item.mealType,
                            dietTypes: item.dietTypes,
                            keto: item.keto,
                            lowcarb: item.lowcarb,
                            portionFixed: item.portionFixed,
                            fillerLunch: item.fillerLunch,
                            fillerDinner: item.fillerDinner,
                            compatibilityTags: item.compatibilityTags,
                            incompatibilityTags: item.incompatibilityTags,
                            seasonRange: item.seasonRange,
                            isReversedSeason: item.isReversedSeason,
                            notes: item.notes
                        };

                        const query = `
                INSERT INTO foods (name, category, calories, protein, carbs, fat, portion_unit, standard_amount, tags, meta)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT DO NOTHING
             `;

                        // Simple sanitization for standard_amount if it's derived or default
                        const minQ = item.minQuantity || 1;

                        await client.query(query, [
                            item.name,
                            categoryName,
                            item.calories || 0,
                            item.protein || 0,
                            item.carbs || 0,
                            item.fat || 0,
                            'porsiyon', // default
                            minQ,
                            item.tags || [],
                            meta
                        ]);
                        importedCount++;
                        if (importedCount % 100 === 0) process.stdout.write('.');
                    }
                }
            }
            console.log(`\n✅ Imported ${importedCount} foods.`);

        } else {
            console.warn("⚠️ food_list.json not found, skipping data import.");
        }

    } catch (err) {
        console.error("❌ Error during setup:", err);
    } finally {
        await client.end();
    }
}

setupDatabase();
