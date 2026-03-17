-- ================================================
-- Device Security Schema - v44
-- Restrict users to a specific number of devices
-- ================================================

-- 1. Add max_devices to profiles (Default 3)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 3;

-- 2. Create user_devices table
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, -- Client-generated UUID (fingerprint)
    device_name TEXT,        -- User Agent or Browser Name
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, device_id)
);

-- RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" ON public.user_devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all devices" ON public.user_devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Webhook / RPC to Register Device
-- Called by client on Login or App Init
DROP FUNCTION IF EXISTS public.register_device(text, text);

CREATE OR REPLACE FUNCTION public.register_device(
    _device_id TEXT,
    _device_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _user_id UUID;
    _max_limit INTEGER;
    _current_count INTEGER;
    _device_exists BOOLEAN;
BEGIN
    _user_id := auth.uid();
    IF _user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get Limit
    SELECT max_devices INTO _max_limit FROM profiles WHERE id = _user_id;
    -- Default fallback if null
    IF _max_limit IS NULL THEN _max_limit := 1; END IF;

    -- Check if device already exists
    SELECT EXISTS(
        SELECT 1 FROM user_devices
        WHERE user_id = _user_id AND device_id = _device_id
    ) INTO _device_exists;

    IF _device_exists THEN
        -- Update last seen
        UPDATE user_devices
        SET last_active_at = NOW(), device_name = _device_name
        WHERE user_id = _user_id AND device_id = _device_id;
        
        RETURN jsonb_build_object('success', true, 'message', 'Device updated');
    ELSE
        -- Check Limit
        SELECT COUNT(*) INTO _current_count FROM user_devices WHERE user_id = _user_id;
        
        IF _current_count >= _max_limit THEN
            RAISE EXCEPTION 'Device limit reached (%/%)', _current_count, _max_limit;
        END IF;

        -- Register New
        INSERT INTO user_devices (user_id, device_id, device_name)
        VALUES (_user_id, _device_id, _device_name);

        RETURN jsonb_build_object('success', true, 'message', 'Device registered');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_device(text, text) TO authenticated;

-- 4. Admin RPC to Reset Devices
DROP FUNCTION IF EXISTS public.admin_reset_devices(uuid);

CREATE OR REPLACE FUNCTION public.admin_reset_devices(_target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    DELETE FROM user_devices WHERE user_id = _target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_devices(uuid) TO authenticated;

-- 5. Helper to get device usage for Admin Table
DROP FUNCTION IF EXISTS public.get_user_device_stats(uuid);
-- Note: admins can just select from user_devices directly since we added RLS policy,
-- but a view or helper might be easier for joining.
-- Let's just rely on RLS and direct link in admin table.

