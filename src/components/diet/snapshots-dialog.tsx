
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, RotateCcw, CalendarClock, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface SnapshotsDialogProps {
    weekId: string | null
    onRestore: () => void // Callback to refresh parent
}

export function SnapshotsDialog({ weekId, onRestore }: SnapshotsDialogProps) {
    const [open, setOpen] = useState(false)
    const [snapshots, setSnapshots] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    useEffect(() => {
        if (open && weekId) {
            fetchSnapshots()
        }
    }, [open, weekId])

    async function fetchSnapshots() {
        setLoading(true)
        const { data } = await supabase
            .from('diet_snapshots')
            .select('*')
            .eq('diet_week_id', weekId)
            .order('created_at', { ascending: false })

        if (data) setSnapshots(data)
        setLoading(false)
    }

    async function handleRestore(snapshot: any) {
        if (!confirm("Bu yedeği geri yüklemek istediğinize emin misiniz? Mevcut haftanın verileri silinecektir.")) return

        setRestoringId(snapshot.id)
        try {
            // Restore Logic
            const backupData = snapshot.snapshot_data // Array of diet_days objects with nested diet_meals

            if (!backupData || !Array.isArray(backupData)) {
                throw new Error("Geçersiz yedek verisi")
            }

            // 1. Delete current meals for this week
            // optimized: get all day IDs first
            const { data: currentDays } = await supabase
                .from('diet_days')
                .select('id')
                .eq('diet_week_id', weekId)

            if (currentDays && currentDays.length > 0) {
                const dayIds = currentDays.map(d => d.id)
                await supabase.from('diet_meals').delete().in('diet_day_id', dayIds)
            }

            // 2. Restore Notes and Insert Meals
            // Since diet_days IDs might remain constant or change? 
            // In the backup logic, we grabbed the full rows. 
            // However, the day IDs currently in the DB might match the backup IDs if we didn't delete days.
            // But if we deleted days (e.g. bulk import full replace), IDs change.
            // STRATEGY: 
            // - We generally assume diet_days structure (Mon-Sun) is stable for a week ID.
            // - We should match by `day_number` to be safe, rather than relying on UUIDs if they were recreated.

            // Re-fetch current days to get *current* UUIDs
            const { data: freshDays } = await supabase
                .from('diet_days')
                .select('id, day_number')
                .eq('diet_week_id', weekId)
                .order('day_number')

            if (!freshDays) throw new Error("Günler bulunamadı")

            const mealsToInsert: any[] = []

            for (const dayBackup of backupData) {
                // Find matching current day by number
                const targetDay = freshDays.find(fd => fd.day_number === dayBackup.day_number)
                if (!targetDay) continue

                // Restore Note
                if (dayBackup.notes) {
                    await supabase.from('diet_days').update({ notes: dayBackup.notes }).eq('id', targetDay.id)
                }

                // Prepare Meals
                if (dayBackup.diet_meals && Array.isArray(dayBackup.diet_meals)) {
                    for (const meal of dayBackup.diet_meals) {
                        // Omit ID and diet_day_id from backup, use new targetDay.id
                        // We must sanitize the object to remove old IDs
                        const { id, diet_day_id, created_at, ...mealData } = meal

                        mealsToInsert.push({
                            ...mealData,
                            diet_day_id: targetDay.id
                        })
                    }
                }
            }

            if (mealsToInsert.length > 0) {
                const { error } = await supabase.from('diet_meals').insert(mealsToInsert)
                if (error) throw error
            }

            alert("Yedek başarıyla geri yüklendi.")
            setOpen(false)
            onRestore()

        } catch (err: any) {
            console.error(err)
            alert("Geri yükleme hatası: " + err.message)
        } finally {
            setRestoringId(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Bu yedeği silmek istediğinize emin misiniz?")) return
        await supabase.from('diet_snapshots').delete().eq('id', id)
        fetchSnapshots()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1" disabled={!weekId}>
                    <History className="h-3 w-3" />
                    <span className="hidden sm:inline">Yedekler</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Versiyon Geçmişi</DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>
                    ) : snapshots.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p>Hiç kayıtlı yedek bulunamadı.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {snapshots.map((snap) => (
                                <div key={snap.id} className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-slate-50 relative group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                                                <CalendarClock className="h-3 w-3 mr-1" />
                                                {format(new Date(snap.created_at), 'd MMM HH:mm', { locale: tr })}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="h-7 text-xs"
                                                onClick={() => handleRestore(snap)}
                                                disabled={restoringId === snap.id}
                                            >
                                                {restoringId === snap.id ? <RotateCcw className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                                                Geri Yükle
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-7 w-7 text-muted-foreground hover:text-red-600"
                                                onClick={() => handleDelete(snap.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium">{snap.description || "Otomatik Yedek"}</p>
                                    <div className="text-xs text-muted-foreground">
                                        {snap.snapshot_data?.length || 0} gün • {snap.snapshot_data?.reduce((acc: number, d: any) => acc + (d.diet_meals?.length || 0), 0)} öğün
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
