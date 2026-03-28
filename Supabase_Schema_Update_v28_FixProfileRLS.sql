-- ==============================================================================
-- FIX PROFILE RLS & HELPER FUNCTION (v28)
-- ==============================================================================
-- This script reinforces the policies for profiles and safer function execution.

-- 1. Update get_my_role to be safer with search_path
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Drop and Re-create Profiles Read Policy to be 100% sure
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;

CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- 3. Ensure Update Policy is correct
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Grant explicit usage (just in case)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Confirmation
SELECT 'Policies Updated' as status;
