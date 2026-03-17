-- Repair Script: Ensure all diet weeks have 7 days
-- This script safely inserts missing days (1-7) for any existing week.

INSERT INTO public.diet_days (diet_week_id, day_number, notes)
SELECT 
    w.id as diet_week_id,
    d.day_num as day_number,
    '' as notes
FROM 
    public.diet_weeks w
CROSS JOIN 
    (SELECT generate_series(1, 7) as day_num) d
WHERE 
    NOT EXISTS (
        SELECT 1 
        FROM public.diet_days dd 
        WHERE dd.diet_week_id = w.id 
        AND dd.day_number = d.day_num
    );

-- Output result
DO $$
DECLARE
    repaired_count INTEGER;
BEGIN
    SELECT count(*) INTO repaired_count FROM public.diet_days WHERE created_at > (NOW() - INTERVAL '1 minute');
    RAISE NOTICE 'Added missing days.';
END $$;
