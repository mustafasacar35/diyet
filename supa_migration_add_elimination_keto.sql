-- Add elimination_diet column to foods table
ALTER TABLE foods 
ADD COLUMN elimination_diet BOOLEAN DEFAULT FALSE;

-- Update comment for clarity if needed
COMMENT ON COLUMN foods.elimination_diet IS 'Eliminasyonlu Ketojenik Diyet Uyumluluğu';
