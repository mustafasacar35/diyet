-- Function to get unread message counts for a user's conversations
CREATE OR REPLACE FUNCTION public.get_unread_counts(_user_id uuid)
RETURNS TABLE (conversation_id uuid, unread_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id, 
    COUNT(m.id) as unread_count
  FROM public.messages m
  JOIN public.participants p ON p.conversation_id = m.conversation_id
  WHERE p.user_id = _user_id
  AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
  GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
