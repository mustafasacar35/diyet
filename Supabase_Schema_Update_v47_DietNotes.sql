-- 1. Create diet_notes table
CREATE TABLE IF NOT EXISTS public.diet_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diet_day_id UUID REFERENCES public.diet_days(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    original_note_id UUID REFERENCES public.diet_notes(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add persistent_locked_notes to diet_plans
ALTER TABLE public.diet_plans ADD COLUMN IF NOT EXISTS persistent_locked_notes JSONB DEFAULT '[]'::jsonb;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_diet_notes_day_id ON public.diet_notes(diet_day_id);

-- 4. RLS
ALTER TABLE public.diet_notes ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Enable all for authenticated" ON diet_notes;
CREATE POLICY "Enable all for authenticated" ON diet_notes FOR ALL USING (auth.role() = 'authenticated');

-- 6. RPC: Propagate Diet Note
CREATE OR REPLACE FUNCTION propagate_diet_note(
    p_plan_id UUID,
    p_week_id UUID,
    p_day_date DATE,
    p_content TEXT,
    p_scope TEXT,
    p_original_note_id UUID
)
RETURNS VOID AS $$
DECLARE
    r_day RECORD;
    target_date DATE;
BEGIN
    FOR r_day IN
        SELECT d.id as day_id, w.start_date + (d.day_number - 1) as calendar_date
        FROM diet_days d
        JOIN diet_weeks w ON d.diet_week_id = w.id
        WHERE w.diet_plan_id = p_plan_id
        AND (
            (p_scope = 'week' AND w.id = p_week_id) OR
            (p_scope = 'plan')
        )
    LOOP
        target_date := r_day.calendar_date;

        IF target_date > p_day_date THEN
            -- Delete existing copies of this specific note (if any)
            DELETE FROM diet_notes 
            WHERE diet_day_id = r_day.day_id 
            AND original_note_id = p_original_note_id;

            -- Insert the copy
            INSERT INTO diet_notes (
                diet_day_id,
                content,
                is_locked,
                original_note_id,
                sort_order
            ) VALUES (
                r_day.day_id,
                p_content,
                TRUE, -- Propagated notes are locked by default
                p_original_note_id,
                0
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. RPC: Delete Propagated Notes
CREATE OR REPLACE FUNCTION delete_propagated_notes(
    p_plan_id UUID,
    p_week_id UUID,
    p_day_date DATE,
    p_original_note_id UUID
)
RETURNS VOID AS $$
DECLARE
    r_day RECORD;
    target_date DATE;
BEGIN
    FOR r_day IN
        SELECT d.id as day_id, w.start_date + (d.day_number - 1) as calendar_date
        FROM diet_days d
        JOIN diet_weeks w ON d.diet_week_id = w.id
        WHERE w.diet_plan_id = p_plan_id
    LOOP
        target_date := r_day.calendar_date;

        IF target_date > p_day_date THEN
            DELETE FROM diet_notes 
            WHERE diet_day_id = r_day.day_id 
            AND original_note_id = p_original_note_id
            AND is_locked = TRUE;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
