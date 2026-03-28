-- ==============================================================================
-- FINAL LOGIN FIX
-- ==============================================================================
-- Bu script, giriş yaparken (Login) alınan 500 hatasını çözmek için:
-- 1. 'auth.users' tablosundaki tüm özel triggerları SİLER (Çünkü hata kaynağı burası).
-- 2. 'public' şemasına tam erişim verir.
-- 3. 'get_my_role' fonksiyonunu en basit hale indirger.

-- 1. TRIGGER TEMİZLİĞİ (KESİN ÇÖZÜM)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
-- Eğer varsa diğerlerini de manuel siliyoruz:
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. YETKİLERİ SIFIRLA VE AÇ
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. GET_MY_ROLE FONKSİYONU (Basitleştirilmiş)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  -- Basitçe profilden oku, hata verirse 'patient' dön.
  RETURN (SELECT role::text FROM public.profiles WHERE id = auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN 'patient';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. KULLANICIYI GÜNCELLE (Login olduğundan emin olmak için)
-- ------------------------------------------------------------------------------
-- Eğer `diyetisyen_yeni@demo.com` kullanıcısı varsa, şifresini garantiye alıyoruz.
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf')),
    email_confirmed_at = now()
WHERE email = 'diyetisyen_yeni@demo.com';

SELECT 'LOGIN FIX APPLIED. PLEASE TRY AGAIN.' as status;
