-- ==============================================================================
-- RE-ENABLE RLS FOR DIETITIAN VISIBILITY
-- ==============================================================================
-- Bu script, diyetisyenin sadece kendisine atanan hastaları görmesini sağlar.

-- 1. ESKİ POLİCYLERİ TEMİZLE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and Doctors manage all patients" ON patients;
DROP POLICY IF EXISTS "Dietitians manage assigned patients" ON patients;
DROP POLICY IF EXISTS "Patients view own profile" ON patients;
DROP POLICY IF EXISTS "Enable all for public" ON patients;
DROP POLICY IF EXISTS "Enable all for authenticated" ON patients;

-- 2. RLS'Yİ AKTİF ET
-- ------------------------------------------------------------------------------
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 3. YENİ POLİCYLER OLUŞTUR
-- ------------------------------------------------------------------------------

-- Admin ve Doktorlar: Herkesi görebilir
CREATE POLICY "Admins and Doctors see all patients"
ON patients FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'doctor')
);

-- Admin ve Doktorlar: Her işlemi yapabilir
CREATE POLICY "Admins and Doctors manage all patients"
ON patients FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'doctor')
);

-- Diyetisyenler: Sadece atanan hastaları görebilir
CREATE POLICY "Dietitians see assigned patients"
ON patients FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dietitian'
  AND EXISTS (
    SELECT 1 FROM patient_assignments 
    WHERE patient_assignments.patient_id = patients.id 
    AND patient_assignments.dietitian_id = auth.uid()
  )
);

-- Diyetisyenler: Atanan hastaları yönetebilir
CREATE POLICY "Dietitians manage assigned patients"
ON patients FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'dietitian'
  AND EXISTS (
    SELECT 1 FROM patient_assignments 
    WHERE patient_assignments.patient_id = patients.id 
    AND patient_assignments.dietitian_id = auth.uid()
  )
);

-- 4. PATIENT_ASSIGNMENTS İÇİN DE RLS AKTİF ET
-- ------------------------------------------------------------------------------
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all assignments" ON patient_assignments;
DROP POLICY IF EXISTS "Dietitians can manage assignments" ON patient_assignments;
DROP POLICY IF EXISTS "Doctors can view team assignments" ON patient_assignments;

-- Admin/Doktor tüm atamaları yönetebilir
CREATE POLICY "Admins manage all assignments"
ON patient_assignments FOR ALL TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'doctor')
);

-- Diyetisyen kendi atamalarını görebilir
CREATE POLICY "Dietitians see own assignments"
ON patient_assignments FOR SELECT TO authenticated
USING (
  dietitian_id = auth.uid()
);

SELECT 'RLS RE-ENABLED. Dietitians now see only assigned patients.' as status;
