-- ==============================================================================
-- ADMIN CREATE USER RPC FUNCTION
-- ==============================================================================
-- Bu fonksiyon, Admin panelinden yeni kullanıcı oluşturmayı sağlar.
-- Service Key'e ihtiyaç duymaz, doğrudan veritabanında çalışır.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  -- 1. Güvenlik: Sadece Adminler çağırabilir
  SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF v_admin_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkisiz: Sadece adminler kullanıcı oluşturabilir.');
  END IF;

  -- 2. E-posta zaten var mı?
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = new_email) INTO v_exists;
  IF v_exists THEN
     RETURN jsonb_build_object('success', false, 'error', 'Bu e-posta adresi zaten kayıtlı.');
  END IF;

  -- 3. Auth User Oluştur
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

  -- 4. Profil Oluştur
  INSERT INTO public.profiles (id, role, full_name, title)
  VALUES (v_user_id, new_role, new_full_name, new_title)
  ON CONFLICT (id) DO UPDATE 
  SET role = new_role, full_name = new_full_name, title = new_title;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Yetkiyi ver
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

SELECT 'Admin Create User RPC hazır!' as status;
