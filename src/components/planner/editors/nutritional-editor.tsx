import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RuleTarget, NutritionalDefinition } from "@/types/planner"
import { TargetSelector } from "./shared/target-selector"

interface NutritionalEditorProps {
    value?: NutritionalDefinition
    onChange: (value: NutritionalDefinition) => void
}

export function NutritionalEditor({ value, onChange }: NutritionalEditorProps) {
    const data: NutritionalDefinition = value || {
        condition: { macro: 'protein', operator: '<', value: 10 },
        action: { type: 'add', target: { type: 'food_id', value: '' } },
        target_slot: 'AKŞAM'
    }

    const handleChange = (field: string, val: any) => {
        onChange({ ...data, [field]: val })
    }

    const handleConditionChange = (field: string, val: any) => {
        onChange({ ...data, condition: { ...data.condition, [field]: val } })
    }

    const handleActionChange = (field: string, val: any) => {
        onChange({ ...data, action: { ...data.action, [field]: val } })
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
                            disabled={true} // Only supporting "below deficit" for now for simplicity
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
                                disabled={true} // ONLY support add for now
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

                    <div>
                        <Label>Hangi Yemek?</Label>
                        <TargetSelector
                            value={data.action.target}
                            onChange={(v: any) => handleActionChange('target', v)}
                            disableCategory={true}
                            disableRole={true}
                            disableTag={true}
                        />
                        <p className="text-xs text-muted-foreground mt-2">Bu koşul sağlandığında, yukarıda seçilen yemek ilgili öğüne cezasız olarak enjekte edilir.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
