"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Trash2, UserPlus, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Participant } from "@/types/chat"
import { supabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface GroupDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    conversationId: string
    title: string
    participants: Participant[]
    currentUserId: string
    onAddMembers: (ids: string[]) => void
    onRemoveMember: (id: string) => void
    onDeleteGroup: () => void
}

export function GroupDetailsDialog({
    open,
    onOpenChange,
    conversationId,
    title,
    participants,
    currentUserId,
    onAddMembers,
    onRemoveMember,
    onDeleteGroup
}: GroupDetailsDialogProps) {
    const { profile } = useAuth()
    const [isAddMode, setIsAddMode] = useState(false)
    const [potentialUsers, setPotentialUsers] = useState<any[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())

    const isAdminOrDietitian = profile?.role === 'admin' || profile?.role === 'dietitian'
    // Also check if creator? (Participant logic doesn't explicitly store creator, but usually first one. 
    // We'll trust role for now or allow if simplistic)
    // Actually, SQL RLS might block if not allowed.

    useEffect(() => {
        if (isAddMode) {
            fetchPotentialUsers()
        }
    }, [isAddMode])

    async function fetchPotentialUsers() {
        setLoadingUsers(true)
        try {
            // Fetch users NOT in the group
            const existingIds = participants.map(p => p.user_id)

            // Re-use logic from NewChatDialog roughly
            // For simplicity: Admin sees all, Dietitian sees patients/dietitians
            let query = supabase.from('profiles').select('id, full_name, role')

            if (profile?.role === 'dietitian') {
                // Simplified: get all for now, filter in memory or better query
                // Actually let's just search by name if we had search
                // Fallback: Fetch top 50 
            }

            const { data } = await query.limit(50)

            if (data) {
                const filtered = data.filter((u: any) => !existingIds.includes(u.id))
                setPotentialUsers(filtered)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleAddSubmit = () => {
        onAddMembers(Array.from(selectedToAdd))
        setIsAddMode(false)
        setSelectedToAdd(new Set())
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>{title} Detayları</span>
                        {isAdminOrDietitian && !isAddMode && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (confirm('Grubu silmek istediğinize emin misiniz? Herkes için silinecektir.')) onDeleteGroup()
                                }}
                            >
                                <Trash2 size={14} className="mr-1" /> Grubu Sil
                            </Button>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Grup üyelerini ve ayarlarını yönetin.
                    </DialogDescription>
                </DialogHeader>

                {isAddMode ? (
                    <div className="py-2">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-sm">Katılımcı Ekle</h4>
                            <Button variant="ghost" size="sm" onClick={() => setIsAddMode(false)}>İptal</Button>
                        </div>

                        <ScrollArea className="h-[250px] border rounded p-2">
                            {loadingUsers ? <Loader2 className="animate-spin mx-auto" /> : (
                                <div className="space-y-1">
                                    {potentialUsers.map(u => (
                                        <div key={u.id}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedToAdd.has(u.id) ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                                            onClick={() => {
                                                const next = new Set(selectedToAdd)
                                                if (next.has(u.id)) next.delete(u.id)
                                                else next.add(u.id)
                                                setSelectedToAdd(next)
                                            }}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                                <User size={14} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{u.full_name}</div>
                                                <div className="text-xs text-gray-500">{u.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <Button className="w-full mt-2" onClick={handleAddSubmit} disabled={selectedToAdd.size === 0}>
                            Seçilenleri Ekle
                        </Button>
                    </div>
                ) : (
                    <div className="py-2 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-500">{participants.length} Üye</h4>
                            {isAdminOrDietitian && (
                                <Button size="sm" variant="outline" onClick={() => setIsAddMode(true)}>
                                    <UserPlus size={14} className="mr-1" /> Ekle
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="h-[250px] pr-2">
                            <div className="space-y-2">
                                {participants.map(p => (
                                    <div key={p.user_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {p.user?.avatar_url ? (
                                                    <img src={p.user.avatar_url} className="w-full h-full object-cover" />
                                                ) : <User size={16} className="text-gray-500" />}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{p.user?.full_name}</div>
                                                {p.user_id === currentUserId && <span className="text-[10px] bg-gray-100 px-1 rounded">Siz</span>}
                                            </div>
                                        </div>

                                        {isAdminOrDietitian && p.user_id !== currentUserId && (
                                            <button
                                                onClick={() => {
                                                    if (confirm('Kullanıcıyı gruptan çıkarmak istediğinize emin misiniz?')) onRemoveMember(p.user_id)
                                                }}
                                                className="text-gray-400 hover:text-red-500 p-1"
                                                title="Gruptan Çıkar"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
