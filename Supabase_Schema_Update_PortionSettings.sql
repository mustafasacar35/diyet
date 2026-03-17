-- planner_settings tablosuna portion_settings sütunu ekle (JSONB)
ALTER TABLE planner_settings 
ADD COLUMN IF NOT EXISTS portion_settings JSONB DEFAULT '{"global_min": 0.5, "global_max": 2.0, "step_value": 0.5, "max_adjusted_items_per_day": 5, "scalable_units": [], "strategies": {"macro_convergence": false, "max_limit_protection": true}}';

-- Mevcut satırları varsayılan değerle güncelle (eğer null ise)
UPDATE planner_settings 
SET portion_settings = '{"global_min": 0.5, "global_max": 2.0, "step_value": 0.5, "max_adjusted_items_per_day": 5, "scalable_units": [], "strategies": {"macro_convergence": false, "max_limit_protection": true}}'
WHERE portion_settings IS NULL;
