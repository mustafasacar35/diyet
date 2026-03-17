-- ==============================================================================
-- CLEAR ALL DEVICE SESSIONS FOR A USER
-- ==============================================================================
-- Run this in Supabase SQL Editor to reset device count
-- This will allow the user to login again

-- Option 1: Clear ALL device sessions for a specific user by email
-- Replace 'hacer3@demo.com' with the actual email
DELETE FROM public.user_devices 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'hacer3@demo.com'
);

-- Option 2: Clear ALL device sessions for ALL users (use with caution!)
-- TRUNCATE public.user_devices;

-- Verification: Check remaining devices
SELECT 
    u.email,
    COUNT(d.id) as device_count,
    p.max_devices
FROM auth.users u
LEFT JOIN public.user_devices d ON u.id = d.user_id
LEFT JOIN public.profiles p ON u.id = p.id
GROUP BY u.email, p.max_devices
ORDER BY device_count DESC;

SELECT 'Device sessions cleared! User can now login.' as status;
