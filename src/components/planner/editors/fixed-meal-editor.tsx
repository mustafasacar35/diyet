"use client"

import { useState, useEffect, useId } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { FixedMealDefinition, ScopeWeeks } from "@/types/planner"
import { supabase } from "@/lib/supabase"
import { X, Search } from "lucide-react"

interface FixedMealEditorProps {
    value: FixedMealDefinition
    onChange: (val: FixedMealDefinition) => void
    mealTypes?: string[]
}

const mealSlots = [
    { val: "KAHVALTI", label: "Kahvaltı" },
    { val: "ÖĞLEN", label: "Öğle" },
    { val: "AKŞAM", label: "Akşam" },
    { val: "ARA ÖĞÜN", label: "Ara Öğün" },
]

const days = [
    { val: 1, label: "Pzt" },
    { val: 2, label: "Sal" },
    { val: 3, label: "Çar" },
    { val: 4, label: "Per" },
    { val: 5, label: "Cum" },
    { val: 6, label: "Cmt" },
    { val: 7, label: "Paz" },
]

export function FixedMealEditor({ value, onChange, mealTypes = [] }: FixedMealEditorProps) {
    const baseId = useId()
    const modeAllId = `${baseId}-mode-all`
    const modeRandomId = `${baseId}-mode-random`
    const modeRotateId = `${baseId}-mode-rotate`
    const modeByDayId = `${baseId}-mode-by-day`
    const weekAllId = `${baseId}-week-all`
    const weekSpecificId = `${baseId}-week-specific`
    const weekRepeatingId = `${baseId}-week-repeating`
    const exclusiveScopeId = `${baseId}-exclusive-scope`

    const formatWeeks = (weeks: number[]) => {
        if (!weeks || weeks.length === 0) return ''
        const sorted = [...weeks].sort((a, b) => a - b)
        const parts: string[] = []
        let i = 0
        while (i < sorted.length) {
            const start = sorted[i]; let end = start
            while (i + 1 < sorted.length && sorted[i + 1] === end + 1) end = sorted[++i]
            parts.push(start === end ? `${start}` : `${start}-${end}`)
            i++
        }
        return parts.join(',')
    }

    const parseWeeks = (text: string) => {
        const weeks: number[] = []
        for (const part of text.split(',')) {
            const trimmed = part.trim()
            if (trimmed.includes('-')) {
                const [a, b] = trimmed.split('-').map(s => parseInt(s.trim()))
                if (!isNaN(a) && !isNaN(b)) {
                    for (let w = Math.min(a, b); w <= Math.max(a, b); w++) weeks.push(w)
                }
            } else {
                const n = parseInt(trimmed)
                if (!isNaN(n)) weeks.push(n)
            }
        }
        return [...new Set(weeks)].sort((a, b) => a - b)
    }

    const [weekInputText, setWeekInputText] = useState(() => formatWeeks(value.scope_weeks?.weeks || []))

    // Sync local text state when external weeks array changes (e.g. initial load)
    useEffect(() => {
        if (value.scope_weeks?.mode === 'specific') {
            const externalWeeks = value.scope_weeks?.weeks || []
            const currentParsed = parseWeeks(weekInputText)
            if (JSON.stringify(externalWeeks) !== JSON.stringify(currentParsed)) {
                setWeekInputText(formatWeeks(externalWeeks))
            }
        }
    }, [value.scope_weeks?.weeks, value.scope_weeks?.mode])

    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [allFoods, setAllFoods] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    // Load foods for search
    useEffect(() => {
        async function loadFoods() {
            const { data } = await supabase
                .from('foods')
                .select('id, name, calories, category')
                .order('name')
            setAllFoods(data || [])
        }
        loadFoods()
    }, [])

    // Filter foods based on search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([])
            return
        }
        const filtered = allFoods.filter(f =>
            f.name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10)
        setSearchResults(filtered)
    }, [searchQuery, allFoods])

    const handleChange = (field: keyof FixedMealDefinition, val: any) => {
        onChange({ ...value, [field]: val })
    }

    const addFood = (foodName: string) => {
        if (!value.foods.includes(foodName)) {
            onChange({ ...value, foods: [...value.foods, foodName] })
        }
        setSearchQuery("")
        setSearchResults([])
    }

    const removeFood = (foodName: string) => {
        onChange({ ...value, foods: value.foods.filter(f => f !== foodName) })
    }

    const handleDayAssignment = (dayNum: number, selectedFoods: string[]) => {
        const newAssignments = { ...value.day_assignments }
        newAssignments[String(dayNum)] = selectedFoods
        onChange({ ...value, day_assignments: newAssignments })
    }

    return (
        <div className="space-y-4 border rounded-md p-4 bg-amber-50/50">
            <h4 className="text-sm font-semibold border-b pb-2">🍽️ Sabit Öğün Kuralı</h4>

            {/* Target Slot Selection */}
            <div className="space-y-2">
                <Label>Hedef Öğün</Label>
                <Select value={value.target_slot} onValueChange={(v) => handleChange('target_slot', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Öğün seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                        {mealTypes.map(slot => (
                            <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Food Search and Selection */}
            <div className="space-y-2">
                <Label>Yemek Seçimi</Label>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Yemek ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-48 overflow-auto">
                            {searchResults.map(food => (
                                <div
                                    key={food.id}
                                    className="px-3 py-2 hover:bg-slate-100 cursor-pointer flex justify-between text-sm"
                                    onClick={() => addFood(food.name)}
                                >
                                    <span>{food.name}</span>
                                    <span className="text-muted-foreground">{food.calories} kcal</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

                {/* Selected Foods */}
                {value.foods.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 p-2 bg-white rounded border">
                        {value.foods.map(food => (
                            <Badge key={food} variant="secondary" className="gap-1">
                                {food}
                                <X
                                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                                    onClick={() => removeFood(food)}
                                />
                            </Badge>
                        ))}
                    </div>
                )}
                {value.foods.length === 0 && (
                    <p className="text-xs text-muted-foreground">Henüz yemek eklenmedi</p>
                )}

            {/* Selection Mode */}
            <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">Seçim Modu</Label>
                <RadioGroup
                    value={value.selection_mode}
                    onValueChange={(v) => handleChange('selection_mode', v)}
                    className="space-y-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id={modeAllId} />
                        <label htmlFor={modeAllId} className="text-sm cursor-pointer">
                            <strong>Hepsini Ver</strong> - Tüm seçili yemekler her gün verilir
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="random" id={modeRandomId} />
                        <label htmlFor={modeRandomId} className="text-sm cursor-pointer">
                            <strong>Rastgele X Tane</strong> - Her gün listeden belirli sayıda seçilir
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rotate" id={modeRotateId} />
                        <label htmlFor={modeRotateId} className="text-sm cursor-pointer">
                            <strong>Sıralı Rotasyon</strong> - Her gün bir sonraki yemek verilir
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="by_day" id={modeByDayId} />
                        <label htmlFor={modeByDayId} className="text-sm cursor-pointer">
                            <strong>Güne Göre Ata</strong> - Hangi gün hangi yemekler olduğunu belirle
                        </label>
                    </div>
                </RadioGroup>

                {/* Random count input */}
                {value.selection_mode === 'random' && (
                    <div className="flex items-center gap-2 ml-6">
                        <Label className="text-sm">Kaç tane:</Label>
                        <Input
                            type="number"
                            min={1}
                            max={value.foods.length || 10}
                            value={value.count || 1}
                            onChange={(e) => handleChange('count', parseInt(e.target.value))}
                            className="w-20"
                        />
                    </div>
                )}

                {/* Day assignments */}
                {value.selection_mode === 'by_day' && (
                    <div className="space-y-2 ml-6">
                        {days.map(day => (
                            <div key={day.val} className="flex items-center gap-2">
                                <span className="w-10 text-sm font-medium">{day.label}:</span>
                                <Select
                                    value={value.day_assignments?.[String(day.val)]?.[0] || '_none_'}
                                    onValueChange={(v) => handleDayAssignment(day.val, v === '_none_' ? [] : [v])}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Yemek seç..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none_">Yok</SelectItem>
                                        {value.foods.map(food => (
                                            <SelectItem key={food} value={food}>{food}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Scope Days (optional) */}
            <div className="space-y-2 border-t pt-4">
                <Label className="text-sm">Geçerli Günler (Boş ise her gün)</Label>
                <div className="flex flex-wrap gap-2">
                    {days.map(day => {
                        const isSelected = value.scope_days?.includes(day.val)
                        return (
                            <Badge
                                key={day.val}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => {
                                    const current = value.scope_days || []
                                    const next = current.includes(day.val)
                                        ? current.filter(d => d !== day.val)
                                        : [...current, day.val]
                                    handleChange('scope_days', next)
                                }}
                            >
                                {day.label}
                            </Badge>
                        )
                    })}
                </div>
            </div>

            {/* Week Scope Selection */}
            <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">📅 Hafta Kapsamı</Label>
                <RadioGroup
                    value={value.scope_weeks?.mode || 'all'}
                    onValueChange={(mode) => {
                        if (mode === 'all') {
                            handleChange('scope_weeks', undefined)
                        } else if (mode === 'specific') {
                            handleChange('scope_weeks', { mode: 'specific', weeks: [] } as ScopeWeeks)
                        } else {
                            handleChange('scope_weeks', { mode: 'repeating', every: 2, starting_week: 1 } as ScopeWeeks)
                        }
                    }}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id={weekAllId} />
                        <label htmlFor={weekAllId} className="text-sm cursor-pointer">Tüm Haftalar</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific" id={weekSpecificId} />
                        <label htmlFor={weekSpecificId} className="text-sm cursor-pointer">Belirli Haftalar</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="repeating" id={weekRepeatingId} />
                        <label htmlFor={weekRepeatingId} className="text-sm cursor-pointer">Tekrarlayan</label>
                    </div>
                </RadioGroup>

                {value.scope_weeks?.mode === 'specific' && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            Geçerli hafta numaralarını girin. Aralık için tire kullanın (ör: 1,2,6-8)
                        </p>
                        <Input
                            value={weekInputText}
                            onChange={(e) => {
                                const text = e.target.value
                                setWeekInputText(text)
                                const unique = parseWeeks(text)
                                handleChange('scope_weeks', { mode: 'specific', weeks: unique } as ScopeWeeks)
                            }}
                            placeholder="ör: 1,2,6-8"
                            className="w-48"
                        />
                        {(value.scope_weeks?.weeks?.length || 0) > 0 && (
                            <p className="text-xs text-green-600">
                                ✓ Geçerli haftalar: {value.scope_weeks!.weeks!.join(', ')}
                            </p>
                        )}
                    </div>
                )}

                {value.scope_weeks?.mode === 'repeating' && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Her</span>
                            <Input
                                type="number"
                                min={2}
                                max={10}
                                value={value.scope_weeks?.every || 2}
                                onChange={(e) => handleChange('scope_weeks', {
                                    ...value.scope_weeks,
                                    mode: 'repeating',
                                    every: parseInt(e.target.value) || 2
                                } as ScopeWeeks)}
                                className="w-16"
                            />
                            <span className="text-sm">haftada bir,</span>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={value.scope_weeks?.starting_week || 1}
                                onChange={(e) => handleChange('scope_weeks', {
                                    ...value.scope_weeks,
                                    mode: 'repeating',
                                    starting_week: parseInt(e.target.value) || 1
                                } as ScopeWeeks)}
                                className="w-16"
                            />
                            <span className="text-sm">. haftadan başla</span>
                        </div>
                        <div className="flex gap-2">
                            <Badge
                                variant={value.scope_weeks?.every === 2 && value.scope_weeks?.starting_week === 1 ? 'default' : 'outline'}
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => handleChange('scope_weeks', { mode: 'repeating', every: 2, starting_week: 1 } as ScopeWeeks)}
                            >
                                Tek Haftalar (1,3,5...)
                            </Badge>
                            <Badge
                                variant={value.scope_weeks?.every === 2 && value.scope_weeks?.starting_week === 2 ? 'default' : 'outline'}
                                className="cursor-pointer hover:opacity-80"
                                onClick={() => handleChange('scope_weeks', { mode: 'repeating', every: 2, starting_week: 2 } as ScopeWeeks)}
                            >
                                Çift Haftalar (2,4,6...)
                            </Badge>
                        </div>
                        <p className="text-xs text-blue-600">
                            → {(() => {
                                const every = value.scope_weeks?.every || 2
                                const start = value.scope_weeks?.starting_week || 1
                                const preview: number[] = []
                                for (let w = start; w <= 20; w += every) preview.push(w)
                                return `Haftalar: ${preview.join(', ')},...`
                            })()}
                        </p>
                    </div>
                )}
            </div>

            {/* Exclusive Scope Toggle */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-3 border-red-100 bg-red-50/30">
                <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-red-800">Kapsam Dışı Yasaklama</Label>
                    <p className="text-xs text-muted-foreground">
                        Eğer kural inaktifse (hafta, gün veya öğün kısıtı nedeniyle),
                        <br />{value.foods.length} yemeğin tümünü o periyot için <strong>tamamen yasakla</strong>.
                    </p>
                </div>
                <Switch
                    id={exclusiveScopeId}
                    checked={!!value.exclusive_scope}
                    onCheckedChange={(checked) => handleChange('exclusive_scope', checked)}
                />
            </div>

            {/* Summary */}
            <div className="text-xs text-muted-foreground italic border-t pt-2">
                {value.foods.length} yemek seçili →{' '}
                {value.selection_mode === 'all' && 'hepsi her gün verilecek'}
                {value.selection_mode === 'random' && `her gün ${value.count || 1} tanesi rastgele seçilecek`}
                {value.selection_mode === 'rotate' && 'sırayla her gün farklı biri verilecek'}
                {value.selection_mode === 'by_day' && 'günlere göre atanan yemekler verilecek'}
                {' '}({value.target_slot || 'öğün seçilmedi'})
                {value.scope_weeks?.mode === 'specific' && value.scope_weeks?.weeks?.length ? ` (Haftalar: ${value.scope_weeks.weeks.join(',')})` : ''}
                {value.scope_weeks?.mode === 'repeating' ? ` (Her ${value.scope_weeks?.every} haftada bir, ${value.scope_weeks?.starting_week}. haftadan)` : ''}
                {value.exclusive_scope ? ` + [⚠️ Kapsam dışı yasaklı]` : ''}
            </div>
        </div>
    )
}
