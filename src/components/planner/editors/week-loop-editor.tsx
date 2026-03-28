"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RefreshCw, ArrowRight, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"

const formatDateISO = (date: Date) => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
}

interface WeekLoopEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    weeks: any[] // Existing weeks
    planId: string
    patient: any
    patientProgram: any
    dietTypesList: any[]
    onSuccess: () => void
}

interface LoopRow {
    id: string
    targetWeekNumber: number | string
    sourceWeekId: string | null
    startDate: string
    endDate: string
    assignedDietTypeId: string | null
}

export function WeekLoopEditor({ open, onOpenChange, weeks, planId, patient, patientProgram, dietTypesList, onSuccess }: WeekLoopEditorProps) {
    const [rows, setRows] = useState<LoopRow[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && weeks && weeks.length > 0) {
            // Initialize rows
            const sortedNums = weeks.map(w => w.week_number).sort((a, b) => a - b)
            const maxWeek = sortedNums.length > 0 ? sortedNums[sortedNums.length - 1] : 0
            
            // Find last end date
            const lastWeekObj = weeks.find(w => w.week_number === maxWeek)
            let baseDate = new Date()
            if (lastWeekObj && lastWeekObj.end_date) {
                baseDate = new Date(lastWeekObj.end_date)
            } else if (lastWeekObj && lastWeekObj.start_date) {
                baseDate = new Date(lastWeekObj.start_date)
                baseDate.setDate(baseDate.getDate() + 6)
            }

            const newRows: LoopRow[] = []
            let currentDate = new Date(baseDate)
            
            for (let i = 1; i <= 20; i++) {
                const targetNumber = maxWeek + i
                
                // Add 1 day to current date for the next start date
                const rowStart = new Date(currentDate)
                rowStart.setDate(rowStart.getDate() + 1)
                
                const rowEnd = new Date(rowStart)
                rowEnd.setDate(rowEnd.getDate() + 6)

                newRows.push({
                    id: `row-${targetNumber}`,
                    targetWeekNumber: targetNumber,
                    sourceWeekId: null, // "none" initially
                    startDate: formatDateISO(rowStart),
                    endDate: formatDateISO(rowEnd),
                    assignedDietTypeId: null
                })
                
                // Update currentDate for the next iteration
                currentDate = new Date(rowEnd)
            }
            setRows(newRows)
        }
    }, [open, weeks])

    const handleSourceChange = (rowId: string, val: string) => {
        setRows(prev => prev.map(r => {
            if (r.id !== rowId) return r
            if (val === 'none') return { ...r, sourceWeekId: null, assignedDietTypeId: null }
            
            const sourceWeek = weeks.find(w => w.id === val)
            if (!sourceWeek) return { ...r, sourceWeekId: val }

            let resolvedDietTypeId = sourceWeek.assigned_diet_type_id
            if (!resolvedDietTypeId && patientProgram?.program_template_weeks) {
                const rule = patientProgram.program_template_weeks.find((pw: any) =>
                    sourceWeek.week_number >= pw.week_start && sourceWeek.week_number <= pw.week_end
                )
                if (rule?.diet_type_id) {
                    resolvedDietTypeId = rule.diet_type_id
                }
            }
            const patientOverride = patient?.planning_rules?.find((pr: any) =>
                pr.rule_type === 'week_override' && pr.is_active &&
                sourceWeek.week_number >= (pr.definition?.data?.week_start || 0) &&
                sourceWeek.week_number <= (pr.definition?.data?.week_end || 999)
            )
            if (patientOverride && patientOverride.definition?.data?.diet_type_id) {
                resolvedDietTypeId = patientOverride.definition.data.diet_type_id
            }

            return { 
                ...r, 
                sourceWeekId: val,
                assignedDietTypeId: resolvedDietTypeId || null
            }
        }))
    }

    const handleChange = (rowId: string, field: keyof LoopRow, val: string) => {
        setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r))
    }

    const handleSave = async () => {
        // filter out rows that don't have a source selected
        const activeRows = rows.filter(r => r.sourceWeekId !== null)
        if (activeRows.length === 0) {
            alert("Hiçbir kopyalanacak hafta seçilmedi.")
            return
        }

        setLoading(true)
        try {
            // For each valid row, we need to completely duplicate the source week into a new week
            for (const row of activeRows) {
                const sourceWeek = weeks.find(w => w.id === row.sourceWeekId)
                if (!sourceWeek) continue

                // 1. Create the new Diet Week
                const parsedTargetWeekNumber = typeof row.targetWeekNumber === 'string' ? (parseInt(row.targetWeekNumber) || 0) : row.targetWeekNumber

                const { data: newWeek, error: weekError } = await supabase.from('diet_weeks').insert([{
                    diet_plan_id: planId,
                    week_number: parsedTargetWeekNumber,
                    title: `${parsedTargetWeekNumber}. Hafta (Devam ${sourceWeek.week_number})`,
                    start_date: row.startDate,
                    end_date: row.endDate,
                    meal_types: sourceWeek.meal_types,
                    slot_configs: sourceWeek.slot_configs,
                    weight_log: -1, // MAGIC FLAG for Lazy Initialization Modal!
                    assigned_diet_type_id: row.assignedDietTypeId,
                    activity_level_log: null
                }]).select().single()

                if (weekError || !newWeek) {
                    console.error("Error creating week", weekError)
                    throw new Error(`${parsedTargetWeekNumber}. Hafta oluşturulamadı: ${weekError?.message}`)
                }

                // 2. Fetch Days of Source Week
                const { data: sourceDays, error: daysError } = await supabase.from('diet_days').select('*').eq('diet_week_id', sourceWeek.id).order('day_number', { ascending: true })
                
                if (daysError || !sourceDays) {
                    console.error("Error fetching source days", daysError)
                    throw new Error("Kaynak günler alınamadı.")
                }

                // 3. Create New Days & Meals
                for (const sDay of sourceDays) {
                    // Create Day
                    const { data: newDay, error: newDayError } = await supabase.from('diet_days').insert([{
                        diet_week_id: newWeek.id,
                        day_number: sDay.day_number,
                        notes: sDay.notes,
                        is_active: true
                    }]).select().single()

                    if (newDayError || !newDay) {
                        console.error("Error creating new day", newDayError)
                        continue
                    }

                    // Fetch Meals for this Source Day
                    const { data: sourceMeals } = await supabase.from('diet_meals').select('*').eq('diet_day_id', sDay.id)
                    
                    if (sourceMeals && sourceMeals.length > 0) {
                        const newMeals = sourceMeals.map((m: any) => ({
                            diet_day_id: newDay.id,
                            meal_time: m.meal_time,
                            food_id: m.food_id,
                            original_food_id: m.original_food_id,
                            portion_multiplier: m.portion_multiplier,
                            is_locked: m.is_locked,
                            sort_order: m.sort_order,
                            calories: m.calories,
                            protein: m.protein,
                            carbs: m.carbs,
                            fat: m.fat,
                            is_custom: m.is_custom,
                            custom_name: m.custom_name,
                            custom_notes: m.custom_notes,
                            is_consumed: true
                        }))
                        
                        await supabase.from('diet_meals').insert(newMeals)
                    }
                }
            }
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            console.error(err)
            alert(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1300px] !max-w-[1300px] w-[95vw] max-h-[95vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Hafta Döngüsü Oluştur</DialogTitle>
                    <DialogDescription>
                        Kopyalamak istediğiniz kaynak haftaları ve yeni oluşturulacak hedef haftaların ayarlarını belirleyin. Ağırlık, aktivite ve diyet türü varsayılan olarak kaynak haftadan otomatik çekilir ancak dilerseniz satır bazında anlık değiştirebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 my-2">
                    <div className="grid grid-cols-12 gap-2 font-medium text-xs uppercase tracking-wider border-b pb-2 text-gray-500 sticky top-0 bg-white z-10">
                        <div className="col-span-1">Yeni H.No</div>
                        <div className="col-span-3">Kaynak Hafta</div>
                        <div className="col-span-3">Diyet Türü (Zorunlu Değil)</div>
                        <div className="col-span-2 text-right">Başlangıç</div>
                        <div className="col-span-3">Bitiş Tarihi</div>
                    </div>

                    {rows.map((row) => (
                        <div key={row.id} className={`grid grid-cols-12 gap-2 items-center text-sm py-1.5 ${row.sourceWeekId ? 'bg-indigo-50/40 rounded -mx-1 px-1 border border-indigo-50/50' : ''}`}>
                            <div className="col-span-1">
                                <div className="flex items-center gap-1">
                                    <Input 
                                        type="number"
                                        className="h-8 text-xs font-semibold w-12 px-1 text-center"
                                        value={row.targetWeekNumber}
                                        onChange={(e) => handleChange(row.id, 'targetWeekNumber', e.target.value)}
                                    />
                                    <span className="text-gray-400 text-xs font-medium">. H</span>
                                </div>
                            </div>
                            <div className="col-span-3">
                                <Select value={row.sourceWeekId || 'none'} onValueChange={(v) => handleSourceChange(row.id, v)}>
                                    <SelectTrigger className="h-8 text-xs bg-white">
                                        <SelectValue placeholder="Seçilmedi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-gray-400 italic">-- Boş Bırak --</SelectItem>
                                        {weeks.sort((a,b) => a.week_number - b.week_number).map(w => (
                                            <SelectItem key={w.id} value={w.id}>{w.title || `${w.week_number}. Hafta`}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <Select 
                                    value={row.assignedDietTypeId || 'none'} 
                                    onValueChange={(v) => handleChange(row.id, 'assignedDietTypeId', v === 'none' ? '' : v)}
                                    disabled={!row.sourceWeekId}
                                >
                                    <SelectTrigger className="h-8 text-[11px] bg-white">
                                        <SelectValue placeholder="Program / Genel" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-gray-400 italic">Program (Aktif program devrede)</SelectItem>
                                        {dietTypesList.map(dt => (
                                            <SelectItem key={dt.id} value={dt.id} className="text-[11px]">
                                                {dt.name} {dt.patient_id ? '(Kişisel)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <Input 
                                    type="date" 
                                    className="h-8 text-xs font-mono ml-auto max-w-[130px]"
                                    value={row.startDate}
                                    onChange={(e) => handleChange(row.id, 'startDate', e.target.value)}
                                />
                            </div>
                            <div className="col-span-3">
                                <Input 
                                    type="date" 
                                    className="h-8 text-xs font-mono max-w-[130px]"
                                    value={row.endDate}
                                    onChange={(e) => handleChange(row.id, 'endDate', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}

                    <div className="pt-2 text-center">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-500"
                            onClick={() => {
                                const lastRow = rows[rows.length - 1]
                                const targetNumber = typeof lastRow.targetWeekNumber === 'string' ? (parseInt(lastRow.targetWeekNumber) || 0) + 1 : lastRow.targetWeekNumber + 1
                                
                                const rowStart = new Date(lastRow.endDate)
                                rowStart.setDate(rowStart.getDate() + 1)
                                
                                const rowEnd = new Date(rowStart)
                                rowEnd.setDate(rowEnd.getDate() + 6)

                                setRows([...rows, {
                                    id: `row-${targetNumber}`,
                                    targetWeekNumber: targetNumber,
                                    sourceWeekId: null,
                                    startDate: formatDateISO(rowStart),
                                    endDate: formatDateISO(rowEnd),
                                    assignedDietTypeId: null
                                }])
                            }}
                        >
                            <Plus size={14} className="mr-1" /> Daha Fazla Satır Ekle
                        </Button>
                    </div>
                </div>

                <DialogFooter className="shrink-0 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        Seçili Haftaları Oluştur ve Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
