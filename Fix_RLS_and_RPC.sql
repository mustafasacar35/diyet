-- ==============================================================================
-- FIX RLS & ADD ADMIN CREATE USER RPC
-- ==============================================================================

-- 1. FIX LOGIN ERROR (Database error querying schema)
-- ------------------------------------------------------------------------------
-- get_my_role sometimes causes recursion or errors. We simplify it.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'patient'); -- Default to patient if null
EXCEPTION WHEN OTHERS THEN
  RETURN 'patient';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role, anon;


-- 2. CREATE ADMIN USER CREATION FUNCTION (RPC)
-- ------------------------------------------------------------------------------
-- This allows the Admin to create users directly from the UI without Service Key.

CREATE OR REPLACE FUNCTION public.admin_create_user(
    new_email TEXT,
    new_password TEXT,
    new_full_name TEXT,
    new_role TEXT,
    new_title TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_admin_role TEXT;
  v_exists BOOLEAN;
BEGIN
  -- 1. Security Check: Only Admins can call this
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_admin_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create users.';
  END IF;

  -- 2. Check if email exists
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) INTO v_exists;
  IF v_exists THEN
     RETURN jsonb_build_object('success', false, 'error', 'Bu e-posta adresi zaten kayıtlı.');
  END IF;

  -- 3. Create Auth User
  v_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    new_email,
    crypt(new_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', new_full_name, 'role', new_role),
    now(),
    now()
  );

  -- 4. Create Profile (Manually to ensure it matches)
  INSERT INTO public.profiles (id, role, full_name, title)
  VALUES (v_user_id, new_role, new_full_name, new_title)
  ON CONFLICT (id) DO UPDATE 
  SET role = new_role, full_name = new_full_name, title = new_title;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Grant execute to authenticated users (The function itself checks checks for Admin role)
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

SELECT 'RPC Function Created & Login Error Fixed' as status;
