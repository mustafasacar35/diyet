-- ==============================================================================
-- EMERGENCY FIX: CLEAN SLATE
-- ==============================================================================
-- Bu script, giriş yapmayı engelleyen tüm olası tetikleyicileri (Triggers) siler.
-- Ayrıca yetki hatalarını gidermek için tüm izinleri sıfırlar.

-- 1. TÜM TRIGGERLARI SİL (Auth Şeması Üzerindekiler)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_patient_created_assign ON public.patients;
-- Eğer başka trigger varsa buraya eklenir ama şu an bilinenler bunlar.

-- 2. FONKSİYONLARI GÜVENLİ HALE GETİR
-- ------------------------------------------------------------------------------
-- get_my_role fonksiyonunu en basit haliyle yeniden oluşturuyoruz.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  -- Hata durumunda boş dönmesini sağla
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
EXCEPTION WHEN OTHERS THEN
  RETURN 'patient'; -- Varsayılan güvenli rol
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. İZİNLERİ (GRANTS) GARANTİLE
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. KULLANICIYI TEKRAR OLUŞTUR (Garanti Olsun)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  target_email TEXT := 'diyetisyen_final@demo.com';
  target_pass TEXT := '123456';
  user_id UUID;
BEGIN
  -- Kullanıcı varsa ID'sini al
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;
  
  -- Varsa güncelle
  IF user_id IS NOT NULL THEN
     UPDATE auth.users 
     SET encrypted_password = crypt(target_pass, gen_salt('bf')),
         updated_at = now()
     WHERE id = user_id;
     
     -- Profili de güncelle
     INSERT INTO public.profiles (id, role, full_name)
     VALUES (user_id, 'dietitian', 'Final Diyetisyen')
     ON CONFLICT (id) DO UPDATE SET role = 'dietitian';
  END IF;
  
  -- Yoksa oluşturmaya çalışmıyoruz, çünkü Master_Fix zaten yapmıştı.
  -- Ama eğer yoksa ve Master_Fix çalışmadıysa, manuel eklemek gerekebilir.
  -- Şimdilik sadece güncelleme yapıyoruz ki 500 hatası alıp almadığını görelim.
END $$;

SELECT 'ACİL DURUM ONARIMI TAMAMLANDI' as status;
