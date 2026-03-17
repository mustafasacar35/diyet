-- ==============================================================================
-- FIXED ADMIN CREATE USER RPC (With Identity)
-- ==============================================================================
-- Bu fonksiyon artık hem auth.users hem de auth.identities tablosuna kayıt oluşturur.

DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT);

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
  v_encrypted_password TEXT;
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

  -- 3. UUID ve Şifre Hazırlığı
  v_user_id := gen_random_uuid();
  -- Cost factor 10 kullan (Supabase standart)
  v_encrypted_password := crypt(new_password, gen_salt('bf', 10));

  -- 4. Auth User Oluştur
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
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    new_email,
    v_encrypted_password,
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', new_full_name, 'role', new_role),
    now(),
    now(),
    '',
    ''
  );

  -- 5. Identity Kaydı Oluştur (ÖNEMLİ!)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    new_email,
    'email',
    jsonb_build_object('sub', v_user_id::text, 'email', new_email),
    now(),
    now(),
    now()
  );

  -- 6. Profil Oluştur
  INSERT INTO public.profiles (id, role, full_name, title)
  VALUES (v_user_id, new_role, new_full_name, new_title)
  ON CONFLICT (id) DO UPDATE 
  SET role = new_role, full_name = new_full_name, title = new_title;

  RETURN jsonb_build_object('success', true, 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions;

GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Mevcut test_doctor kullanıcısını da düzelt
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test_doctor@demo.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Şifreyi düzelt (cost 10)
    UPDATE auth.users 
    SET encrypted_password = crypt('123456', gen_salt('bf', 10))
    WHERE id = v_user_id;
    
    -- Identity ekle
    INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, 'test_doctor@demo.com', 'email', 
            jsonb_build_object('sub', v_user_id::text, 'email', 'test_doctor@demo.com'),
            now(), now(), now())
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

SELECT 'RPC ve test_doctor düzeltildi!' as status;
