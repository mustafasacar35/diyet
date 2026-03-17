-- DROP REMAINING AUTH TRIGGERS
-- These are creating profiles and patients automatically

-- 1. Drop trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- 2. Clean up any incomplete patients created recently
DELETE FROM public.patients p
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles pr WHERE pr.id = p.id
) OR p.full_name = 'Yeni Hasta' OR p.full_name IS NULL OR p.full_name = '';

-- Note: We still need a way to auto-create 'profiles' from auth.users, but NOT 'patients'.
-- If we dropped auth.users triggers, 'profiles' won't be created on OAuth login.
-- Let's reinstate the auth trigger but ONLY for creating 'profiles'.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'İsimsiz Kullanıcı'
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'patient'
    ),
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT 'Auth trigger reset to ONLY create profiles. Inactive patients cleaned.' as status;
