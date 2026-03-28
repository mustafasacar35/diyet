-- ==============================================================================
-- DEBUG DIAGNOSTIC & RLS DISABLE
-- ==============================================================================
-- Bu script:
-- 1. auth.users tablosundaki tüm tetikleyicileri listeler (Sizden sonucunu isteyeceğim).
-- 2. profiles tablosundaki RLS'yi geçici olarak KAPATIR (Acaba sorun RLS mi?).

-- 1. MEVCUT TRIGGERLARI GÖRMEK İÇİN
SELECT event_object_schema as schema_name,
       event_object_table as table_name,
       trigger_name,
       action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 2. RLS'Yİ TAMAMEN KAPAT (TEST İÇİN)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assignments DISABLE ROW LEVEL SECURITY;

-- 3. YAZMA İZİNLERİNİ KESİNLEŞTİR
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'RLS Disabled & Diagnostic Run' as status;
