"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RotationDefinition, RotationItem, RuleTarget, TargetType } from "@/types/planner"
import { supabase } from "@/lib/supabase"
import { FOOD_ROLES } from "@/lib/constants/food-roles"
import { FOOD_CATEGORIES } from "@/lib/constants/food-categories"
import { ArrowUp, ArrowDown, Loader2, RefreshCw, Trash2, Search } from "lucide-react"

interface RotationEditorProps {
    value: RotationDefinition
    onChange: (val: RotationDefinition) => void
    categories?: string[]
    roles?: string[]
}

export function RotationEditor({ value, onChange, categories = [], roles = [] }: RotationEditorProps) {
    const [loadingFoods, setLoadingFoods] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const handleTargetChange = (field: keyof RuleTarget, val: any) => {
        onChange({ ...value, target: { ...value.target, [field]: val } })
    }

    const handleLoadFoods = async () => {
        if (!value.target.value) return
        setLoadingFoods(true)
        try {
            let query = supabase.from('foods').select('id, name, role, category, tags')

            if (value.target.type === 'role') {
                // Need to match by role - fetch all and filter client-side for canonical matching
                const { data } = await query
                const targetRole = value.target.value.toLocaleLowerCase('tr-TR')
                const filtered = (data || []).filter((f: any) => {
                    const fRole = (f.role || '').toLocaleLowerCase('tr-TR')
                    return fRole === targetRole || fRole.includes(targetRole)
                })
                const items: RotationItem[] = filtered.map((f: any) => ({
                    food_id: f.id,
                    food_name: f.name,
                    repeat_count: 1
                }))
                onChange({ ...value, items })
            } else if (value.target.type === 'category') {
                const targetCat = value.target.value
                const { data } = await query
                const filtered = (data || []).filter((f: any) => {
                    const fCat = (f.category || '').toLocaleLowerCase('tr-TR')
                    return fCat === targetCat.toLocaleLowerCase('tr-TR')
                })
                const items: RotationItem[] = filtered.map((f: any) => ({
                    food_id: f.id,
                    food_name: f.name,
                    repeat_count: 1
                }))
                onChange({ ...value, items })
            } else if (value.target.type === 'tag') {
                const targetTag = value.target.value.toLocaleLowerCase('tr-TR')
                const { data } = await query
                const filtered = (data || []).filter((f: any) =>
                    (f.tags || []).some((t: string) => t.toLocaleLowerCase('tr-TR').includes(targetTag))
                )
                const items: RotationItem[] = filtered.map((f: any) => ({
                    food_id: f.id,
                    food_name: f.name,
                    repeat_count: 1
                }))
                onChange({ ...value, items })
            }
        } catch (err) {
            console.error('Failed to load foods for rotation:', err)
        } finally {
            setLoadingFoods(false)
        }
    }

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...value.items]
        const targetIdx = direction === 'up' ? index - 1 : index + 1
        if (targetIdx < 0 || targetIdx >= newItems.length) return
        ;[newItems[index], newItems[targetIdx]] = [newItems[targetIdx], newItems[index]]
        onChange({ ...value, items: newItems })
    }

    const updateRepeatCount = (index: number, count: number) => {
        const newItems = [...value.items]
        newItems[index] = { ...newItems[index], repeat_count: Math.max(1, count) }
        onChange({ ...value, items: newItems })
    }

    const removeItem = (index: number) => {
        const newItems = value.items.filter((_, i) => i !== index)
        onChange({ ...value, items: newItems })
    }

    // Calculate total cycle length
    const totalCycleTurns = value.items.reduce((sum, item) => sum + (item.repeat_count || 1), 0)

    return (
        <div className="space-y-4 border rounded-md p-4 bg-teal-50/50">
            <h4 className="text-sm font-semibold border-b pb-2 text-teal-700">Haftalararası Rotasyon Kuralı</h4>

            <p className="text-sm text-gray-600 mb-4">
                Belirli bir rol veya kategorideki yemekleri <strong>haftalar arası sırayla</strong> döndürür.
                Örneğin: &quot;Her hafta farklı ekmek türü&quot; veya &quot;Poğaça çeşitleri sırayla gelsin&quot;.
            </p>

            {/* Target Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Hedef Tipi</Label>
                    <Select value={value.target.type} onValueChange={(v) => handleTargetChange('type', v as TargetType)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="role">Rol</SelectItem>
                            <SelectItem value="category">Kategori</SelectItem>
                            <SelectItem value="tag">Etiket</SelectItem>
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

            {/* Mode Selection */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Rotasyon Modu</Label>
                    <Select value={value.mode} onValueChange={(v) => onChange({ ...value, mode: v as any })}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sequential">Sıralı (Manuel Sıra)</SelectItem>
                            <SelectItem value="random_no_repeat">Rastgele (Tur Bitene Kadar Tekrar Yok)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Ardışık Hafta Yasağı</Label>
                    <div className="flex items-center gap-3 pt-1">
                        <Switch
                            checked={value.non_consecutive}
                            onCheckedChange={(v) => onChange({ ...value, non_consecutive: v })}
                        />
                        <span className="text-xs text-muted-foreground">
                            {value.non_consecutive ? "Aynı yemek art arda haftalarda gelmez" : "Art arda tekrar olabilir"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Load Foods Button */}
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadFoods}
                    disabled={!value.target.value || loadingFoods}
                    className="gap-2"
                >
                    {loadingFoods ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Besinleri Yükle
                </Button>
                <span className="text-xs text-muted-foreground">
                    {value.items.length > 0
                        ? `${value.items.length} besin yüklü · Tam tur: ${totalCycleTurns} hafta`
                        : "Hedef seçip yükleyin"}
                </span>
            </div>

            {/* Food Items List */}
            {value.items.length > 0 && (
                <div className="space-y-2 border rounded-md p-2 bg-white flex flex-col overflow-hidden max-h-80">
                    <div className="relative shrink-0">
                        <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Yemeklerde ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                    <div className="overflow-y-auto space-y-1 pr-1 min-w-0">
                        {value.items
                            .map((item, idx) => ({ item, idx }))
                            .filter(({ item }) => item.food_name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR')))
                            .map(({ item, idx }) => (
                                <div key={item.food_id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 group min-w-0">
                                    <span className="text-xs text-gray-400 w-6 text-right font-mono shrink-0">{idx + 1}.</span>
                                    <span className="flex-1 text-sm truncate min-w-0" title={item.food_name}>{item.food_name}</span>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <Label className="text-xs text-gray-500 mr-1 hidden sm:inline">Tekrar:</Label>
                                        <Input
                                            type="number"
                                            value={item.repeat_count}
                                            onChange={(e) => updateRepeatCount(idx, parseInt(e.target.value) || 1)}
                                            className="w-12 h-7 text-xs text-center"
                                            min={1}
                                            max={10}
                                        />
                                    </div>

                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => moveItem(idx, 'up')}
                                            disabled={idx === 0 || searchTerm !== ""}
                                        >
                                            <ArrowUp size={12} />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => moveItem(idx, 'down')}
                                            disabled={idx === value.items.length - 1 || searchTerm !== ""}
                                        >
                                            <ArrowDown size={12} />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-500"
                                            onClick={() => removeItem(idx)}
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        {value.items.length > 0 && searchTerm && value.items.filter(i => i.food_name.toLocaleLowerCase('tr-TR').includes(searchTerm.toLocaleLowerCase('tr-TR'))).length === 0 && (
                            <p className="text-xs text-center text-gray-500 py-4">Sonuç bulunamadı.</p>
                        )}
                    </div>
                </div>
            )}

            {value.items.length > 0 && value.mode === 'sequential' && (
                <p className="text-xs text-teal-600 bg-teal-50 p-2 rounded">
                    💡 Sırayı yukarıdaki ok butonlarıyla değiştirebilirsiniz. Tekrar sayısı, bir turda o yemeğin kaç hafta verileceğini belirler.
                </p>
            )}
        </div>
    )
}

function ValueSelector({ type, value, onChange, categories = [], roles = [] }: {
    type: TargetType,
    value: string,
    onChange: (val: string) => void,
    categories?: string[],
    roles?: string[]
}) {
    if (type === 'category') {
        const catItems = categories.length > 0 ? categories : ([...FOOD_CATEGORIES] as string[])
        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Kategori Seçin" />
                </SelectTrigger>
                <SelectContent>
                    {catItems.map((cat: string) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    if (type === 'role') {
        if (roles.length > 0) {
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
        return (
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Rol Seçin" />
                </SelectTrigger>
                <SelectContent>
                    {FOOD_ROLES.map(role => (
                        <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }

    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Etiket girin"
        />
    )
}
