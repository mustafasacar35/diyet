-- ==============================================================================
-- CREATE TEST USERS SCRIPT
-- ==============================================================================
-- This script creates a demo Dietitian user to test assignments and visibility.

-- 1. Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create Dietitian User (diyetisyen@demo.com / 123456)
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'diyetisyen@demo.com') THEN
    
    -- Insert into auth.users
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
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'diyetisyen@demo.com',
      crypt('123456', gen_salt('bf')), -- Password: 123456
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo Diyetisyen","role":"dietitian"}',
      now(),
      now()
    );

    -- Insert into profiles (if trigger didn't catch it or for safety)
    INSERT INTO public.profiles (id, role, full_name, title)
    VALUES (
      new_user_id,
      'dietitian',
      'Demo Diyetisyen',
      'Uzman Diyetisyen'
    )
    ON CONFLICT (id) DO UPDATE 
    SET role = 'dietitian';

    RAISE NOTICE 'Demo Dietitian Created: diyetisyen@demo.com / 123456';
  ELSE
    RAISE NOTICE 'User diyetisyen@demo.com already exists.';
  END IF;
END $$;
