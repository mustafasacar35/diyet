-- ==============================================================================
-- REMOVE ALL AUTH TRIGGERS (AGGRESSIVE KILL)
-- ==============================================================================
-- Bu script, 'auth.users' tablosuna yapışan TÜM tetikleyicileri bulur ve siler.
-- Dikkat: Bu işlem auth sistemini rahatlatır, "Database Error" sebebini ortadan kaldırır.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
    LOOP
        -- Supabase'in kendi iç tetikleyicilerine (pg_*, supabase_*) dokunma.
        -- Ama geriye kalan her şeyi yok et.
        IF r.trigger_name NOT LIKE 'pg_%' AND r.trigger_name NOT LIKE 'supabase_%' THEN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users;';
            RAISE NOTICE 'Deleted Trigger: %', r.trigger_name;
        END IF;
    END LOOP;
END $$;

-- 2. ENUM HATASINI ÖNLEMEK İÇİN PROFIL KOLONUNU TEXT YAP
-- ------------------------------------------------------------------------------
-- Eğer "role" kolonu enum tipindeyse, insert sırasında hata veriyor olabilir.
-- Bunu güvenli "TEXT" tipine çeviriyoruz.
DO $$
BEGIN
    ALTER TABLE public.profiles ALTER COLUMN role TYPE text;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    -- Tekrar kısıtlama ekle
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'doctor', 'dietitian', 'patient'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Role column update skipped or failed';
END $$;

SELECT 'TUM OZEL TRIGGERLAR SILINDI. TEKRAR GIRIS YAPIN.' as status;
