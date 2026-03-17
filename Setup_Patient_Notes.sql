-- 1. Create Patient Notes Table
CREATE TABLE IF NOT EXISTS public.patient_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    dietitian_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(), -- The author
    note_date DATE DEFAULT CURRENT_DATE NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- A. Admin & Doctor: Full Access
CREATE POLICY "Admins manage all notes"
ON public.patient_notes
FOR ALL
TO authenticated
USING (public.get_my_role() IN ('admin', 'doctor'));

-- B. Dietitian: Access ONLY for Assigned Patients
-- View: Can see notes for assigned patients (even if written by others? Maybe yes, for collaboration. Or only own? Usually shared context is good.)
-- Let's allow seeing ALL notes for assigned patients.
CREATE POLICY "Dietitians view assigned patient notes"
ON public.patient_notes
FOR SELECT
TO authenticated
USING (
  public.get_my_role() = 'dietitian'
  AND EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    WHERE pa.patient_id = patient_notes.patient_id
    AND pa.dietitian_id = auth.uid()
  )
);

-- Insert: Can insert for assigned patients
CREATE POLICY "Dietitians insert assigned patient notes"
ON public.patient_notes
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_my_role() = 'dietitian'
  AND EXISTS (
    SELECT 1 FROM public.patient_assignments pa
    WHERE pa.patient_id = patient_notes.patient_id
    AND pa.dietitian_id = auth.uid()
  )
);

-- Update/Delete: Can manage ONLY OWN notes? Or all notes for assigned patient?
-- Generally, you should only edit your own notes for audit purposes.
CREATE POLICY "Dietitians manage own notes"
ON public.patient_notes
FOR UPDATE
TO authenticated
USING (
  public.get_my_role() = 'dietitian'
  AND dietitian_id = auth.uid()
);

CREATE POLICY "Dietitians delete own notes"
ON public.patient_notes
FOR DELETE
TO authenticated
USING (
  public.get_my_role() = 'dietitian'
  AND dietitian_id = auth.uid()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON public.patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_date ON public.patient_notes(note_date DESC);
