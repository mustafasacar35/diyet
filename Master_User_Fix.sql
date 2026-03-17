-- ==============================================================================
-- MASTER FIX & CREATE USER SCRIPT
-- ==============================================================================
-- Bu script şunları yapar:
-- 1. "Database error" hatasını çözmek için sistem fonksiyonlarını (get_my_role) onarır.
-- 2. "Kaydol" takılmasını engellemek için otomatik trigger'ı kaldırır.
-- 3. "Too Many Requests" hatasına takılmadan SQL ile direkt kullanıcı oluşturur.
-- 4. Oluşturulan kullanıcıya "Diyetisyen" yetkisi verir.

-- A. SİSTEM ONARIMI
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- get_my_role fonksiyonunu güvenli hale getir
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions;

-- Trigger'ı geçici olarak devre dışı bırak
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- B. ESKİ TEST KULLANICILARINI TEMİZLE
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  target_email TEXT := 'diyetisyen_final@demo.com';
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM auth.users WHERE email = target_email;
  
  IF existing_id IS NOT NULL THEN
    DELETE FROM public.profiles WHERE id = existing_id;
    DELETE FROM public.patient_assignments WHERE dietitian_id = existing_id;
    -- auth.users silme işlemi kısıtlı olabilir ama deneriz
    -- DELETE FROM auth.users WHERE id = existing_id; 
    -- Eğer auth.users silinemezse, aşağıda INSERT yerine UPDATE yapacağız.
  END IF;
END $$;

-- C. YENİ KULLANICI OLUŞTUR (SQL İle)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  new_uid UUID := gen_random_uuid();
  user_email TEXT := 'diyetisyen_final@demo.com';
  user_pass TEXT := '123456';
  existing_user_id UUID;
BEGIN
  -- Kullanıcı zaten var mı kontrol et
  SELECT id INTO existing_user_id FROM auth.users WHERE email = user_email;

  IF existing_user_id IS NOT NULL THEN
    -- Varsa şifresini güncelle
    UPDATE auth.users 
    SET encrypted_password = crypt(user_pass, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('full_name', 'Final Diyetisyen', 'role', 'dietitian')
    WHERE id = existing_user_id;
    
    new_uid := existing_user_id;
  ELSE
    -- Yoksa yeni oluştur
    INSERT INTO auth.users (
      id, instance_id, role, aud, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      new_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
      user_email, crypt(user_pass, gen_salt('bf')), now(), 
      '{"provider":"email","providers":["email"]}', 
      jsonb_build_object('full_name', 'Final Diyetisyen', 'role', 'dietitian'), 
      now(), now()
    );
  END IF;

  -- Profilini Oluştur / Güncelle
  INSERT INTO public.profiles (id, role, full_name, title)
  VALUES (new_uid, 'dietitian', 'Final Diyetisyen', 'Uzman Diyetisyen')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'dietitian', full_name = 'Final Diyetisyen';

  -- D. RLS İZİNLERİNİ GARANTİLE
  -- ------------------------------------------------------------------------------
  -- Public şemasına erişim ver (Schema error düzeltmesi)
  GRANT USAGE ON SCHEMA public TO authenticated;
  GRANT USAGE ON SCHEMA extensions TO authenticated;
  GRANT ALL ON public.profiles TO authenticated;

END $$;

SELECT 'İŞLEM TAMAMLANDI. Giriş Yapabilirsiniz.' as status;
