import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as fs from 'fs/promises'
import * as path from 'path'

// Helper for file logging
async function logToDebugFile(message: string) {
    try {
        const logPath = path.join(process.cwd(), 'debug-auth.txt');
        const timestamp = new Date().toISOString();
        await fs.appendFile(logPath, `${timestamp} - ${message}\n`);
    } catch (e) {
        console.error("Log file error:", e);
    }
}

export async function POST(request: Request) {
    try {
        await logToDebugFile("----------------------------------------");
        await logToDebugFile("API CALLED: /api/admin/users/update");

        const cookieStore = await cookies()

        // Log Headers and Cookies
        const cookieHeader = request.headers.get('cookie');
        await logToDebugFile(`Cookie Header Length: ${cookieHeader?.length || 0}`);
        const authHeader = request.headers.get('Authorization');
        await logToDebugFile(`Auth Header Present: ${!!authHeader}`);

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        // Valid in Route Handlers
                    },
                },
            }
        )

        // 1. Authenticate Caller
        await logToDebugFile("Checking Auth...");
        let userAuth = null;
        let authErrorMsg = "";

        // Strategy A: Check Header (Bearer Token)
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            await logToDebugFile("Verifying Bearer Token...");
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (user) {
                userAuth = user;
                await logToDebugFile(`✅ Token valid! User: ${user.id}`);
            } else {
                await logToDebugFile(`❌ Token invalid: ${error?.message}`);
                authErrorMsg = error?.message || "Invalid Token";
            }
        }

        // Strategy B: Check Cookies (Fallback)
        if (!userAuth) {
            await logToDebugFile("Trying Cookie Session...");
            const { data: { user }, error } = await supabase.auth.getUser();
            if (user) {
                userAuth = user;
                await logToDebugFile(`✅ Cookie valid! User: ${user.id}`);
            } else {
                if (!authErrorMsg) authErrorMsg = error?.message || "No session found";
                await logToDebugFile(`❌ Cookie invalid: ${error?.message}`);
            }
        }

        if (!userAuth) {
            await logToDebugFile(`❌ API Auth Failed Final: ${authErrorMsg}`);
            return NextResponse.json({ error: 'Unauthorized', details: authErrorMsg }, { status: 401 })
        }

        // 2. Check Admin Role (from profiles table)
        await logToDebugFile("Checking Admin Role...");
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', userAuth.id)
            .single()

        if (profileError) {
            await logToDebugFile(`Profile Fetch Error: ${profileError.message}`);
        }

        await logToDebugFile(`Profile Role: ${profile?.role}`);

        if (profileError || profile?.role !== 'admin') {
            await logToDebugFile("❌ Forbidden: Admin access required");
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        // 3. Parse Request
        const body = await request.json()
        const { target_user_id, new_email, new_password, full_name, title, max_devices } = body

        if (!target_user_id) {
            return NextResponse.json({ error: 'Missing target_user_id' }, { status: 400 })
        }

        await logToDebugFile(`Target User ID: ${target_user_id}`);

        // 4. Update Auth User (Email/Password) via Admin API
        const authUpdates: any = {}
        if (new_email) authUpdates.email = new_email
        if (new_password) authUpdates.password = new_password
        if (Object.keys(authUpdates).length > 0) {

            if (new_email) authUpdates.email_confirm = true

            await logToDebugFile(`Updating Auth: ${Object.keys(authUpdates).join(', ')}`);

            // DIAGNOSTIC: Check if user exists first
            const { data: checkUser, error: checkError } = await supabaseAdmin.auth.admin.getUserById(target_user_id)
            if (checkError || !checkUser.user) {
                await logToDebugFile(`CRITICAL: Auth user check failed! ID: ${target_user_id}, Error: ${checkError?.message || 'User not found'}`);
                throw new Error("Kullanıcı sistemde bulunamadı (Auth kaydı yok). Lütfen kullanıcıyı silip yeniden oluşturun.")
            } else {
                await logToDebugFile(`Auth User Verified: ${checkUser.user.id} (${checkUser.user.email})`);
            }

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                target_user_id,
                authUpdates
            )

            if (updateError) {
                await logToDebugFile(`Auth Update Error: ${updateError.message}`);
                throw new Error("Kullanıcı kimlik bilgileri güncellenemedi: " + updateError.message)
            }
        }

        // 5. Update Profile Data (full_name, title, max_devices)
        const profileUpdates: any = {}
        if (full_name !== undefined) profileUpdates.full_name = full_name
        if (title !== undefined) profileUpdates.title = title
        if (max_devices !== undefined) profileUpdates.max_devices = max_devices

        if (Object.keys(profileUpdates).length > 0) {
            await logToDebugFile(`Updating Profile: ${Object.keys(profileUpdates).join(', ')}`);

            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update(profileUpdates)
                .eq('id', target_user_id)

            if (profileUpdateError) {
                await logToDebugFile(`Profile Update Error: ${profileUpdateError.message}`);
                throw new Error("Profil bilgileri güncellenemedi: " + profileUpdateError.message)
            }
        }

        await logToDebugFile("✅ Update Process Completed Successfully");
        return NextResponse.json({ success: true })

    } catch (error: any) {
        await logToDebugFile(`🔥 UNHANDLED ERROR: ${error.message}`);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
