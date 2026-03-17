import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WeekOverrideDefinition } from "@/types/planner"

interface WeekOverrideEditorProps {
    value: WeekOverrideDefinition
    onChange: (value: WeekOverrideDefinition) => void
    patientId?: string
}

export function WeekOverrideEditor({ value, onChange, patientId }: WeekOverrideEditorProps) {
    const [dietTypes, setDietTypes] = useState<any[]>([])

    useEffect(() => {
        async function fetchDietTypes() {
            // Fetch global diet types and patient-specific ones if patientId is provided
            let query = supabase.from('diet_types').select('*')

            if (patientId) {
                query = query.or(`patient_id.is.null,patient_id.eq.${patientId}`)
            } else {
                query = query.is('patient_id', null)
            }

            const { data } = await query.order('name')
            if (data) setDietTypes(data)
        }
        fetchDietTypes()
    }, [patientId])

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-sm">Başlangıç Haftası</Label>
                    <Input
                        type="number"
                        min="1"
                        value={value.week_start || ''}
                        onChange={(e) => onChange({ ...value, week_start: parseInt(e.target.value) || 1 })}
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-sm">Bitiş Haftası</Label>
                    <Input
                        type="number"
                        min={value.week_start || 1}
                        value={value.week_end || ''}
                        onChange={(e) => onChange({ ...value, week_end: parseInt(e.target.value) || 1 })}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-sm">Uygulanacak Diyet Türü</Label>
                <Select
                    value={value.diet_type_id || ''}
                    onValueChange={(val) => onChange({ ...value, diet_type_id: val })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Diyet türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        {dietTypes.map(dt => (
                            <SelectItem key={dt.id} value={dt.id}>
                                {dt.name} {dt.patient_id ? '(Kişisel)' : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="text-xs text-slate-500 mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                <strong>Bilgi:</strong> Bu kural, belirtilen hafta aralığında (örn: 1. ile 2. hafta) hastanın programı ne olursa olsun, seçtiğiniz diyet türünü (makrolar, yasaklar vb.) zorunlu kılar.
            </div>
        </div>
    )
}
