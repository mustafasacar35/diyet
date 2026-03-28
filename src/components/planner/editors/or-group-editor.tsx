import { OrGroupDefinition, FrequencyDefinition } from "@/types/planner"
import { FrequencyEditor } from "./frequency-editor"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"

interface OrGroupEditorProps {
    value: OrGroupDefinition
    onChange: (val: OrGroupDefinition) => void
    categories?: string[]
    roles?: string[]
}

export function OrGroupEditor({ value, onChange, categories = [], roles = [] }: OrGroupEditorProps) {
    
    const handleAddOption = () => {
        const newOption: FrequencyDefinition = {
            target: { type: 'category', value: '' },
            period: 'weekly',
            min_count: 1
        }
        onChange({
            ...value,
            options: [...(value.options || []), newOption]
        })
    }

    const handleRemoveOption = (index: number) => {
        const newOptions = [...(value.options || [])]
        newOptions.splice(index, 1)
        onChange({
            ...value,
            options: newOptions
        })
    }

    const handleOptionChange = (index: number, newOptionVal: FrequencyDefinition) => {
        const newOptions = [...(value.options || [])]
        newOptions[index] = newOptionVal
        onChange({
            ...value,
            options: newOptions
        })
    }

    const options = value.options || []

    return (
        <div className="space-y-6">
            <div className="mb-4 space-y-2">
                <h3 className="text-lg font-medium">Haftalık Nöbetçi (VEYA Grubu)</h3>
                <p className="text-sm text-neutral-500">
                    Sisteme eklenen hedefler haftalık sırayla devreye girer. <br/>
                    Örn: 1. Hafta A hedefi aranır, 2. Hafta B hedefi aranır. Sonra tekrar başa döner.
                </p>
            </div>

            <div className="space-y-8">
                {options.map((opt, idx) => (
                    <div key={idx} className="relative rounded-md border p-4 bg-slate-50/50">
                        <div className="absolute -top-3 left-4 bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 border rounded-full shadow-sm">
                            {idx + 1}. Seçenek
                        </div>
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveOption(idx)}
                            disabled={options.length <= 1}
                            title="Bu seçeneği kaldır"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        
                        <div className="mt-4">
                            <FrequencyEditor 
                                value={opt} 
                                onChange={(newVal) => handleOptionChange(idx, newVal)} 
                                categories={categories} 
                                roles={roles} 
                            />
                        </div>
                    </div>
                ))}
            </div>

            <Button 
                type="button"
                variant="outline" 
                className="w-full mt-4 border-dashed" 
                onClick={handleAddOption}
            >
                <PlusCircle className="w-4 h-4 mr-2" />
                Yeni Seçenek Ekle
            </Button>
        </div>
    )
}
