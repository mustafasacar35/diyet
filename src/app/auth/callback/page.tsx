"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
    const router = useRouter()
    const [authError, setAuthError] = useState<string | null>(null)
    const { user, profile, loading } = useAuth()

    useEffect(() => {
        // Read error parameter if present
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const errorParam = params.get('error')
            const errorDesc = params.get('error_description')
            
            if (errorParam) {
                setAuthError(errorDesc || errorParam)
            }
        }
    }, [])

    useEffect(() => {
        if (authError) {
            router.replace(`/login?error=${encodeURIComponent(authError)}`)
            return
        }

        if (!loading) {
            if (user && profile) {
                // If logged in, redirect based on role
                if (profile.role === 'patient') {
                    // Registration completeness is verified separately by patient/layout.tsx
                    router.replace('/patient')
                } else {
                    router.replace('/')
                }
            } else if (!user) {
                // No user found, maybe code exchange failed or hasn't started
                // We'll give it a tiny timeout to avoid immediately failing if supabase-js hasn't fired yet
                const tm = setTimeout(() => {
                    if (!user) {
                        router.replace('/login?error=Oturum%20a%C3%A7%C4%B1lamad%C4%B1')
                    }
                }, 3000);
                return () => clearTimeout(tm)
            }
        }
    }, [user, profile, loading, authError, router])

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 px-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">Giriş Yapılıyor</h2>
            <p className="text-sm text-gray-500 text-center">Hesabınız doğrulanıyor, lütfen bekleyin...</p>
        </div>
    )
}
