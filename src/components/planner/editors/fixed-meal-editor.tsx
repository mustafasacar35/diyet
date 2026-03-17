"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FixedMealDefinition } from "@/types/planner"
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
            </div>

            {/* Selection Mode */}
            <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">Seçim Modu</Label>
                <RadioGroup
                    value={value.selection_mode}
                    onValueChange={(v) => handleChange('selection_mode', v)}
                    className="space-y-2"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="mode-all" />
                        <label htmlFor="mode-all" className="text-sm cursor-pointer">
                            <strong>Hepsini Ver</strong> - Tüm seçili yemekler her gün verilir
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="random" id="mode-random" />
                        <label htmlFor="mode-random" className="text-sm cursor-pointer">
                            <strong>Rastgele X Tane</strong> - Her gün listeden belirli sayıda seçilir
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="rotate" id="mode-rotate" />
                        <label htmlFor="mode-rotate" className="text-sm cursor-pointer">
                            <strong>Sıralı Rotasyon</strong> - Her gün bir sonraki yemek verilir
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="by_day" id="mode-by-day" />
                        <label htmlFor="mode-by-day" className="text-sm cursor-pointer">
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

            {/* Summary */}
            <div className="text-xs text-muted-foreground italic border-t pt-2">
                {value.foods.length} yemek seçili →{' '}
                {value.selection_mode === 'all' && 'hepsi her gün verilecek'}
                {value.selection_mode === 'random' && `her gün ${value.count || 1} tanesi rastgele seçilecek`}
                {value.selection_mode === 'rotate' && 'sırayla her gün farklı biri verilecek'}
                {value.selection_mode === 'by_day' && 'günlere göre atanan yemekler verilecek'}
                {' '}({value.target_slot || 'öğün seçilmedi'})
            </div>
        </div>
    )
}
