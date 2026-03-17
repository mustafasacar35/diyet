-- ==============================================================================
-- NUCLEAR OPTION: FORCE CLEANUP
-- ==============================================================================
-- Bu script, auth.users tablosundaki bilinen ve bilinmeyen tüm triggerları 
-- (sistem triggerları hariç) temizlemeye çalışır.

-- 1. PROFILLERI VE FONKSİYONLARI DÜZELT
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. TRIGGER TEMİZLİĞİ (DÖNGÜ İLE)
-- ------------------------------------------------------------------------------
-- auth.users üzerindeki tüm triggerları bulup siliyoruz.
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        -- Supabase'in kendi sistem triggerlarına dokunmuyoruz (örn: 'pg_api_%' gibi)
        -- Ama bizim eklediğimiz 'on_auth_user_%' veya 'handle_%' gibi şeyleri siliyoruz.
        IF trg.trigger_name NOT LIKE 'pg_%' AND trg.trigger_name NOT LIKE 'supabase_%' THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users;', trg.trigger_name);
            RAISE NOTICE 'Deleted Trigger: %', trg.trigger_name;
        END IF;
    END LOOP;
END $$;

-- 3. public.profiles TİP DÖNÜŞÜMÜ (Olası Enum Hatası)
-- ------------------------------------------------------------------------------
-- Bazen role enum olarak kalırsa string ile çakışır. Bunu text'e zorluyoruz.
ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'doctor', 'dietitian', 'patient'));

-- 4. KULLANICIYI RESETLE (Şifreyi Garanti 123456 Yap)
-- ------------------------------------------------------------------------------
UPDATE auth.users 
SET encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'diyetisyen_final@demo.com';

SELECT 'NUCLEAR FIX APPLIED. TRY LOGIN NOW.' as status;
