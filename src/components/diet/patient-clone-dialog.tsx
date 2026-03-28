
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDays, format, parseISO } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
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

interface PatientCloneDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sourcePatientId: string
    sourcePatientName: string
    onSuccess: () => void
}

export function PatientCloneDialog({ open, onOpenChange, sourcePatientId, sourcePatientName, onSuccess }: PatientCloneDialogProps) {
    const [loading, setLoading] = useState(false)
    const [fetchingSource, setFetchingSource] = useState(false)
    const [cloningStatus, setCloningStatus] = useState<string>("")
    const [originalBirthDate, setOriginalBirthDate] = useState<string | null>(null)

    // Form Inputs
    const [newName, setNewName] = useState("")
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))

    // Profile Fields
    const [weight, setWeight] = useState<number | "">("")
    const [height, setHeight] = useState<number | "">("")
    const [age, setAge] = useState<number | "">("")
    const [gender, setGender] = useState<string>("male")
    const [activityLevel, setActivityLevel] = useState<string>("3")
    const [likedFoods, setLikedFoods] = useState("")
    const [dislikedFoods, setDislikedFoods] = useState("")
    const [notes, setNotes] = useState("")
    const [programTemplateId, setProgramTemplateId] = useState<string | null>(null)
    const [programName, setProgramName] = useState<string>("")
    const [programs, setPrograms] = useState<{ id: string, name: string }[]>([])

    // Existing Patient Mode
    const [mode, setMode] = useState<"new" | "existing">("new")
    const [targetPatientId, setTargetPatientId] = useState<string>("")
    const [allPatients, setAllPatients] = useState<{ id: string, full_name: string }[]>([])
    const [comboOpen, setComboOpen] = useState(false)

    useEffect(() => {
        const fetchPrograms = async () => {
            const { data } = await supabase
                .from('program_templates')
                .select('id, name')
                .eq('is_active', true)
                .order('name')
            if (data) setPrograms(data)
        }
        fetchPrograms()

        const fetchAllPatients = async () => {
            const { data } = await supabase
                .from('patients')
                .select('id, full_name')
                .neq('status', 'archived') // Only active patients
                .order('full_name')

            if (data) {
                // Filter out source patient
                setAllPatients(data.filter(p => p.id !== sourcePatientId))
            }
        }
        fetchAllPatients()

        if (open && sourcePatientId) {
            fetchSourcePatient()
            setNewName(`${sourcePatientName} (Kopya)`)
        } else {
            resetForm()
        }
    }, [open, sourcePatientId, sourcePatientName])

    const resetForm = () => {
        setNewName("")
        setStartDate(format(new Date(), 'yyyy-MM-dd'))
        setWeight("")
        setHeight("")
        setAge("")
        setGender("male")
        setActivityLevel("3")
        setLikedFoods("")
        setDislikedFoods("")
        setNotes("")
        setProgramTemplateId(null)
        setProgramName("")
        setCloningStatus("")
        setOriginalBirthDate(null)
        setMode("new")
        setTargetPatientId("")
    }

    const fetchSourcePatient = async () => {
        setFetchingSource(true)
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', sourcePatientId)
                .single()

            if (error) throw error

            if (data) {
                setWeight(data.weight || "")
                setHeight(data.height || "")
                setGender(data.gender || "male")
                setActivityLevel(String(data.activity_level || "3"))
                setLikedFoods(data.liked_foods ? data.liked_foods.join(", ") : "")
                setDislikedFoods(data.disliked_foods ? data.disliked_foods.join(", ") : "")

                // Process text notes: Clean old "Klonlandı:" messages and append new one
                let oldNotes = data.notes || ""
                oldNotes = oldNotes.replace(/^Klonlandı:.*$|^\s*$/gm, "").trim()
                const newNote = `Klonlandı: ${sourcePatientName} (${format(new Date(), 'dd.MM.yyyy')})`
                setNotes(oldNotes ? `${newNote}\n\n${oldNotes}` : newNote)

                setProgramTemplateId(data.program_template_id)

                // Calculate Age
                if (data.birth_date) {
                    setOriginalBirthDate(data.birth_date)
                    const birth = new Date(data.birth_date)
                    const today = new Date()
                    let calculatedAge = today.getFullYear() - birth.getFullYear()
                    const m = today.getMonth() - birth.getMonth()
                    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                        calculatedAge--
                    }
                    setAge(calculatedAge)
                }

                // Fetch Program Name if exists
                if (data.program_template_id) {
                    const { data: progData } = await supabase
                        .from('program_templates')
                        .select('name')
                        .eq('id', data.program_template_id)
                        .single()
                    if (progData) setProgramName(progData.name)
                }
            }
        } catch (error) {
            console.error("Error fetching source patient:", error)
        } finally {
            setFetchingSource(false)
        }
    }

    const handleClone = async () => {
        if (mode === 'new') {
            if (!newName || !startDate) {
                alert("Lütfen isim ve başlangıç tarihi giriniz.")
                return
            }
        } else {
            if (!targetPatientId || !startDate) {
                alert("Lütfen hedef hasta ve başlangıç tarihi seçiniz.")
                return
            }
        }

        setLoading(true)
        setCloningStatus("İşlem başlatılıyor...")

        try {
            let targetId = targetPatientId

            if (mode === 'new') {
                // 1. Create New Patient

                // Calculate birth_date from age
                let birthDateStr = null

                // Helper to clean calc
                const calcAge = (birthDate: string) => {
                    const b = new Date(birthDate)
                    const t = new Date()
                    let a = t.getFullYear() - b.getFullYear()
                    const m = t.getMonth() - b.getMonth()
                    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) {
                        a--
                    }
                    return a
                }

                if (originalBirthDate && age && Number(age) === calcAge(originalBirthDate)) {
                    // Preserve original date if age hasn't changed (or matches)
                    birthDateStr = originalBirthDate
                } else if (age && Number(age) > 0) {
                    const today = new Date()
                    const birthYear = today.getFullYear() - Number(age)
                    const d = new Date(birthYear, 0, 1) // Default to Jan 1st
                    const year = d.getFullYear()
                    const month = String(d.getMonth() + 1).padStart(2, '0')
                    const day = String(d.getDate()).padStart(2, '0')
                    birthDateStr = `${year}-${month}-${day}`
                }

                // Parse arrays
                const likedArray = likedFoods ? likedFoods.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : []
                const dislikedArray = dislikedFoods ? dislikedFoods.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : []

                const { data: newPatient, error: createError } = await supabase
                    .from('patients')
                    .insert([{
                        full_name: newName,
                        height: height ? Number(height) : null,
                        weight: weight ? Number(weight) : null,
                        gender: gender,
                        birth_date: birthDateStr,
                        activity_level: activityLevel ? Number(activityLevel) : 3,
                        liked_foods: likedArray,
                        disliked_foods: dislikedArray,
                        notes: notes,
                        program_template_id: programTemplateId
                    }])
                    .select()
                    .single()

                if (createError) throw createError
                targetId = newPatient.id
            } else {
                // Existing Mode: DELETE old active plans completely (user wants full overwrite)
                setCloningStatus("Eski planlar siliniyor...")

                // First, fetch all active plan IDs for this patient
                const { data: oldPlans } = await supabase
                    .from('diet_plans')
                    .select('id')
                    .eq('patient_id', targetId)
                    .eq('status', 'active')

                if (oldPlans && oldPlans.length > 0) {
                    const oldPlanIds = oldPlans.map(p => p.id)

                    // Fetch all week IDs for these plans
                    const { data: oldWeeks } = await supabase
                        .from('diet_weeks')
                        .select('id')
                        .in('diet_plan_id', oldPlanIds)

                    if (oldWeeks && oldWeeks.length > 0) {
                        const oldWeekIds = oldWeeks.map(w => w.id)

                        // Delete days (will cascade to meals due to ON DELETE CASCADE)
                        await supabase.from('diet_days').delete().in('diet_week_id', oldWeekIds)

                        // Delete weeks
                        await supabase.from('diet_weeks').delete().in('id', oldWeekIds)
                    }

                    // Delete the old plans
                    await supabase.from('diet_plans').delete().in('id', oldPlanIds)
                    console.log(`Clone: Deleted ${oldPlans.length} old active plans`)
                }
            }

            // 2. Fetch Source Plan
            setCloningStatus("Kaynak plan aranıyor...")
            const { data: sourcePlan, error: planError } = await supabase
                .from('diet_plans')
                .select('*')
                .eq('patient_id', sourcePatientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (planError && planError.code !== 'PGRST116') throw planError

            if (sourcePlan) {
                // Create New Plan
                const { data: newPlan, error: newPlanError } = await supabase
                    .from('diet_plans')
                    .insert([{
                        patient_id: targetId,
                        title: mode === 'new' ? `${newName} Planı` : `${sourcePatientName} (Kopya) - ${format(new Date(), 'dd.MM.yyyy')}`,
                        status: 'active'
                    }])
                    .select()
                    .single()

                if (newPlanError) throw newPlanError

                // 3. Fetch Weeks (Iterative Process)
                setCloningStatus("Haftalar taranıyor...")

                const { data: sourceWeeks, error: weeksError } = await supabase
                    .from('diet_weeks')
                    .select('*')
                    .eq('diet_plan_id', sourcePlan.id)
                    .order('week_number')

                if (weeksError) throw weeksError

                if (sourceWeeks && sourceWeeks.length > 0) {
                    const sortedWeeks = sourceWeeks.sort((a, b) => a.week_number - b.week_number)
                    const baseDate = new Date(startDate)

                    for (const week of sortedWeeks) {
                        setCloningStatus(`${week.week_number}. hafta kopyalanıyor...`)

                        // Calculate new dates
                        const weekStart = addDays(baseDate, (week.week_number - 1) * 7)
                        const weekEnd = addDays(weekStart, 6)

                        // Create Week
                        const { data: newWeek, error: newWeekError } = await supabase
                            .from('diet_weeks')
                            .insert([{
                                diet_plan_id: newPlan.id,
                                week_number: week.week_number,
                                start_date: format(weekStart, 'yyyy-MM-dd'),
                                end_date: format(weekEnd, 'yyyy-MM-dd'),
                                title: week.title,
                                meal_types: week.meal_types,
                                // If NO program selected, clear the assigned diet type
                                assigned_diet_type_id: programTemplateId ? week.assigned_diet_type_id : null,
                                weight_log: week.weight_log,
                                activity_level_log: week.activity_level_log
                            }])
                            .select()
                            .single()

                        if (newWeekError) {
                            console.error("Error creating week", week.week_number, newWeekError)
                            continue
                        }

                        // Fetch Days and Meals for THIS week explicitly
                        const { data: sourceDays, error: daysError } = await supabase
                            .from('diet_days')
                            .select(`
                                *,
                                diet_meals (*)
                             `)
                            .eq('diet_week_id', week.id)
                            .order('day_number')

                        if (daysError) {
                            console.error("Error fetching source days for week", week.week_number, daysError)
                            continue
                        }

                        // Create Days
                        if (sourceDays && sourceDays.length > 0) {
                            for (const day of sourceDays) {
                                const { data: newDay, error: newDayError } = await supabase
                                    .from('diet_days')
                                    .insert([{
                                        diet_week_id: newWeek.id,
                                        day_number: day.day_number,
                                        notes: day.notes,
                                        is_active: day.is_active ?? true
                                    }])
                                    .select()
                                    .single()

                                if (newDayError) continue

                                // Create Meals
                                if (day.diet_meals && day.diet_meals.length > 0) {
                                    const mealsToInsert = day.diet_meals.map((meal: any) => ({
                                        diet_day_id: newDay.id,
                                        meal_time: meal.meal_time,
                                        food_id: meal.food_id,
                                        is_custom: meal.is_custom,
                                        custom_name: meal.custom_name,
                                        custom_notes: meal.custom_notes,
                                        calories: meal.calories,
                                        protein: meal.protein,
                                        carbs: meal.carbs,
                                        fat: meal.fat,
                                        portion_multiplier: meal.portion_multiplier,
                                        sort_order: meal.sort_order,
                                        is_locked: meal.is_locked
                                    }))

                                    const { error: mealsError } = await supabase
                                        .from('diet_meals')
                                        .insert(mealsToInsert)

                                    if (mealsError) {
                                        console.error("Error creating meals", mealsError)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            setCloningStatus("İşlem tamamlandı!")
            onSuccess()
            onOpenChange(false)

        } catch (error: any) {
            console.error("Clone error:", error)
            setCloningStatus("")
            alert("Klonlama başarısız: " + (error.message || error))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Hastayı Klonla</DialogTitle>
                    <DialogDescription>
                        {sourcePatientName} adlı hastanın profili ve diyet programı kopyalanacak.
                        Aşağıdaki bilgileri kontrol edip düzenleyebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {fetchingSource ? (
                        <div className="text-center py-4">Veriler yükleniyor...</div>
                    ) : (
                        <>
                            <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-4">
                                    <TabsTrigger value="new">Yeni Hasta Oluştur</TabsTrigger>
                                    <TabsTrigger value="existing">Mevcut Hastaya Aktar</TabsTrigger>
                                </TabsList>

                                <TabsContent value="new" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Yeni Hasta Adı</Label>
                                            <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="date">Yeni Başlangıç Tarihi</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="weight">Kilo (kg)</Label>
                                            <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="height">Boy (cm)</Label>
                                            <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="age">Yaş</Label>
                                            <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="activity">Aktivite (1-5)</Label>
                                            <Select value={activityLevel} onValueChange={setActivityLevel}>
                                                <SelectTrigger id="activity">
                                                    <SelectValue placeholder="Seç" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 - Hareketsiz</SelectItem>
                                                    <SelectItem value="2">2 - Az Hareketli</SelectItem>
                                                    <SelectItem value="3">3 - Orta Hareketli</SelectItem>
                                                    <SelectItem value="4">4 - Çok Hareketli</SelectItem>
                                                    <SelectItem value="5">5 - Sporcu</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="gender">Cinsiyet</Label>
                                            <Select value={gender} onValueChange={setGender}>
                                                <SelectTrigger id="gender">
                                                    <SelectValue placeholder="Seç" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Erkek</SelectItem>
                                                    <SelectItem value="female">Kadın</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Mevcut Program</Label>
                                            <Select
                                                value={programTemplateId || "no_program"}
                                                onValueChange={(val) => setProgramTemplateId(val === "no_program" ? null : val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Program Seç" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="no_program">Program Yok</SelectItem>
                                                    {programs.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="liked">Sevdiği Yemekler (Virgülle ayırın)</Label>
                                        <Textarea
                                            id="liked"
                                            value={likedFoods}
                                            onChange={(e) => setLikedFoods(e.target.value)}
                                            placeholder="Örn: Tavuk, Ispanak..."
                                            className="resize-none h-20"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="disliked">Sevmediği Yemekler (Virgülle ayırın)</Label>
                                        <Textarea
                                            id="disliked"
                                            value={dislikedFoods}
                                            onChange={(e) => setDislikedFoods(e.target.value)}
                                            placeholder="Örn: Pırasa, Bamya..."
                                            className="resize-none h-20"
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="notes">Notlar</Label>
                                        <Textarea
                                            id="notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            className="resize-none h-20"
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="existing" className="space-y-4 py-4">
                                    <div className="grid gap-4">
                                        <div className="flex flex-col gap-2">
                                            <Label>Hedef Hasta Seçin</Label>
                                            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={comboOpen}
                                                        className="w-full justify-between"
                                                    >
                                                        {targetPatientId
                                                            ? allPatients.find((patient) => patient.id === targetPatientId)?.full_name
                                                            : "Hasta seçiniz..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[400px] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Hasta ara..." />
                                                        <CommandList>
                                                            <CommandEmpty>Hasta bulunamadı.</CommandEmpty>
                                                            <CommandGroup>
                                                                {allPatients.map((patient) => (
                                                                    <CommandItem
                                                                        key={patient.id}
                                                                        value={patient.full_name}
                                                                        onSelect={() => {
                                                                            setTargetPatientId(patient.id === targetPatientId ? "" : patient.id)
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
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Dikkat: Seçilen hastanın şu anki <strong>aktif</strong> planları "Arşivlendi" durumuna alınacaktır.
                                            </p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="date-existing">Yeni Plan Başlangıç Tarihi</Label>
                                            <Input
                                                id="date-existing"
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </>
                    )}

                    {cloningStatus && (
                        <div className="p-3 bg-blue-50 text-blue-700 rounded text-sm font-medium animate-pulse">
                            {cloningStatus}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleClone} disabled={loading || fetchingSource}>
                        {loading ? "Kopyalanıyor..." : "Klonla ve Kaydet"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
