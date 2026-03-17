-- ==============================================================================
-- AUTO CREATE PROFILE FOR SUPABASE USER
-- ==============================================================================
-- Bu script, e-posta adresinden kullanıcı ID'sini otomatik bulup profil oluşturur.

DO $$
DECLARE
  target_email TEXT := 'diyetisyen_supabase@demo.com';
  user_id UUID;
BEGIN
  -- Kullanıcı ID'sini e-postadan bul
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %', target_email;
  END IF;
  
  -- Profil oluştur
  INSERT INTO public.profiles (id, role, full_name, title)
  VALUES (user_id, 'dietitian', 'Supabase Diyetisyen', 'Test Kullanıcısı')
  ON CONFLICT (id) DO UPDATE 
  SET role = 'dietitian', full_name = 'Supabase Diyetisyen';
  
  RAISE NOTICE 'Profil oluşturuldu: % (ID: %)', target_email, user_id;
END $$;

SELECT 'Profil başarıyla oluşturuldu!' as status;
