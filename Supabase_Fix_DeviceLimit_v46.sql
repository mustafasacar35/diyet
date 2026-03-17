
-- ==============================================================================
-- FIX DEVICE LIMIT & PROFILE TRIGGER (v46)
-- ==============================================================================
-- 1. Updates default max_devices to 1 (was 3).
-- 2. Repair 'handle_new_user' trigger to explicit set max_devices = 1.
-- 3. Ensures profiles are created correctly.

-- 1. Set Default to 1
ALTER TABLE public.profiles ALTER COLUMN max_devices SET DEFAULT 1;

-- 2. Update existing users (Reset basic users to 1, keep custom logic if any?)
--    Safe approach: Only update those with 3 (old default) or NULL.
UPDATE public.profiles SET max_devices = 1 WHERE max_devices = 3 OR max_devices IS NULL;

-- 3. Repair/Update Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url, max_devices)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'patient'),
    COALESCE(new.raw_user_meta_data->>'full_name', 'Yeni Kullanıcı'),
    new.raw_user_meta_data->>'avatar_url',
    1 -- Explicit limit for new users
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role, -- Sync role if conflict
    full_name = EXCLUDED.full_name; -- Sync name (optional but good)
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- 4. Re-attach trigger (Idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

SELECT 'Device Limit Fixed & Trigger Repaired' as status;
