-- ==============================================================================
-- HASTA SYNC TRIGGER DÜZELTMESİ
-- Çift kayıt hatasını önler
-- ==============================================================================

-- Eski trigger'ı kaldır
DROP TRIGGER IF EXISTS on_profile_patient_sync ON public.profiles;

-- Güncellenmiş fonksiyon
CREATE OR REPLACE FUNCTION public.handle_profile_patient_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Sadece patient rolü için çalış
  IF NEW.role = 'patient' THEN
    -- Önce user_id ile eşleşen kayıt var mı kontrol et
    IF EXISTS (SELECT 1 FROM patients WHERE user_id = NEW.id) THEN
      -- Zaten bağlı bir hasta kaydı var, sadece bilgileri güncelle
      UPDATE patients 
      SET full_name = COALESCE(NEW.full_name, full_name)
      WHERE user_id = NEW.id;
    ELSIF EXISTS (SELECT 1 FROM patients WHERE id = NEW.id) THEN
      -- id ile eşleşen kayıt var ama user_id bağlı değil, user_id'yi güncelle
      UPDATE patients 
      SET user_id = NEW.id,
          full_name = COALESCE(NEW.full_name, full_name)
      WHERE id = NEW.id;
    ELSE
      -- Hiç eşleşen kayıt yok, yeni kayıt oluştur
      INSERT INTO patients (id, full_name, email, user_id, status, created_at)
      VALUES (
        NEW.id,
        COALESCE(NEW.full_name, 'Yeni Hasta'),
        (SELECT email FROM auth.users WHERE id = NEW.id),
        NEW.id,
        'pending',
        now()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı yeniden oluştur
CREATE TRIGGER on_profile_patient_sync
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_patient_sync();

SELECT 'Trigger güncellendi - Çift kayıt hatası artık olmayacak.' as status;
