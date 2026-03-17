-- 1. ADD owner_id TO CONVERSATIONS
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

-- Backfill owner_id for existing groups (pick the first participant)
UPDATE public.conversations c
SET owner_id = (
    SELECT p.user_id 
    FROM public.participants p 
    WHERE p.conversation_id = c.id 
    ORDER BY p.created_at ASC 
    LIMIT 1
)
WHERE c.type = 'group' AND c.owner_id IS NULL;


-- 2. UPDATE CREATE FUNCTION
CREATE OR REPLACE FUNCTION public.create_group_conversation(
  creator_id uuid,
  member_ids uuid[],
  group_title text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  conv_id uuid;
  mid uuid;
BEGIN
  -- Create Conversation with owner
  INSERT INTO public.conversations (type, title, owner_id)
  VALUES ('group', group_title, creator_id)
  RETURNING id INTO conv_id;

  -- Add Creator
  INSERT INTO public.participants (conversation_id, user_id)
  VALUES (conv_id, creator_id);

  -- Add Members
  FOREACH mid IN ARRAY member_ids
  LOOP
    IF mid != creator_id THEN
      INSERT INTO public.participants (conversation_id, user_id)
      VALUES (conv_id, mid);
    END IF;
  END LOOP;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: ADD MEMBERS
CREATE OR REPLACE FUNCTION public.add_group_members(
    target_conversation_id uuid,
    new_member_ids uuid[]
)
RETURNS void AS $$
DECLARE
    auth_user_id uuid;
    is_allowed boolean;
    mid uuid;
BEGIN
    auth_user_id := auth.uid();
    
    -- Check permissions: Must be a participant of the group OR Admin/Dietitian
    -- For simplicity: Check if participant
    SELECT EXISTS (
        SELECT 1 FROM public.participants 
        WHERE conversation_id = target_conversation_id AND user_id = auth_user_id
    ) INTO is_allowed;

    IF NOT is_allowed THEN
        -- Also allow if Admin
        -- (Optional logic skipped for brevity, sticking to participants add participants)
        RAISE EXCEPTION 'Access denied';
    END IF;

    FOREACH mid IN ARRAY new_member_ids
    LOOP
        INSERT INTO public.participants (conversation_id, user_id)
        VALUES (target_conversation_id, mid)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: REMOVE MEMBER (Kick)
CREATE OR REPLACE FUNCTION public.remove_group_member(
    target_conversation_id uuid,
    target_user_id uuid
)
RETURNS void AS $$
DECLARE
    auth_user_id uuid;
    is_owner boolean;
BEGIN
    auth_user_id := auth.uid();
    
    -- Check if owner or self (Leave is handled by standard delete, but this RPC simplifies generic remove)
    SELECT (owner_id = auth_user_id) INTO is_owner
    FROM public.conversations
    WHERE id = target_conversation_id;

    IF auth_user_id != target_user_id AND NOT is_owner THEN
         RAISE EXCEPTION 'Only owner can remove other members';
    END IF;

    DELETE FROM public.participants
    WHERE conversation_id = target_conversation_id AND user_id = target_user_id;

    -- If owner leaves, maybe transfer ownership? Skipped for now.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: DELETE GROUP
CREATE OR REPLACE FUNCTION public.delete_group_conversation(
    target_conversation_id uuid
)
RETURNS void AS $$
DECLARE
    auth_user_id uuid;
    is_owner boolean;
BEGIN
    auth_user_id := auth.uid();
    
    SELECT (owner_id = auth_user_id) INTO is_owner
    FROM public.conversations
    WHERE id = target_conversation_id;

    -- Also allow Dietitians/Admins to delete any group?
    -- For now stick to Owner.
    
    IF NOT is_owner THEN
        RAISE EXCEPTION 'Only owner can delete the group';
    END IF;

    DELETE FROM public.conversations
    WHERE id = target_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
