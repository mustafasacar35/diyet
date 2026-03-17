"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RefreshCw, Calendar, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ArchivedPlansDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    onPlanRestored: () => void
}

export function ArchivedPlansDialog({ open, onOpenChange, patientId, onPlanRestored }: ArchivedPlansDialogProps) {
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)

    useEffect(() => {
        if (open && patientId) {
            fetchArchivedPlans()
        }
    }, [open, patientId])

    async function fetchArchivedPlans() {
        setLoading(true)
        const { data, error } = await supabase
            .from('diet_plans')
            .select(`
                *,
                diet_weeks (count)
            `)
            .eq('patient_id', patientId)
            .eq('status', 'archived')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("Error fetching archived plans:", error)
        } else {
            // Sort manually if needed or rely on DB order
            setPlans(data || [])
        }
        setLoading(false)
    }

    async function handleRestore(planId: string) {
        if (!confirm("Bu planı geri yüklemek istediğinize emin misiniz? Mevcut aktif plan arşivlenecektir.")) {
            return
        }

        setRestoringId(planId)
        try {
            // 1. Find Current Active Plan
            const { data: currentActive } = await supabase
                .from('diet_plans')
                .select('id')
                .eq('patient_id', patientId)
                .eq('status', 'active')
                .single()

            // 2. Archive Current Active (if exists)
            if (currentActive) {
                const { error: archiveError } = await supabase
                    .from('diet_plans')
                    .update({ status: 'archived' })
                    .eq('id', currentActive.id)

                if (archiveError) throw archiveError
            }

            // 3. Activate Target Plan
            const { error: restoreError } = await supabase
                .from('diet_plans')
                .update({ status: 'active' })
                .eq('id', planId)

            if (restoreError) throw restoreError

            onOpenChange(false)
            onPlanRestored() // Trigger refresh in parent

        } catch (error: any) {
            alert("Plan geri yüklenirken hata oluştu: " + error.message)
        } finally {
            setRestoringId(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArchiveIcon className="h-5 w-5 text-gray-500" />
                        Arşivlenmiş Planlar
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
                    ) : plans.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                            Arşivlenmiş plan bulunamadı.
                        </div>
                    ) : (
                        plans.map((plan) => (
                            <div key={plan.id} className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                            {plan.name || "İsimsiz Plan"}
                                            {plan.is_template && <Badge variant="secondary" className="text-[10px]">Şablon</Badge>}
                                        </h4>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(plan.created_at).toLocaleDateString('tr-TR')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FileText className="h-3 w-3" />
                                                {plan.diet_weeks?.[0]?.count || 0} Hafta
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                        onClick={() => handleRestore(plan.id)}
                                        disabled={restoringId !== null}
                                    >
                                        {restoringId === plan.id ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Geri Yükle
                                    </Button>
                                </div>
                                {plan.description && (
                                    <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                        {plan.description}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ArchiveIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="5" x="2" y="3" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
        </svg>
    )
}
