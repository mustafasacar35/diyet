"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Plus, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface NewChatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onStartChat: (userIds: string[], isGroup: boolean, title?: string) => void
}

type UserOption = {
    id: string
    full_name: string
    role: string
}

export function NewChatDialog({ open, onOpenChange, onStartChat }: NewChatDialogProps) {
    const { user, profile } = useAuth()
    const [loading, setLoading] = useState(false)
    const [users, setUsers] = useState<UserOption[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (open && user) {
            fetchContacts()
            setSelectedIds(new Set())
        }
    }, [open, user])

    async function fetchContacts() {
        setLoading(true)
        try {
            // Logic depends on role
            let data: UserOption[] = []

            if (profile?.role === 'patient') {
                // Fetch assigned dietitians
                const { data: assignments } = await supabase
                    .from('patient_assignments')
                    .select('dietitian_id')
                    .eq('patient_id', user?.id)

                if (assignments && assignments.length > 0) {
                    const ids = assignments.map(a => a.dietitian_id)
                    const { data: dietitians } = await supabase
                        .from('profiles')
                        .select('id, full_name, role')
                        .in('id', ids)

                    if (dietitians) data = dietitians as any
                }
            } else if (profile?.role === 'dietitian') {
                // Dietitian: See other Dietitians + Assigned Patients

                // 1. Other Dietitians
                const { data: otherDietitians } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .eq('role', 'dietitian')
                    .neq('id', user?.id || '')

                // 2. Assigned Patients
                const { data: assignments } = await supabase
                    .from('patient_assignments')
                    .select('patient_id')
                    .eq('dietitian_id', user?.id)

                let assignedPatients: any[] = []
                if (assignments && assignments.length > 0) {
                    const pIds = assignments.map(a => a.patient_id)
                    const { data: patients } = await supabase
                        .from('profiles')
                        .select('id, full_name, role')
                        .in('id', pIds)
                    if (patients) assignedPatients = patients
                }

                data = [...(otherDietitians || []), ...assignedPatients] as any
            } else {
                // Admin: Fetch all users
                const { data: allProfiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, role')
                    .neq('id', user?.id || '')
                    .order('full_name') // Order by name
                    .limit(100)

                if (allProfiles) data = allProfiles as any
            }

            setUsers(data)
        } catch (error) {
            console.error("Error fetching contacts", error)
        } finally {
            setLoading(false)
        }
    }

    const [groupTitle, setGroupTitle] = useState("")

    const handleToggle = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const handleStart = () => {
        const ids = Array.from(selectedIds)
        const isGroup = ids.length > 1
        if (isGroup && !groupTitle.trim()) {
            alert("Lütfen bir grup adı giriniz.")
            return
        }
        onStartChat(ids, isGroup, groupTitle)
        onOpenChange(false)
        setGroupTitle("")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Sohbet Başlat</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {selectedIds.size > 1 && (
                        <div className="px-1">
                            <label className="text-sm font-medium mb-1 block">Grup Adı</label>
                            <input
                                type="text"
                                value={groupTitle}
                                onChange={(e) => setGroupTitle(e.target.value)}
                                placeholder="Grup için bir isim girin..."
                                className="w-full border rounded-md px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                            Kişi bulunamadı.
                        </div>
                    ) : (
                        <ScrollArea className="h-[300px] border rounded-md p-2">
                            <div className="space-y-2">
                                {users.map(u => (
                                    <div
                                        key={u.id}
                                        className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-gray-50 ${selectedIds.has(u.id) ? 'bg-green-50' : ''}`}
                                        onClick={() => handleToggle(u.id)}
                                    >
                                        <Checkbox
                                            checked={selectedIds.has(u.id)}
                                            onCheckedChange={() => handleToggle(u.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{u.full_name}</div>
                                            <div className="text-xs text-gray-400 capitalize">{u.role}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center">
                    <div className="text-xs text-gray-500">
                        {selectedIds.size} kişi seçildi
                    </div>
                    <Button onClick={handleStart} disabled={selectedIds.size === 0}>
                        {selectedIds.size > 1 ? 'Grup Oluştur' : 'Sohbet Başlat'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
