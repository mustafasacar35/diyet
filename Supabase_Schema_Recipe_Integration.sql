-- Recipe Card Integration Schema

-- 1. Manual Matches (Forced positives)
CREATE TABLE IF NOT EXISTS recipe_manual_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    food_pattern TEXT NOT NULL, -- Normalized food name to match
    card_filename TEXT NOT NULL, -- Filename in GitHub repo
    original_text TEXT, -- Original text for reference
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Match Bans (Forced negatives)
CREATE TABLE IF NOT EXISTS recipe_match_bans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    food_pattern TEXT NOT NULL,
    card_filename TEXT NOT NULL,
    original_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Recipe Cards Cache (Optional, to avoid hitting GitHub constantly)
CREATE TABLE IF NOT EXISTS recipe_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    metadata JSONB, -- dimensions, size, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE recipe_manual_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_match_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_cards ENABLE ROW LEVEL SECURITY;

-- Policies for manual matches
CREATE POLICY "Public Read Manual Matches" ON recipe_manual_matches FOR SELECT USING (true);
CREATE POLICY "Admin All Manual Matches" ON recipe_manual_matches FOR ALL USING (
   (auth.email() = 'mustafasacar35@gmail.com')
);

-- Policies for bans
CREATE POLICY "Public Read Bans" ON recipe_match_bans FOR SELECT USING (true);
CREATE POLICY "Admin All Bans" ON recipe_match_bans FOR ALL USING (
   (auth.email() = 'mustafasacar35@gmail.com')
);

-- Policies for cards
CREATE POLICY "Public Read Cards" ON recipe_cards FOR SELECT USING (true);
CREATE POLICY "Admin All Cards" ON recipe_cards FOR ALL USING (
    (auth.email() = 'mustafasacar35@gmail.com')
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_manual_matches_pattern ON recipe_manual_matches(food_pattern);
CREATE INDEX IF NOT EXISTS idx_recipe_match_bans_pattern ON recipe_match_bans(food_pattern);
