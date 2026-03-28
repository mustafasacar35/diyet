"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConsistencyDefinition, RuleTarget, TargetType } from "@/types/planner"

import { FOOD_ROLES } from "@/lib/constants/food-roles"
import { FOOD_CATEGORIES } from "@/lib/constants/food-categories"

interface ConsistencyEditorProps {
    value: ConsistencyDefinition
    onChange: (val: ConsistencyDefinition) => void
    categories?: string[]
    roles?: string[]
}

export function ConsistencyEditor({ value, onChange, categories = [], roles = [] }: ConsistencyEditorProps) {
    const handleChange = (field: keyof ConsistencyDefinition, val: any) => {
        onChange({ ...value, [field]: val })
    }

    const handleTargetChange = (field: keyof RuleTarget, val: any) => {
        onChange({ ...value, target: { ...value.target, [field]: val } })
    }

    return (
        <div className="space-y-4 border rounded-md p-4 bg-orange-50/50">
            <h4 className="text-sm font-semibold border-b pb-2 text-orange-700">Tutarlılık (Kilit) Kuralı</h4>

            <p className="text-sm text-gray-600 mb-4">
                Bu kural, seçilen bir kategorinin veya yemeğin belirli bir süre boyunca <strong>değişmemesini</strong> sağlar.
                Örneğin: "Hafta boyunca ekmek tipi aynı kalsın".
            </p>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Kilitlenecek Hedef</Label>
                    <Select value={value.target.type} onValueChange={(v) => handleTargetChange('type', v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="category">Kategori</SelectItem>
                            <SelectItem value="role">Rol</SelectItem>
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

            <div className="space-y-2">
                <Label>Kilit Süresi</Label>
                <Select value={value.lock_duration} onValueChange={(v) => handleChange('lock_duration', v)}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="weekly">Haftalık (Tüm hafta aynı)</SelectItem>
                        <SelectItem value="daily">Günlük (Gün içinde aynı)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
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

    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Değer girin"
        />
    )
}
