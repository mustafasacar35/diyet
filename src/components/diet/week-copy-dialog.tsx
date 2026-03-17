
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekCopyDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourceWeek: any
    sourcePatientName: string
    onSuccess: () => void
}

export function WeekCopyDialog({ open, onOpenChange, sourceWeek, sourcePatientName, onSuccess }: WeekCopyDialogProps) {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")
    const [patients, setPatients] = useState<any[]>([])
    const [targetPatientId, setTargetPatientId] = useState<string>("")
    const [targetWeekNumber, setTargetWeekNumber] = useState<number>(sourceWeek?.week_number ? sourceWeek.week_number + 1 : 1)
    const [comboOpen, setComboOpen] = useState(false)

    useEffect(() => {
        if (open) {
            fetchAllPatients()
            if (sourceWeek) {
                setTargetWeekNumber(sourceWeek.week_number)
            }
        }
    }, [open, sourceWeek])

    async function fetchAllPatients() {
        const { data } = await supabase
            .from('patients')
            .select('id, full_name')
            .order('full_name')

        if (data) setPatients(data)
    }

    async function handleCopy() {
        if (!targetPatientId || !targetWeekNumber) {
            alert("Lütfen hedef hasta ve hafta numarası seçiniz.")
            return
        }

        setLoading(true)
        setStatus("Hedef plan aranıyor...")

        try {
            // 1. Get Target Active Plan
            const { data: targetPlans, error: planError } = await supabase
                .from('diet_plans')
                .select('id')
                .eq('patient_id', targetPatientId)
                .eq('status', 'active')
                .limit(1)

            if (planError) throw planError

            let targetPlanId = targetPlans?.[0]?.id

            if (!targetPlanId) {
                // No active plan? Maybe create one? 
                // For safety, let's require an active plan or ask user.
                // Assuming we should create one if missing is huge assumption.
                // Let's alert.
                alert("Hedef hastanın aktif bir diyet planı bulunamadı. Lütfen önce hedef hasta için bir plan oluşturun.")
                setLoading(false)
                return
            }

            // 1.5 FETCH SOURCE DATA FIRST (Safety for self-copy)
            setStatus("Kaynak veri okunuyor...")
            const { data: sourceDays, error: fetchDaysError } = await supabase
                .from('diet_days')
                .select(`*, diet_meals(*)`)
                .eq('diet_week_id', sourceWeek.id)
                .order('day_number')

            if (fetchDaysError) throw fetchDaysError

            // 2. Check overlap
            setStatus("Hafta çakışması kontrol ediliyor...")
            const { data: existingWeeks, error: weekCheckError } = await supabase
                .from('diet_weeks')
                .select('id')
                .eq('diet_plan_id', targetPlanId)
                .eq('week_number', targetWeekNumber)

            if (weekCheckError) throw weekCheckError

            if (existingWeeks && existingWeeks.length > 0) {
                // Delete existing week (Overwrite)
                setStatus(`Mevcut ${targetWeekNumber}. hafta siliniyor...`)
                const weekIds = existingWeeks.map(w => w.id)
                // Cascade delete days -> meals
                await supabase.from('diet_days').delete().in('diet_week_id', weekIds)
                await supabase.from('diet_weeks').delete().in('id', weekIds)
            }

            // 3. Create New Week
            setStatus("Yeni hafta oluşturuluyor...")

            // Calculate Dates (Approximate: Target Plan Start + (Week-1)*7)
            // But we don't know target plan start easily without fetching more.
            // Let's just blindly copy source week dates OR shift them?
            // Better: If target plan has weeks, align with them?
            // Simple approach: Use source week dates but purely for now, user can edit. 
            // OR: Calculate based on today?
            // Let's use today as start if isolated, or just keep null? DB requires date probably.
            // Let's shift dates based on source duration.

            // Actually, let's just copy the metadata but maybe reset dates?
            // The user request was "8. haftayı 9. hafta olarak".
            // Let's assume dates are irrelevant for content, but we need valid dates for DB.
            // Let's fetch target plan's latest week to find next date? Too complex.
            // Let's just use source week dates shifted? Or same dates? 
            // Let's use same dates for now, user can change.

            const { data: newWeek, error: createWeekError } = await supabase
                .from('diet_weeks')
                .insert([{
                    diet_plan_id: targetPlanId,
                    week_number: targetWeekNumber,
                    title: `${targetWeekNumber}. Hafta`,
                    start_date: sourceWeek.start_date, // Should update this logic in future
                    end_date: sourceWeek.end_date,
                    meal_types: sourceWeek.meal_types,
                    assigned_diet_type_id: sourceWeek.assigned_diet_type_id,
                    weight_log: sourceWeek.weight_log,
                    activity_level_log: sourceWeek.activity_level_log
                }])
                .select()
                .single()

            if (createWeekError) throw createWeekError

            // 4. Copy Days and Meals
            setStatus("Günler ve yemekler kopyalanıyor...")





            if (sourceDays && sourceDays.length > 0) {
                for (const day of sourceDays) {
                    const { data: newDay, error: createDayError } = await supabase
                        .from('diet_days')
                        .insert([{
                            diet_week_id: newWeek.id,
                            day_number: day.day_number,
                            notes: day.notes
                        }])
                        .select()
                        .single()

                    if (createDayError) throw createDayError

                    if (day.diet_meals && day.diet_meals.length > 0) {
                        const mealsToInsert = day.diet_meals.map((m: any) => ({
                            diet_day_id: newDay.id,
                            food_id: m.food_id,
                            meal_time: m.meal_time,
                            portion_multiplier: m.portion_multiplier,
                            is_custom: m.is_custom,
                            custom_name: m.custom_name,
                            custom_notes: m.custom_notes,
                            calories: m.calories,
                            protein: m.protein,
                            carbs: m.carbs,
                            fat: m.fat,
                            sort_order: m.sort_order
                        }))

                        const { error: mealsError } = await supabase.from('diet_meals').insert(mealsToInsert)
                        if (mealsError) throw mealsError
                    }
                }
            }

            setStatus("Tamamlandı!")
            onSuccess()
            onOpenChange(false)
            alert("Hafta başarıyla kopyalandı!")

        } catch (error: any) {
            console.error("Copy error:", error)
            alert("Kopyalama hatası: " + error.message)
        } finally {
            setLoading(false)
            setStatus("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Haftayı Kopyala</DialogTitle>
                    <DialogDescription>
                        {sourceWeek?.week_number}. Haftayı başka bir hastaya kopyalayın.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Hedef Hasta</Label>
                        <Popover open={comboOpen} onOpenChange={setComboOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={comboOpen}
                                    className="justify-between w-full"
                                >
                                    {targetPatientId
                                        ? patients.find((p) => p.id === targetPatientId)?.full_name
                                        : "Hasta seçiniz..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Hasta ara..." />
                                    <CommandList>
                                        <CommandEmpty>Hasta bulunamadı.</CommandEmpty>
                                        <CommandGroup>
                                            {patients.map((patient) => (
                                                <CommandItem
                                                    key={patient.id}
                                                    value={patient.full_name}
                                                    onSelect={() => {
                                                        setTargetPatientId(patient.id)
                                                        setComboOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            targetPatientId === patient.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {patient.full_name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label>Hedef Hafta Numarası</Label>
                        <Input
                            type="number"
                            min={1}
                            max={52}
                            value={targetWeekNumber}
                            onChange={(e) => setTargetWeekNumber(parseInt(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Dikkat: Eğer hedef hastada bu hafta numarası zaten varsa, üzerine yazılacaktır.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        İptal
                    </Button>
                    <Button onClick={handleCopy} disabled={loading || !targetPatientId}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {status}
                            </>
                        ) : (
                            "Kopyala"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
