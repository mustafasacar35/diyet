"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function UnreadListener({
    userId,
    onUpdate
}: {
    userId: string,
    onUpdate: (count: number) => void
}) {
    useEffect(() => {
        if (!userId) return

        let mounted = true
        console.log("🔔 UnreadListener: Starting for", userId)

        const fetchUnread = async () => {
            try {
                const { data, error } = await supabase.rpc('get_total_unread_count', { _user_id: userId })
                if (!mounted) return
                if (error) {
                    console.error("🔔 UnreadListener error:", error)
                    return
                }
                onUpdate(Number(data || 0))
            } catch (err) {
                console.error("🔔 UnreadListener exception:", err)
            }
        }

        fetchUnread()

        const channel = supabase
            .channel(`global_unread:${userId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                if (payload.new.sender_id !== userId) {
                    fetchUnread()
                }
            })
            .subscribe()

        return () => {
            mounted = false
            supabase.removeChannel(channel)
        }
    }, [userId])

    return null // Headless component
}
