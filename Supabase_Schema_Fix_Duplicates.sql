-- Prevent duplicate weeks for the same diet plan
CREATE UNIQUE INDEX IF NOT EXISTS idx_diet_weeks_plan_week ON diet_weeks (diet_plan_id, week_number);

-- If you have duplicate data preventing this index, you can clean it up first (optional but recommended if error occurs):
-- DELETE FROM diet_weeks a USING diet_weeks b WHERE a.id < b.id AND a.diet_plan_id = b.diet_plan_id AND a.week_number = b.week_number;
