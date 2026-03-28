-- Enable pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Drop existing function if exists
DROP FUNCTION IF EXISTS admin_update_user_password(UUID, TEXT);

-- Recreate function with correct usage of crypt and gen_salt
CREATE OR REPLACE FUNCTION admin_update_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
-- Set search_path to ensure extensions are found (Supabase standard is schemas 'extensions', 'public')
SET search_path = extensions, public, auth
AS $$
BEGIN
  -- Check if executing user is admin using PROFILES table
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Fallback: If no profile found by ID, maybe check auth.users metadata? 
    -- But assuming profiles table is the source of truth for app roles.
    RAISE EXCEPTION 'Only admins can update passwords';
  END IF;

  -- Update auth.users password
  -- Note: We use pgcrypto's crypt function with cost 10 (Supabase standard). 
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf', 10))
  WHERE id = target_user_id;

  -- Optional: Update updated_at in profiles if column exists
  -- Commented out to prevent "column does not exist" errors if schema differs
  -- UPDATE public.profiles
  -- SET updated_at = NOW()
  -- WHERE id = target_user_id;
END;
$$;
