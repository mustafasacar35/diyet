-- ================================================
-- Diet Editor - Schema Update V11 (Lock Propagation)
-- RPC Function to handle bulk locked meal assignment
-- ================================================

CREATE OR REPLACE FUNCTION propagate_locked_meal(
    p_plan_id UUID,
    p_week_id UUID,
    p_day_date DATE,  -- The date of the source meal
    p_meal_time TEXT, -- e.g., 'KAHVALTI'
    p_food_id UUID,
    p_portion_multiplier NUMERIC,
    p_scope TEXT      -- 'week' or 'plan'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    target_date DATE;
    source_week_end_date DATE;
    r_day RECORD;
BEGIN
    -- Get the end date of the current week to define 'week' scope
    SELECT end_date INTO source_week_end_date FROM diet_weeks WHERE id = p_week_id;

    -- Iterate through all days in the plan that match the criteria
    FOR r_day IN
        SELECT d.id as day_id, w.start_date + (d.day_number - 1) as calendar_date
        FROM diet_days d
        JOIN diet_weeks w ON d.diet_week_id = w.id
        WHERE w.diet_plan_id = p_plan_id
        -- Scope filtering
        AND (
            (p_scope = 'week' AND w.id = p_week_id) OR
            (p_scope = 'plan') -- For plan, we take all weeks belonging to plan
        )
    LOOP
        -- Calculate the actual date of this day record
        -- (Assuming week.start_date is DATE and d.day_number is 1-based index)
        target_date := r_day.calendar_date;

        -- Apply logic only for FUTURE dates (including today/target date)
        IF target_date > p_day_date THEN
            -- 1. DELETE existing meals in that slot
            -- Note: We normalize meal_time comparison usually, but here strict match
            DELETE FROM diet_meals 
            WHERE diet_day_id = r_day.day_id 
            AND meal_time = p_meal_time;

            -- 2. INSERT the locked meal
            INSERT INTO diet_meals (
                diet_day_id,
                meal_time,
                food_id,
                portion_multiplier,
                is_locked,
                sort_order,
                custom_notes
            ) VALUES (
                r_day.day_id,
                p_meal_time,
                p_food_id,
                p_portion_multiplier,
                TRUE, -- Locked
                0,
                'Otomatik Kilitlendi'
            );
        END IF;
    END LOOP;
END;
$$;

-- Function to bulk UNLOCK and DELETE meals
CREATE OR REPLACE FUNCTION delete_propagated_meals(
    p_plan_id UUID,
    p_week_id UUID,
    p_day_date DATE,
    p_meal_time TEXT,
    p_food_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    target_date DATE;
    r_day RECORD;
BEGIN
    -- Iterate through future days
    FOR r_day IN
        SELECT d.id as day_id, w.start_date + (d.day_number - 1) as calendar_date
        FROM diet_days d
        JOIN diet_weeks w ON d.diet_week_id = w.id
        WHERE w.diet_plan_id = p_plan_id
    LOOP
        target_date := r_day.calendar_date;

        IF target_date > p_day_date THEN
            -- Delete only if it matches food and is locked
            DELETE FROM diet_meals 
            WHERE diet_day_id = r_day.day_id 
            AND meal_time = p_meal_time
            AND food_id = p_food_id
            AND is_locked = TRUE;
        END IF;
    END LOOP;
END;
$$;
