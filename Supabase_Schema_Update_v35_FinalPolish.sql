-- 1. FIX UNREAD COUNT PERSISTENCE (Allow updating last_read_at)
DROP POLICY IF EXISTS "Users can update own participant row" ON public.participants;
CREATE POLICY "Users can update own participant row"
ON public.participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. DELETE MESSAGE SUPPORT (Soft Delete)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

-- 3. GLOBAL UNREAD COUNT RPC
CREATE OR REPLACE FUNCTION public.get_total_unread_count(_user_id uuid)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.messages m
    JOIN public.participants p ON p.conversation_id = m.conversation_id
    WHERE p.user_id = _user_id
    AND m.sender_id != _user_id
    AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
