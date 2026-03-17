"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FrequencyDefinition, RuleTarget, TargetType } from "@/types/planner"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { Checkbox } from "@/components/ui/checkbox"
import { FOOD_ROLES } from "@/lib/constants/food-roles"
import { FOOD_CATEGORIES } from "@/lib/constants/food-categories"

interface FrequencyEditorProps {
    value: FrequencyDefinition
    onChange: (val: FrequencyDefinition) => void
    categories?: string[]
    roles?: string[]
}

export function FrequencyEditor({ value, onChange, categories = [], roles = [] }: FrequencyEditorProps) {
    const handleChange = (field: keyof FrequencyDefinition, val: any) => {
        onChange({ ...value, [field]: val })
    }

    const handleTargetChange = (field: keyof RuleTarget, val: any) => {
        onChange({ ...value, target: { ...value.target, [field]: val } })
    }

    const days = [
        { val: 1, label: "Pzt" },
        { val: 2, label: "Sal" },
        { val: 3, label: "Çar" },
        { val: 4, label: "Per" },
        { val: 5, label: "Cum" },
        { val: 6, label: "Cmt" },
        { val: 7, label: "Paz" },
    ]

    const mealSlots = [
        { val: "KAHVALTI", label: "Kahvaltı", category: "Ana" },
        { val: "ÖĞLEN", label: "Öğle", category: "Ana" },
        { val: "AKŞAM", label: "Akşam", category: "Ana" },
        { val: "ARA ÖĞÜN", label: "Ara Öğün", category: "Ara" },
        { val: "GECİKMİŞ ÖĞÜN", label: "Gecikmeli", category: "Ara" },
    ]

    // Determine day selection mode
    const dayMode = value.random_day_count ? 'random' : 'specific'

    const handleDayModeChange = (mode: string) => {
        if (mode === 'random') {
            // Switch to random mode - clear scope_days, set default random count
            onChange({ ...value, scope_days: undefined, random_day_count: 3 })
        } else {
            // Switch to specific mode - clear random_day_count
            onChange({ ...value, random_day_count: undefined, scope_days: [] })
        }
    }

    return (
        <div className="space-y-4 border rounded-md p-4 bg-gray-50/50">
            <h4 className="text-sm font-semibold border-b pb-2">Sıklık Kriterleri</h4>

            {/* Target Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Hedef Tipi</Label>
                    <Select value={value.target.type} onValueChange={(v) => handleTargetChange('type', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="category">Kategori</SelectItem>
                            <SelectItem value="role">Yemek Rolü (Main/Side)</SelectItem>
                            <SelectItem value="tag">Etiket (Tag)</SelectItem>
                            <SelectItem value="food_id">Spesifik Yemek (Tam Ad)</SelectItem>
                            <SelectItem value="name_contains">İsim İçerir (Benzer)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Değer</Label>
                    <ValueSelector
                        type={value.target.type}
                        value={value.target.value}
                        onChange={(val) => handleTargetChange('value', val)}
                        categories={categories}
                        roles={roles}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Periyot</Label>
                    <Select value={value.period} onValueChange={(v) => handleChange('period', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="daily">Günlük</SelectItem>
                            <SelectItem value="weekly">Haftalık</SelectItem>
                            <SelectItem value="per_meal">Öğün Başına</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Min. Sayı</Label>
                    <Input type="number" min={0} value={value.min_count || 0} onChange={(e) => handleChange('min_count', parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                    <Label>Max. Sayı</Label>
                    <Input type="number" min={0} value={value.max_count || 0} onChange={(e) => handleChange('max_count', parseInt(e.target.value))} />
                </div>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3 bg-red-50 border-red-100">
                <Checkbox
                    id="force_inclusion"
                    checked={value.force_inclusion || false}
                    onCheckedChange={(checked) => handleChange('force_inclusion', checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                    <Label
                        htmlFor="force_inclusion"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-red-900"
                    >
                        Zorunlu Ekleme (Makroları Aşabilir)
                    </Label>
                    <p className="text-[0.8rem] text-red-600">
                        Seçilirse: Kalori hedefi dolsa bile bu gıdayı eklemeye çalışır.
                    </p>
                </div>
            </div>

            {/* Day Selection Mode */}
            <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">Gün Seçimi</Label>
                <RadioGroup value={dayMode} onValueChange={handleDayModeChange} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="specific" id="day-specific" />
                        <label htmlFor="day-specific" className="text-sm cursor-pointer">Belirli Günler</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="random" id="day-random" />
                        <label htmlFor="day-random" className="text-sm cursor-pointer">Rastgele X Gün</label>
                    </div>
                </RadioGroup>

                {dayMode === 'specific' ? (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Kuralın geçerli olacağı günleri seçin (boş = her gün)</p>
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
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Haftanın kaç gününde bu kural geçerli olsun?</p>
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                min={1}
                                max={7}
                                value={value.random_day_count || 3}
                                onChange={(e) => handleChange('random_day_count', parseInt(e.target.value))}
                                className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">gün (rastgele seçilecek)</span>
                        </div>
                        <p className="text-xs text-amber-600">
                            ⚠️ Diğer {7 - (value.random_day_count || 3)} günde bu kural uygulanMAYACAK
                        </p>
                    </div>
                )}
            </div>

            {/* Meal Slot Selection */}
            <div className="space-y-3 border-t pt-4">
                <Label className="text-sm font-medium">Öğün Seçimi</Label>
                <p className="text-xs text-muted-foreground">Kuralın geçerli olacağı öğünleri seçin (boş = tüm öğünler)</p>
                <div className="flex flex-wrap gap-2">
                    {mealSlots.map(slot => {
                        const isSelected = value.scope_meals?.includes(slot.val)
                        return (
                            <Badge
                                key={slot.val}
                                variant={isSelected ? "default" : "outline"}
                                className={`cursor-pointer hover:opacity-80 ${slot.category === 'Ana' ? 'border-blue-300' : 'border-orange-300'}`}
                                onClick={() => {
                                    const current = value.scope_meals || []
                                    const next = current.includes(slot.val)
                                        ? current.filter(m => m !== slot.val)
                                        : [...current, slot.val]
                                    handleChange('scope_meals', next)
                                }}
                            >
                                {slot.label}
                            </Badge>
                        )
                    })}
                </div>
            </div>

            <div className="text-xs text-muted-foreground italic mt-2 border-t pt-2">
                Özet: "{value.target.value}" ({value.target.type})
                {value.period === 'weekly' ? ' haftada ' : ' günde '}
                {value.min_count}-{value.max_count} kez verilsin.
                {dayMode === 'random' && ` (Rastgele ${value.random_day_count} gün)`}
                {value.scope_meals && value.scope_meals.length > 0 && ` [${value.scope_meals.join(', ')}]`}
            </div>
        </div>
    )
}

// Sub-component for handling different input types
function ValueSelector({ type, value, onChange, categories = [], roles = [] }: {
    type: TargetType | 'name_contains',
    value: string,
    onChange: (val: string) => void,
    categories?: string[],
    roles?: string[]
}) {


    if (type === 'category') {
        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Kategori Seçin" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }


    if (type === 'role') {
        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Rol Seçin" />
                </SelectTrigger>
                <SelectContent>
                    {roles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    // Default Text Input for Tag, FoodID, NameContains
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
                type === 'tag' ? "Etiket girin (örn: kofte)" :
                    type === 'name_contains' ? "İsimde geçen kelime (örn: pilav)" :
                        type === 'food_id' ? "Tam yemek adı (örn: Mercimek Çorbası)" :
                            "Değer girin"
            }
        />
    )
}
