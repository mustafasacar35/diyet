import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getURL } from '@/utils/url'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) => {
                                cookieStore.set(name, value, options)
                            })
                        } catch (error) {
                            // The `set` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Forward the user to the right place
            const forwardedUrl = new URL(request.url)
            const next = forwardedUrl.searchParams.get('next')

            // IMPORTANT: If a `next` param exists (e.g. from register page), prioritize it
            // This ensures Google OAuth users from register page go back to complete their profile
            if (next) {
                return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : `/${next}`}`)
            }

            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                if (profile?.role === 'patient') {
                    // Check if they have completed registration (exist in patients table AND filled out the form)
                    const { data: patient } = await supabase
                        .from('patients')
                        .select('id, gender')
                        .eq('id', user.id)
                        .maybeSingle()

                    // If NO patient record OR the patient record is just a skeleton from the DB trigger (missing gender)
                    if (!patient || !patient.gender) {
                        // User authenticated via Google, but hasn't filled out the form yet
                        return NextResponse.redirect(`${origin}/register?complete=true`)
                    }

                    return NextResponse.redirect(`${origin}/patient`)
                }
            }
            return NextResponse.redirect(`${origin}/`)
        }

        console.error("OAuth Callback Error:", error.message)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Handle explicit errors from Supabase OAuth
    const errorDesc = searchParams.get('error_description')
    const errorReason = searchParams.get('error')

    if (errorDesc || errorReason) {
        console.error("OAuth Callback Error Param:", errorDesc || errorReason)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc || errorReason || "Bilinmeyen Auth Hatası")}`)
    }

    // No code and no error
    console.warn("OAuth Callback warning: Missing code parameter.", searchParams.toString())
    return NextResponse.redirect(`${origin}/login?error=Oturum%20a%C3%A7ma%20iste%C4%9Fi%20ge%C3%A7ersiz%20(Code%20bulunamad%C4%B1)`)
}
