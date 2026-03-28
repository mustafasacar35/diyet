-- 1. DELETE DUPLICATE WEEKS (Keeping the one with the smallest ID - usually the first created)
DELETE FROM diet_weeks a USING diet_weeks b
WHERE a.id > b.id 
AND a.diet_plan_id = b.diet_plan_id 
AND a.week_number = b.week_number;

-- 2. NOW ADD THE UNIQUE CONSTRAINT
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_weeks_plan_week ON diet_weeks (diet_plan_id, week_number);

-- 3. VERIFY
SELECT diet_plan_id, week_number, COUNT(*)
FROM diet_weeks
GROUP BY diet_plan_id, week_number
HAVING COUNT(*) > 1;
