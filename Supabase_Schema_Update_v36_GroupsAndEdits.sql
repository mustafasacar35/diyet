-- 1. GROUP CONVERSATION SUPPORT
-- Add title column for groups
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title text;

-- RPC to create group securely (Bypassing RLS for Insert+Select issue)
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
  -- Create Conversation
  INSERT INTO public.conversations (type, title)
  VALUES ('group', group_title)
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


-- 2. EDIT MESSAGE SUPPORT
-- Add is_edited column
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false;

-- Trigger to mark edited
CREATE OR REPLACE FUNCTION public.handle_message_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
      NEW.is_edited = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_message_edit ON public.messages;
CREATE TRIGGER on_message_edit
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_message_edit();
