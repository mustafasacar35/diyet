"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NutritionalDefinition } from "@/types/planner"
import { supabase } from "@/lib/supabase"
import { X, Search } from "lucide-react"

interface NutritionalEditorProps {
    value?: NutritionalDefinition
    onChange: (value: NutritionalDefinition) => void
}

export function NutritionalEditor({ value, onChange }: NutritionalEditorProps) {
    const data: NutritionalDefinition = value || {
        condition: { macro: 'protein', operator: '<', value: 10 },
        action: { type: 'add', target: { type: 'food_id', value: '' }, foods: [], selection_mode: 'single' },
        target_slot: 'AKŞAM'
    }

    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [allFoods, setAllFoods] = useState<any[]>([])
    const [foodNames, setFoodNames] = useState<Record<string, string>>({})

    // Load foods for search
    useEffect(() => {
        async function loadFoods() {
            const { data } = await supabase
                .from('foods')
                .select('id, name, calories, protein, category')
                .order('name')
            setAllFoods(data || [])

            // Build name lookup for selected food IDs
            const nameMap: Record<string, string> = {}
            ;(data || []).forEach(f => { nameMap[f.id] = f.name })
            setFoodNames(nameMap)
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

    const handleChange = (field: string, val: any) => {
        onChange({ ...data, [field]: val })
    }

    const handleConditionChange = (field: string, val: any) => {
        onChange({ ...data, condition: { ...data.condition, [field]: val } })
    }

    const handleActionChange = (field: string, val: any) => {
        onChange({ ...data, action: { ...data.action, [field]: val } })
    }

    // Multi-food management
    const currentFoods = data.action.foods || []
    const selectionMode = data.action.selection_mode || 'single'

    const addFood = (food: any) => {
        const newFoods = [...currentFoods]
        if (!newFoods.includes(food.id)) {
            newFoods.push(food.id)
        }
        // Also set the first food as the backward-compat target
        const newTarget = newFoods.length > 0
            ? { type: 'food_id' as const, value: newFoods[0] }
            : data.action.target

        onChange({
            ...data,
            action: {
                ...data.action,
                foods: newFoods,
                target: newTarget
            }
        })
        setSearchQuery("")
        setSearchResults([])
    }

    const removeFood = (foodId: string) => {
        const newFoods = currentFoods.filter(id => id !== foodId)
        const newTarget = newFoods.length > 0
            ? { type: 'food_id' as const, value: newFoods[0] }
            : { type: 'food_id' as const, value: '' }

        onChange({
            ...data,
            action: {
                ...data.action,
                foods: newFoods,
                target: newTarget
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-semibold text-sm">1. Koşul (Eğer)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Makro</Label>
                        <Select
                            value={data.condition.macro}
                            onValueChange={(v: any) => handleConditionChange('macro', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="protein">Protein</SelectItem>
                                <SelectItem value="fat">Yağ</SelectItem>
                                <SelectItem value="carbs">Karbonhidrat</SelectItem>
                                <SelectItem value="calories">Kalori</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Sınır Durumu (Hedefin Altındaysa)</Label>
                        <Select
                            value={data.condition.operator}
                            onValueChange={(v: '<' | '>') => handleConditionChange('operator', v)}
                            disabled={true}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="<">Eksikliği Fazlaysa (&lt;)</SelectItem>
                                <SelectItem value=">">Fazlalığı Varsa (&gt;)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Açık Miktarı (gram/kcal)</Label>
                        <Input
                            type="number"
                            value={data.condition.value}
                            onChange={(e) => handleConditionChange('value', parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground">Hedef ile gerçekleşen arasındaki açık bu değerden büyükse kural tetiklenir.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border">
                <h4 className="font-semibold text-sm">2. Çözüm (O Zaman)</h4>

                <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <div className="w-1/3">
                            <Label>Aksiyon</Label>
                            <Select
                                value={data.action.type}
                                onValueChange={(v: 'add' | 'swap') => handleActionChange('type', v)}
                                disabled={true}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">Öğüne Ekle (+)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-1/3">
                            <Label>Hangi Öğüne?</Label>
                            <Select
                                value={data.target_slot}
                                onValueChange={(v) => handleChange('target_slot', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KAHVALTI">Kahvaltı</SelectItem>
                                    <SelectItem value="ÖĞLEN">Öğle Yemeği</SelectItem>
                                    <SelectItem value="AKŞAM">Akşam Yemeği</SelectItem>
                                    <SelectItem value="ARA ÖĞÜN">Ara Öğün</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Food Search */}
                    <div className="space-y-2">
                        <Label>Eklenecek Yemek(ler)</Label>
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
                                            onClick={() => addFood(food)}
                                        >
                                            <span>{food.name}</span>
                                            <span className="text-muted-foreground">{food.calories} kcal · P{food.protein}g</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Foods */}
                        {currentFoods.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 p-2 bg-white rounded border">
                                {currentFoods.map((foodId, index) => (
                                    <Badge key={foodId} variant="secondary" className="gap-1">
                                        <span className="text-xs text-muted-foreground mr-1">{index + 1}.</span>
                                        {foodNames[foodId] || foodId}
                                        <X
                                            className="h-3 w-3 cursor-pointer hover:text-red-500"
                                            onClick={() => removeFood(foodId)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {currentFoods.length === 0 && (
                            <p className="text-xs text-muted-foreground">Henüz yemek eklenmedi</p>
                        )}
                    </div>

                    {/* Selection Mode */}
                    {currentFoods.length > 1 && (
                        <div className="space-y-3 border-t pt-3">
                            <Label className="text-sm font-medium">Seçim Modu</Label>
                            <RadioGroup
                                value={selectionMode}
                                onValueChange={(v) => handleActionChange('selection_mode', v)}
                                className="space-y-2"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="single" id="nutri-mode-single" />
                                    <label htmlFor="nutri-mode-single" className="text-sm cursor-pointer">
                                        <strong>Tek Yemek</strong> - Her gün ilk yemeği ekle (tag çakışmasında sonrakine geç)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="rotate" id="nutri-mode-rotate" />
                                    <label htmlFor="nutri-mode-rotate" className="text-sm cursor-pointer">
                                        <strong>Sıralı Rotasyon</strong> - Her gün sıradaki yemeği ekle, tag çakışmasında sonrakine geç
                                    </label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="text-xs text-muted-foreground italic border-t pt-2">
                        {currentFoods.length === 0 && 'Yemek seçilmedi'}
                        {currentFoods.length === 1 && `"${foodNames[currentFoods[0]] || currentFoods[0]}" koşul sağlandığında eklenecek`}
                        {currentFoods.length > 1 && selectionMode === 'rotate' &&
                            `${currentFoods.length} yemek sıralı rotasyonla eklenecek (tag çakışması kontrolüyle)`}
                        {currentFoods.length > 1 && selectionMode === 'single' &&
                            `İlk uygun yemek eklenecek (${currentFoods.length} alternatif, tag çakışmasında sonrakine geçilir)`}
                        {' '}→ {data.target_slot || 'öğün seçilmedi'}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Bu koşul sağlandığında, seçilen yemek ilgili öğüne eklenir.
                        Tag çakışması kontrolü: öğünde aynı tag kelimesine sahip yemek varsa atlanır.
                    </p>
                </div>
            </div>
        </div>
    )
}
