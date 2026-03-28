-- =====================================================
-- FIX RLS POLICIES FOR PATIENT PORTAL
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Fix PATIENTS table - Allow patients to read their own record
DROP POLICY IF EXISTS "Patients can read own record" ON patients;
CREATE POLICY "Patients can read own record" ON patients
    FOR SELECT
    USING (
        id = auth.uid() 
        OR user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'dietitian', 'doctor')
        )
    );

-- 2. Fix PROFILES table - Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role IN ('admin', 'dietitian', 'doctor')
        )
    );

-- 3. Fix DIET_PLANS table - Allow patients to read their own plans
DROP POLICY IF EXISTS "Patients can read own diet plans" ON diet_plans;
CREATE POLICY "Patients can read own diet plans" ON diet_plans
    FOR SELECT
    USING (
        patient_id = auth.uid()
        OR patient_id IN (
            SELECT id FROM patients WHERE user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'dietitian', 'doctor')
        )
    );

-- 4. Fix DIET_WEEKS table
DROP POLICY IF EXISTS "Patients can read own diet weeks" ON diet_weeks;
CREATE POLICY "Patients can read own diet weeks" ON diet_weeks
    FOR SELECT
    USING (
        diet_plan_id IN (
            SELECT id FROM diet_plans 
            WHERE patient_id = auth.uid()
            OR patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'dietitian', 'doctor')
        )
    );

-- 5. Fix DIET_DAYS table
DROP POLICY IF EXISTS "Patients can read own diet days" ON diet_days;
CREATE POLICY "Patients can read own diet days" ON diet_days
    FOR SELECT
    USING (
        diet_week_id IN (
            SELECT dw.id FROM diet_weeks dw
            JOIN diet_plans dp ON dw.diet_plan_id = dp.id
            WHERE dp.patient_id = auth.uid()
            OR dp.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'dietitian', 'doctor')
        )
    );

-- 6. Fix DIET_MEALS table
DROP POLICY IF EXISTS "Patients can read own diet meals" ON diet_meals;
CREATE POLICY "Patients can read own diet meals" ON diet_meals
    FOR SELECT
    USING (
        diet_day_id IN (
            SELECT dd.id FROM diet_days dd
            JOIN diet_weeks dw ON dd.diet_week_id = dw.id
            JOIN diet_plans dp ON dw.diet_plan_id = dp.id
            WHERE dp.patient_id = auth.uid()
            OR dp.patient_id IN (SELECT id FROM patients WHERE user_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'dietitian', 'doctor')
        )
    );

-- 7. DIET_FOODS table doesn't exist in this schema, skipping

-- Verify: Check current user_id in HACER's patient record
SELECT id, full_name, user_id, email 
FROM patients 
WHERE id = '77dd6383-b2b7-4c2b-be8b-f5cf75acf3ae';

-- Also verify testhasta's ID
SELECT id, full_name, user_id, email 
FROM patients 
WHERE full_name ILIKE '%TEST%';
