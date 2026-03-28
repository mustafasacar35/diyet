-- Add specific AI limit columns for Photo and Search separation
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS ai_photo_limit_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_photo_limit_period_hours INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_search_limit_count INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_search_limit_period_hours INTEGER DEFAULT NULL;

-- Migrate existing combined limits to specific ones for backward compatibility
UPDATE public.patients
SET 
  ai_photo_limit_count = COALESCE(ai_photo_limit_count, ai_analysis_limit_count),
  ai_photo_limit_period_hours = COALESCE(ai_photo_limit_period_hours, ai_analysis_limit_period_hours),
  ai_search_limit_count = COALESCE(ai_search_limit_count, ai_analysis_limit_count),
  ai_search_limit_period_hours = COALESCE(ai_search_limit_period_hours, ai_analysis_limit_period_hours)
WHERE ai_analysis_limit_count IS NOT NULL;

COMMENT ON COLUMN public.patients.ai_photo_limit_count IS 'Görsel analiz (AI Foto) için kota sayısı';
COMMENT ON COLUMN public.patients.ai_search_limit_count IS 'Akıllı arama (AI Metin) için kota sayısı';
