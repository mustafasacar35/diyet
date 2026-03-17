-- Allow ALL operations on recipe tables for now
ALTER TABLE recipe_manual_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_match_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON recipe_manual_matches
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for all users" ON recipe_match_bans
FOR ALL
USING (true)
WITH CHECK (true);
