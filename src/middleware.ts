import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with cross-site request forgery (CSRF) protection and session
    // refreshing.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Allow Public Routes Explicitly
    if (path === '/login' || path === '/register' || path === '/auth/callback' || path === '/auth/callback-client' || path.startsWith('/_next') || path.startsWith('/static') || path.includes('.')) {
        // If user is authenticated and trying to access /login, redirect to dashboard
        // BUT allow authenticated users to access /register for Google OAuth profile completion
        if (user && path === '/login') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
        return supabaseResponse
    }

    // Redirect Unauthenticated Users
    // Currently disabled based on previous logic but left ready
    /*
    if (!user && path !== '/login' && path !== '/register') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }
    */

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - manifest.json (PWA manifest)
         * - robots.txt (SEO)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|.*\\.png$|.*\\.svg$).*)',
    ],
}
