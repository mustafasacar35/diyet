-- ==============================================================================
-- CREATE TEST DIETITIAN (FIXED VERSION)
-- ==============================================================================

-- 1. Enable crypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Clean up previous attempts (if any) to ensure fresh start
-- Note: We can't easily delete from auth.users via SQL in some Supabase setups due to FKs, 
-- but we can try to find the ID and clean up profiles first.
DO $$
DECLARE
  test_email TEXT := 'diyetisyen_test@demo.com';
  existing_id UUID;
BEGIN
  SELECT id INTO existing_id FROM auth.users WHERE email = test_email;
  
  IF existing_id IS NOT NULL THEN
    -- Delete detailed profile first
    DELETE FROM public.profiles WHERE id = existing_id;
    DELETE FROM public.patient_assignments WHERE dietitian_id = existing_id;
    -- Try to delete auth user (might fail if foreign keys invoke restricted deletions)
    DELETE FROM auth.users WHERE id = existing_id;
    RAISE NOTICE 'Cleaned up old test user';
  END IF;
END $$;

-- 3. Create New User
DO $$
DECLARE
  new_id UUID := gen_random_uuid();
  test_email TEXT := 'diyetisyen_test@demo.com';
  test_pass TEXT := '123456';
BEGIN
  -- Insert into auth.users with confirmed email
  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    test_email,
    crypt(test_pass, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', 'Test Diyetisyen', 'role', 'dietitian'),
    now(),
    now()
  );

  -- Insert into profiles manually to be safe
  INSERT INTO public.profiles (id, role, full_name, title)
  VALUES (
    new_id,
    'dietitian',
    'Test Diyetisyen',
    'Demostrasyon Uzmanı'
  )
  ON CONFLICT (id) DO UPDATE 
  SET role = 'dietitian';

  RAISE NOTICE 'SUCCESS: Created user % with pass %', test_email, test_pass;
END $$;
