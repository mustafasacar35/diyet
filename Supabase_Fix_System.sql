-- ==============================================================================
-- SYSTEM STABILITY FIX (Triggers & Functions)
-- ==============================================================================
-- This script fixes potential 'Schema Error' issues by enforcing search_path
-- on critical functions and triggers used during Login/Registration.

-- 1. Fix get_my_role (Used in RLS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions;

-- 2. Fix handle_new_user (Used in Registration)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Yeni Kullanıcı'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role; -- Ensure role is synced if conflict
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Re-attach trigger just in case
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Ensure extensions schema is available (for pgcrypto if needed internally)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 4. Grant permissions to ensure no access denied errors
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Confirmation
SELECT 'System Functions Fixed' as status;
