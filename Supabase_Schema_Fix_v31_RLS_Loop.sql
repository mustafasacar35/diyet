-- ==============================================================================
-- FIX RLS INFINITE RECURSION (v31)
-- Solves the "Loading Spinner Loop" caused by recursive policies
-- ==============================================================================

-- 1. Create Helper Function (Security Definer to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_participant(_conversation_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.participants
    WHERE conversation_id = _conversation_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Conversations Policy
DROP POLICY IF EXISTS "Users can view conversations they are participating in" ON public.conversations;

CREATE POLICY "Users can view conversations they are participating in"
ON public.conversations FOR SELECT
USING (
  public.is_participant(id)
);

-- 3. Update Participants Policy
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.participants;

CREATE POLICY "Users can view participants of their conversations"
ON public.participants FOR SELECT
USING (
  public.is_participant(conversation_id)
);

-- 4. Update Messages Policy
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  public.is_participant(conversation_id)
);

-- 5. Helper function to find my assigned dietitian
CREATE OR REPLACE FUNCTION public.get_my_dietitian()
RETURNS uuid AS $$
  SELECT dietitian_id FROM public.patient_assignments
  WHERE patient_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
