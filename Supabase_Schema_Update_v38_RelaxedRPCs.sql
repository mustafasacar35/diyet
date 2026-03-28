-- v38: RELAXED PERMISSIONS FOR GROUP RPCs
-- Allows Admins and Dietitians to manage groups regardless of ownership

-- 1. UPDATE: ADD MEMBERS
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
    
    -- 1. Check if participant
    SELECT EXISTS (
        SELECT 1 FROM public.participants 
        WHERE conversation_id = target_conversation_id AND user_id = auth_user_id
    ) INTO is_allowed;

    -- 2. If not participant, check if Admin or Dietitian
    IF NOT is_allowed THEN
        SELECT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth_user_id AND role IN ('admin', 'dietitian')
        ) INTO is_allowed;
    END IF;

    IF NOT is_allowed THEN
        RAISE EXCEPTION 'Access denied: You must be a participant, Admin, or Dietitian.';
    END IF;

    FOREACH mid IN ARRAY new_member_ids
    LOOP
        INSERT INTO public.participants (conversation_id, user_id)
        VALUES (target_conversation_id, mid)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. UPDATE: REMOVE MEMBER (Kick)
CREATE OR REPLACE FUNCTION public.remove_group_member(
    target_conversation_id uuid,
    target_user_id uuid
)
RETURNS void AS $$
DECLARE
    auth_user_id uuid;
    is_owner boolean;
    is_admin_or_dietitian boolean;
BEGIN
    auth_user_id := auth.uid();
    
    -- Check if owner
    SELECT (owner_id = auth_user_id) INTO is_owner
    FROM public.conversations
    WHERE id = target_conversation_id;

    -- Check if Admin/Dietitian
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth_user_id AND role IN ('admin', 'dietitian')
    ) INTO is_admin_or_dietitian;

    -- Allow if: Self-remove OR Owner OR Admin/Dietitian
    IF auth_user_id != target_user_id AND NOT is_owner AND NOT is_admin_or_dietitian THEN
         RAISE EXCEPTION 'Access denied: Only owner, Admin, or Dietitian can remove other members.';
    END IF;

    DELETE FROM public.participants
    WHERE conversation_id = target_conversation_id AND user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. UPDATE: DELETE GROUP
CREATE OR REPLACE FUNCTION public.delete_group_conversation(
    target_conversation_id uuid
)
RETURNS void AS $$
DECLARE
    auth_user_id uuid;
    is_owner boolean;
    is_admin_or_dietitian boolean;
BEGIN
    auth_user_id := auth.uid();
    
    SELECT (owner_id = auth_user_id) INTO is_owner
    FROM public.conversations
    WHERE id = target_conversation_id;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth_user_id AND role IN ('admin', 'dietitian')
    ) INTO is_admin_or_dietitian;
    
    IF NOT is_owner AND NOT is_admin_or_dietitian THEN
        RAISE EXCEPTION 'Access denied: Only owner, Admin, or Dietitian can delete the group.';
    END IF;

    DELETE FROM public.conversations
    WHERE id = target_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
