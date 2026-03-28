-- ==============================================================================
-- DISABLE AUTO-PROFILE TRIGGER
-- ==============================================================================
-- If the trigger is causing 'Database error' or hangs during registration,
-- we disable it to allow the basic Auth user creation to succeed.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

SELECT 'Trigger Disabled. Try registering now.' as status;
