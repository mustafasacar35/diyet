-- ==============================================================================
-- MESSAGING SYSTEM (v30)
-- Real-time chat between Patients and Dietitians
-- ==============================================================================

-- 1. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    last_message_preview text,
    last_message_at timestamptz DEFAULT now(),
    type text DEFAULT 'direct' CHECK (type IN ('direct', 'group'))
);

-- 2. PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.participants (
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    last_read_at timestamptz DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    content text,
    type text DEFAULT 'text' CHECK (type IN ('text', 'image', 'file')),
    created_at timestamptz DEFAULT now(),
    is_read boolean DEFAULT false, -- Simple read status (if any participant read it? Or logic via participants)
    -- Actually, read status is per-user. But for simple 1-on-1, "seen" means the other person saw it.
    -- We'll track "last_read_at" in participants to determine "unread count".
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- We might need participants too for presence or typing indicators later

-- RLS POLICIES

-- CONVERSATIONS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view conversations they are participating in"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.participants p
        WHERE p.conversation_id = id
        AND p.user_id = auth.uid()
    )
);

-- PARTICIPANTS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their conversations"
ON public.participants FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id FROM public.participants
        WHERE user_id = auth.uid()
    )
);

-- MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id FROM public.participants
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    conversation_id IN (
        SELECT conversation_id FROM public.participants
        WHERE user_id = auth.uid()
    )
    AND
    sender_id = auth.uid()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation_id ON public.participants(conversation_id);

-- HELPER FUNCTIONS

-- Function to create or get a direct conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user_a uuid, user_b uuid)
RETURNS uuid AS $$
DECLARE
    conv_id uuid;
BEGIN
    -- Check if conversation already exists
    SELECT p1.conversation_id INTO conv_id
    FROM participants p1
    JOIN participants p2 ON p1.conversation_id = p2.conversation_id
    JOIN conversations c ON p1.conversation_id = c.id
    WHERE p1.user_id = user_a 
    AND p2.user_id = user_b 
    AND c.type = 'direct'
    LIMIT 1;

    -- If found, return it
    IF conv_id IS NOT NULL THEN
        RETURN conv_id;
    END IF;

    -- Create new conversation
    INSERT INTO conversations (type) VALUES ('direct') RETURNING id INTO conv_id;

    -- Add participants
    INSERT INTO participants (conversation_id, user_id) VALUES (conv_id, user_a);
    INSERT INTO participants (conversation_id, user_id) VALUES (conv_id, user_b);

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation updated_at and last_message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        updated_at = now(),
        last_message_at = now(),
        last_message_preview = left(NEW.content, 50)
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE PROCEDURE public.handle_new_message();

