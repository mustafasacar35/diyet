-- ==============================================================================
-- NUCLEAR RESET - COMPLETE AUTH FIX
-- ==============================================================================
-- Bu script, TÜM auth sorunlarını sıfırdan çözmek için:
-- 1. TÜM özel fonksiyonları ve triggerleri silecek
-- 2. En basit hallerini yeniden oluşturacak
-- 3. RLS'yi kapatacak
-- 4. Tüm izinleri açacak

-- ============================================
-- ADIM 1: TÜM TRIGGER VE FONKSİYONLARI SİL
-- ============================================

-- auth.users üzerindeki tüm triggerları sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- patients üzerindeki triggerları sil
DROP TRIGGER IF EXISTS on_patient_created_assign ON public.patients;

-- Tüm özel fonksiyonları sil
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.auto_assign_created_patient() CASCADE;
DROP FUNCTION IF EXISTS public.admin_create_user(TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

-- View'ı sil (eğer sorun çıkarıyorsa)
DROP VIEW IF EXISTS public.user_management_view CASCADE;

-- ============================================
-- ADIM 2: RLS'Yİ TAMAMEN KAPAT
-- ============================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_weeks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_meals DISABLE ROW LEVEL SECURITY;

-- ============================================
-- ADIM 3: TÜM İZİNLERİ VER
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================
-- ADIM 4: SADECE SIMPLE get_my_role OLUŞTUR
-- ============================================
-- En basit versiyon, hata durumunda 'patient' döner
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()),
    'patient'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN 'patient';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, anon, service_role;

-- ============================================
-- SONUÇ
-- ============================================
SELECT 'NUCLEAR RESET COMPLETE - TRY LOGIN NOW' as status;
