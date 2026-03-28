-- v40: TEAR DOWN AND REBUILD GROUP RPCS WITH EXPLICIT PERMISSIONS

-- 1. DROP EXISTING FUNCTIONS (To remove any old definitions)
DROP FUNCTION IF EXISTS public.create_group_conversation(uuid, uuid[], text);
DROP FUNCTION IF EXISTS public.add_group_members(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.remove_group_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.delete_group_conversation(uuid);

-- 2. ENSURE OWNER_ID EXISTS
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

UPDATE public.conversations c
SET owner_id = (
    SELECT p.user_id 
    FROM public.participants p 
    WHERE p.conversation_id = c.id 
    ORDER BY p.created_at ASC 
    LIMIT 1
)
WHERE c.type = 'group' AND c.owner_id IS NULL;

-- 3. CREATE GROUP
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
  INSERT INTO public.conversations (type, title, owner_id)
  VALUES ('group', group_title, creator_id)
  RETURNING id INTO conv_id;

  INSERT INTO public.participants (conversation_id, user_id)
  VALUES (conv_id, creator_id);

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

-- 4. ADD MEMBERS (Admin/Dietitian Friendly)
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
    
    -- Check: Participant OR Admin/Dietitian
    SELECT EXISTS (
        SELECT 1 FROM public.participants WHERE conversation_id = target_conversation_id AND user_id = auth_user_id
    ) INTO is_allowed;

    IF NOT is_allowed THEN
        SELECT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth_user_id AND role IN ('admin', 'dietitian')
        ) INTO is_allowed;
    END IF;

    IF NOT is_allowed THEN
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


-- 5. REMOVE MEMBER (Admin/Dietitian Friendly)
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
    
    SELECT (owner_id = auth_user_id) INTO is_owner
    FROM public.conversations WHERE id = target_conversation_id;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth_user_id AND role IN ('admin', 'dietitian')
    ) INTO is_admin_or_dietitian;

    IF auth_user_id != target_user_id AND NOT is_owner AND NOT is_admin_or_dietitian THEN
         RAISE EXCEPTION 'Access denied';
    END IF;

    DELETE FROM public.participants
    WHERE conversation_id = target_conversation_id AND user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. DELETE GROUP (Admin/Dietitian Friendly + Cascade)
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
    FROM public.conversations WHERE id = target_conversation_id;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth_user_id AND role IN ('admin', 'dietitian')
    ) INTO is_admin_or_dietitian;
    
    IF NOT is_owner AND NOT is_admin_or_dietitian THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Manual Cascade
    DELETE FROM public.messages WHERE conversation_id = target_conversation_id;
    DELETE FROM public.participants WHERE conversation_id = target_conversation_id;
    DELETE FROM public.conversations WHERE id = target_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. GRANT EXECUTE PERMISSIONS (Important!)
GRANT EXECUTE ON FUNCTION public.create_group_conversation TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_group_members TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_group_member TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_group_conversation TO authenticated, service_role;
