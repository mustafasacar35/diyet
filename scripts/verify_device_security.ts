
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = 'https://edcxbjneplsktmlrkvix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkY3hiam5lcGxza3RtbHJrdml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDYzNjgsImV4cCI6MjA4NDIyMjM2OH0.-ZghlLIjfODUpMYG_suT_hXv2owcezNU4NcORxEsvaw';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkY3hiam5lcGxza3RtbHJrdml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY0NjM2OCwiZXhwIjoyMDg0MjIyMzY4fQ.RR0F7CVoZdqSrc5He4qJDayBFaLYVjevk6f3K7SPFGc';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
    console.log('Starting Device Security Verification...');

    const email = `device_test_${Date.now()}@example.com`;
    const password = 'password123';
    const deviceId1 = randomUUID();
    const deviceId2 = randomUUID();

    try {
        // 1. Create User
        console.log(`1. Creating Test User: ${email}`);
        const { data: userLink, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            throw new Error(`Create user failed: ${createError.message}`);
        }

        if (!userLink.user) throw new Error('User creation returned no user object');
        const userId = userLink.user.id;
        console.log(`   User created. ID: ${userId}`);

        // WORKAROUND: Manually create profile because database trigger seems broken/missing
        console.log('   (Workaround) Manually creating profile to ensure functionality...');
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: userId,
            role: 'patient',
            full_name: 'Test User',
            max_devices: 1 // Enforcing limit 1 for test
        });
        if (profileError) {
            // Ignore duplicate key error if trigger worked partially
            if (!profileError.message.includes('duplicate key')) {
                console.warn('   Profile creation warning:', profileError.message);
            }
        }

        // 2. Login (Get Session)
        console.log('2. Logging In...');
        const { data: sessionData, error: loginError } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            throw new Error(`Login failed: ${loginError.message}`);
        }

        // We need a client with the user's implementation
        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${sessionData.session?.access_token}`
                }
            }
        });

        // 3. Register Device 1
        console.log(`3. Registering Device 1 (${deviceId1})...`);
        const { data: reg1, error: rpcError1 } = await userClient.rpc('register_device', {
            _device_id: deviceId1,
            _device_name: 'Test Device 1'
        });

        if (rpcError1) {
            console.error('   Device 1 Registration FAILED:', rpcError1);
        } else {
            console.log('   Device 1 Registered: Success');
        }

        // 4. Register Device 2
        console.log(`4. Registering Device 2 (${deviceId2})...`);
        const { data: reg2, error: rpcError2 } = await userClient.rpc('register_device', {
            _device_id: deviceId2,
            _device_name: 'Test Device 2'
        });

        if (rpcError2) {
            console.log(`   Device 2 Registration Failed (AS EXPECTED): ${rpcError2.message}`);
            // Only consider it passed if message says "limit reached"
            if (rpcError2.message.includes('limit reached')) {
                console.log("   ✅ TEST PASS: Limit enforced.");
            } else {
                console.log("   ⚠️ TEST WARNING: Failed but unexpected message.");
            }
        } else {
            console.log('   Device 2 Registered: SUCCESS (FAIL for Limit=1)');
            console.log('   ❌ TEST FAIL: User was able to register 2nd device.');

            // Check Limit
            const { data: profile } = await supabaseAdmin.from('profiles').select('max_devices').eq('id', userId).single();
            console.log(`   Debug: Current DB Limit for user is: ${profile?.max_devices}`);
        }

        // Cleanup
        console.log('5. Cleanup: Deleting user...');
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log('   User deleted.');

    } catch (err: any) {
        console.error('Test Exception:', err.message);
    }
}

runTest();
