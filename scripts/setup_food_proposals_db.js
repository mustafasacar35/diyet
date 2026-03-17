require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ DATABASE_URL missing in .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
});

async function setupFoodProposals() {
    try {
        await client.connect();
        console.log("✅ Connected to Supabase PostgreSQL");

        console.log("Creating food_proposals table...");

        await client.query(`
            CREATE TABLE IF NOT EXISTS food_proposals (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL, -- Reference to auth.users, but usually we just store the UUID
                food_name TEXT NOT NULL,
                calories NUMERIC DEFAULT 0,
                protein NUMERIC DEFAULT 0,
                carbs NUMERIC DEFAULT 0,
                fat NUMERIC DEFAULT 0,
                portion_guess TEXT,
                image_url TEXT,
                status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                admin_note TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_food_proposals_user ON food_proposals(user_id);
            CREATE INDEX IF NOT EXISTS idx_food_proposals_status ON food_proposals(status);

            -- Enable RLS
            ALTER TABLE food_proposals ENABLE ROW LEVEL SECURITY;

            -- Policies
            DO $$
            BEGIN
                -- 1. Users can insert their own proposals
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_proposals' AND policyname = 'Users can insert own proposals') THEN
                    CREATE POLICY "Users can insert own proposals" ON food_proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
                END IF;

                -- 2. Users can view their own proposals
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_proposals' AND policyname = 'Users can view own proposals') THEN
                     CREATE POLICY "Users can view own proposals" ON food_proposals FOR SELECT USING (auth.uid() = user_id);
                END IF;
                
                -- 3. Admins (service role) bypass RLS automatically. 
                
                -- 4. Create Storage Bucket for Meal Photos
                INSERT INTO storage.buckets (id, name, public)
                VALUES ('meal-photos', 'meal-photos', true)
                ON CONFLICT (id) DO NOTHING;

                -- 5. Storage Policies
                -- Allow public access to view
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access to Meal Photos') THEN
                     CREATE POLICY "Public Access to Meal Photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');
                END IF;

                -- Allow authenticated users to upload
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Users can Upload Photos') THEN
                     CREATE POLICY "Authenticated Users can Upload Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');
                END IF;
                
            END
            $$;
        `);

        console.log("✅ food_proposals table created successfully.");

    } catch (err) {
        console.error("❌ Error during setup:", err);
    } finally {
        await client.end();
    }
}

setupFoodProposals();
