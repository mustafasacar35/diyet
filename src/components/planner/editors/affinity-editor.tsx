"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AffinityDefinition, RuleTarget, TargetType } from "@/types/planner"
import { Slider } from "@/components/ui/slider"

import { FOOD_ROLES } from "@/lib/constants/food-roles"
import { FOOD_CATEGORIES } from "@/lib/constants/food-categories"

interface AffinityEditorProps {
    value: AffinityDefinition
    onChange: (val: AffinityDefinition) => void
    categories?: string[]
    roles?: string[]
}

export function AffinityEditor({ value, onChange, categories = [], roles = [] }: AffinityEditorProps) {
    const handleChange = (field: keyof AffinityDefinition, val: any) => {
        onChange({ ...value, [field]: val })
    }

    const handleTriggerChange = (field: keyof RuleTarget, val: any) => {
        onChange({ ...value, trigger: { ...value.trigger, [field]: val } })
    }

    const handleOutcomeChange = (field: keyof RuleTarget, val: any) => {
        onChange({ ...value, outcome: { ...value.outcome, [field]: val } })
    }

    // Unified slider: probability = togetherness rate
    // 0% = forbidden, 50% = neutral, 100% = mandatory
    const prob = value.probability ?? 50
    const getSliderLabel = (p: number) => {
        if (p <= 0) return '🚫 YASAKLA'
        if (p <= 15) return '⛔ Çok Düşük'
        if (p <= 35) return '⬇️ Azalt'
        if (p <= 45) return '↘️ Biraz Azalt'
        if (p <= 55) return '➖ Nötr'
        if (p <= 65) return '↗️ Biraz Tercih Et'
        if (p <= 85) return '⬆️ Tercih Et'
        if (p <= 95) return '⭐ Güçlü Tercih'
        return '✅ ZORUNLU'
    }

    const getSliderColor = (p: number) => {
        if (p <= 15) return 'text-red-600 font-bold'
        if (p <= 45) return 'text-orange-500'
        if (p <= 55) return 'text-gray-500'
        if (p <= 85) return 'text-blue-500'
        return 'text-green-600 font-bold'
    }

    // For new rules, don't save the old 'association' field.
    // Remove it when the slider changes.
    const handleSliderChange = (vals: number[]) => {
        const newProb = vals[0]
        // Remove old association field for new unified format
        const { association, ...rest } = value as any
        onChange({ ...rest, probability: newProb })
    }

    return (
        <div className="space-y-6 border rounded-md p-4 bg-purple-50/50">
            <h4 className="text-sm font-semibold border-b pb-2 text-purple-700">Bağımlılık (Affinity) İlişkisi</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* Trigger */}
                <div className="space-y-3">
                    <Label className="text-purple-900 font-bold">1. Tetikleyici (Eğer bu varsa...)</Label>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tip</Label>
                        <Select value={value.trigger.type} onValueChange={(v) => handleTriggerChange('type', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tag">Etiket (Tag)</SelectItem>
                                <SelectItem value="category">Kategori</SelectItem>
                                <SelectItem value="role">Rol</SelectItem>
                                <SelectItem value="food_id">Spesifik Yemek</SelectItem>
                                <SelectItem value="name_contains">İsim İçerir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ValueSelector
                        type={value.trigger.type}
                        value={value.trigger.value}
                        onChange={(v) => handleTriggerChange('value', v)}
                        categories={categories}
                        roles={roles}
                    />
                </div>

                {/* Arrow Visual */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <span className="text-2xl">➡️</span>
                </div>

                {/* Outcome */}
                <div className="space-y-3">
                    <Label className="text-purple-900 font-bold">2. Sonuç (Bunu da ekle/yasakla...)</Label>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Tip</Label>
                        <Select value={value.outcome.type} onValueChange={(v) => handleOutcomeChange('type', v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="category">Kategori</SelectItem>
                                <SelectItem value="tag">Etiket (Tag)</SelectItem>
                                <SelectItem value="role">Rol</SelectItem>
                                <SelectItem value="food_id">Spesifik Yemek</SelectItem>
                                <SelectItem value="name_contains">İsim İçerir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ValueSelector
                        type={value.outcome.type}
                        value={value.outcome.value}
                        onChange={(v) => handleOutcomeChange('value', v)}
                        categories={categories}
                        roles={roles}
                    />
                </div>
            </div>

            <div className="pt-4 border-t">
                {/* Unified Slider */}
                <div className="flex justify-between items-center mb-3">
                    <Label>Birliktelik Oranı: <span className="font-bold">%{prob}</span></Label>
                    <span className={`text-sm font-mono px-2 py-1 rounded border ${getSliderColor(prob)}`}>
                        {getSliderLabel(prob)}
                    </span>
                </div>

                {/* Scale indicators */}
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1 px-1">
                    <span className="text-red-500 font-semibold">🚫 Yasakla</span>
                    <span>Nötr</span>
                    <span className="text-green-600 font-semibold">✅ Zorunlu</span>
                </div>

                <Slider
                    value={[prob]}
                    max={100}
                    step={5}
                    className="flex-1"
                    onValueChange={handleSliderChange}
                />
                
                <div className="flex gap-4 items-center mt-4">
                    <Label className="w-[180px] text-xs text-muted-foreground">İlişki Yönü</Label>
                    <Select 
                        value={value.direction || 'two-way'} 
                        onValueChange={(v) => handleChange('direction', v)}
                    >
                        <SelectTrigger className="flex-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="one-way">Tek Yönlü (1 ➡️ 2)</SelectItem>
                            <SelectItem value="two-way">Çift Yönlü (1 ↔️ 2)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                    %0 = İki yiyecek aynı öğünde kesinlikle bulunmaz (Yasakla). %50 = İlişki yok (Nötr). %100 = İki yiyecek aynı öğünde mutlaka birlikte bulunur (Zorunlu).
                </p>
            </div>
        </div>
    )
}

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

    // Default Text Input
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
                type === 'tag' ? "Etiket girin (örn: kofte)" :
                    type === 'name_contains' ? "İsimde geçen kelime (örn: pilav)" :
                        type === 'food_id' ? "Tam yemek adı" : "Değer"
            }
        />
    )
}
