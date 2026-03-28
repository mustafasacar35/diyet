"use client"

import { useEffect } from 'react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import AppStartupLoader from "@/components/ui/app-startup-loader"

export default function Home() {
  const { profile, loading, user } = useAuth()
  const router = useRouter()
  const startupName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/login')
      return
    }

    if (profile?.role === 'patient') {
      router.replace('/patient')
    } else {
      // Admin, Doctor, Dietitian -> Admin Dashboard
      router.replace('/admin')
    }
  }, [user, profile, loading, router])

  return (
    <AppStartupLoader
      displayName={startupName}
      title="Panel aciliyor"
      subtitle="Hesabiniz yonlendiriliyor..."
    />
  )
}
