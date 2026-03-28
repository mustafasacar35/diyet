-- ==============================================================================
-- RELOAD SCHEMA CACHE
-- ==============================================================================
-- Supabase (PostgREST) API'sinin veritabanındaki yeni sütunları (özellikle View 
-- güncellemelerini) anında görebilmesi için şema önbelleğini (schema cache)
-- yenilemesi gerekir.
--
-- Eğer user_management_view güncellenmiş ancak uygulamada valid_until
-- verisi hala çekilemiyorsa, bu komutu çalıştırarak önbelleği temizleyin.

NOTIFY pgrst, 'reload schema';

SELECT 'Schema cache reloaded successfully.' as status;
