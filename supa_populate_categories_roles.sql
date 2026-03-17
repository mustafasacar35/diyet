-- Populate food_categories with existing distinct categories from foods table
INSERT INTO food_categories (name)
SELECT DISTINCT category
FROM foods
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (name) DO NOTHING;

-- Populate food_roles with existing distinct roles from foods table
-- Note: mimicking key and label with the same value for unknown roles
INSERT INTO food_roles (key, label)
SELECT DISTINCT role, role
FROM foods
WHERE role IS NOT NULL AND role != ''
ON CONFLICT (key) DO NOTHING;

-- Analyze to update stats
ANALYZE food_categories;
ANALYZE food_roles;
