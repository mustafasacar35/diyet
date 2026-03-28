-- ==============================================================================
-- RBAC SYSTEM & TEAM MANAGEMENT SCHEMA UPDATE (v25)
-- ==============================================================================

-- 1. Create Roles Enum and Profiles Table
-- ------------------------------------------------------------------------------
-- Simple text check constraint is more flexible than ENUM for now.
-- Roles: 'admin', 'doctor', 'dietitian', 'patient'

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'dietitian', 'patient')),
    full_name TEXT,
    avatar_url TEXT,
    title TEXT, -- e.g. "Baş Diyetisyen", "Uzman Dr."
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read of profiles for authenticated users (to see dietitians, doctors etc.)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Update Patients Table
-- ------------------------------------------------------------------------------
-- Link patients to auth users and add visibility settings
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS visibility_settings JSONB DEFAULT '{"allow_past": true, "max_future_weeks": 1}';

-- Add unique constraint to ensure one patient record per user (optional, but good practice)
-- ALTER TABLE patients ADD CONSTRAINT unique_patient_user UNIQUE (user_id);

-- 3. Team Management (Hierarchy)
-- ------------------------------------------------------------------------------
-- Defines who manages whom (Doctor -> Dietitian)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    supervisor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Doctor/Head
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,     -- Dietitian
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(supervisor_id, member_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Supervisors can manage their team
CREATE POLICY "Supervisors can manage their team" 
ON team_members FOR ALL TO authenticated 
USING (auth.uid() = supervisor_id);

-- Members can view their team status
CREATE POLICY "Members can view their team status" 
ON team_members FOR SELECT TO authenticated 
USING (auth.uid() = member_id OR auth.uid() = supervisor_id);


-- 4. Patient Assignments
-- ------------------------------------------------------------------------------
-- Defines which Dietitian manages which Patient
CREATE TABLE IF NOT EXISTS patient_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dietitian_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(dietitian_id, patient_id)
);

ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

-- Dietitians can manage their assignments
CREATE POLICY "Dietitians can manage assignments" 
ON patient_assignments FOR ALL TO authenticated 
USING (auth.uid() = dietitian_id);

-- Doctors can view assignments of their team members (advanced policy, simplified here for now)
CREATE POLICY "Doctors can view team assignments" 
ON patient_assignments FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM team_members 
        WHERE supervisor_id = auth.uid() 
        AND member_id = patient_assignments.dietitian_id
    )
    OR auth.uid() = dietitian_id
);


-- 5. Team Chat / Messaging
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Direct message
    team_id UUID, -- Optional: Could be a group id, or we just rely on sender/receiver for DM
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages sent to them or by them
CREATE POLICY "Users can read own messages" 
ON chat_messages FOR SELECT TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "Users can insert messages" 
ON chat_messages FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = sender_id);


-- 6. Helper Function: Create Profile on User Creation
-- ------------------------------------------------------------------------------
-- Trigger to automatically create a profile entry when a new user signs up
-- Note: Requires Supabase extensions. 

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'role', 'patient'), -- Default to patient if not specified
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 7. Backfill for Existing Users
-- ------------------------------------------------------------------------------
-- Ensure profiles exist for users created before this script was run
INSERT INTO public.profiles (id, role, full_name, avatar_url)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'role', 'patient'),
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

