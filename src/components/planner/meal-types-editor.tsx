"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronUp, ChevronDown, X } from "lucide-react"

export interface SlotConfig {
    name: string
    min_items: number
    max_items: number
}

interface MealTypesEditorProps {
    mealTypes: string[]
    slotConfigs?: SlotConfig[]
    onSave: (types: string[], configs: SlotConfig[]) => void
    onCancel: () => void
    onChange?: (configs: SlotConfig[]) => void // Live change callback for embedded mode
    showFooter?: boolean // False when embedded in another dialog's tab
}

const PRESET_TYPES = ['KAHVALTI', 'ÖĞLEN', 'AKŞAM', 'ARA ÖĞÜN', 'GEÇ KAHVALTI', '2. ARA ÖĞÜN']
const DEFAULT_CONFIGS: Record<string, { min: number, max: number }> = {
    'KAHVALTI': { min: 2, max: 4 },
    'ÖĞLEN': { min: 2, max: 4 },
    'AKŞAM': { min: 2, max: 4 },
    'ARA ÖĞÜN': { min: 1, max: 2 },
    'GEÇ KAHVALTI': { min: 2, max: 3 },
    '2. ARA ÖĞÜN': { min: 1, max: 2 },
}

export function MealTypesEditor({ mealTypes, slotConfigs, onSave, onCancel, onChange, showFooter = true }: MealTypesEditorProps) {
    // Convert mealTypes to SlotConfig format, merging with existing configs
    const initialConfigs: SlotConfig[] = slotConfigs && slotConfigs.length > 0
        ? slotConfigs
        : mealTypes.map(name => {
            const existing = slotConfigs?.find(c => c.name === name)
            return existing || { name, min_items: DEFAULT_CONFIGS[name]?.min || 2, max_items: DEFAULT_CONFIGS[name]?.max || 4 }
        })

    const [configs, setConfigs] = useState<SlotConfig[]>(initialConfigs)
    const [newType, setNewType] = useState('')
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [editValue, setEditValue] = useState('')

    // Sync internal state when slotConfigs prop changes (for when parent re-fetches from database)
    useEffect(() => {
        if (slotConfigs && slotConfigs.length > 0) {
            setConfigs(slotConfigs)
        }
    }, [slotConfigs])

    // Notify parent of changes in embedded mode
    useEffect(() => {
        if (onChange) {
            onChange(configs)
        }
    }, [configs, onChange])

    function addType(type: string) {
        if (type && !configs.some(c => c.name === type)) {
            const defaults = DEFAULT_CONFIGS[type] || { min: 2, max: 4 }
            setConfigs([...configs, { name: type, min_items: defaults.min, max_items: defaults.max }])
        }
        setNewType('')
    }

    function removeType(index: number) {
        setConfigs(configs.filter((_, i) => i !== index))
    }

    function moveType(index: number, direction: 'up' | 'down') {
        const newConfigs = [...configs]
        const targetIdx = direction === 'up' ? index - 1 : index + 1
        if (targetIdx < 0 || targetIdx >= configs.length) return
            ;[newConfigs[index], newConfigs[targetIdx]] = [newConfigs[targetIdx], newConfigs[index]]
        setConfigs(newConfigs)
    }

    function updateConfig(index: number, field: 'min_items' | 'max_items', value: number) {
        const newConfigs = [...configs]
        newConfigs[index] = { ...newConfigs[index], [field]: value }
        // Ensure min <= max
        if (field === 'min_items' && value > newConfigs[index].max_items) {
            newConfigs[index].max_items = value
        }
        if (field === 'max_items' && value < newConfigs[index].min_items) {
            newConfigs[index].min_items = value
        }
        setConfigs(newConfigs)
    }

    function startEdit(index: number) {
        setEditingIndex(index)
        setEditValue(configs[index].name)
    }

    function saveEdit() {
        if (editingIndex !== null && editValue.trim()) {
            const newConfigs = [...configs]
            newConfigs[editingIndex] = { ...newConfigs[editingIndex], name: editValue.trim() }
            setConfigs(newConfigs)
            setEditingIndex(null)
            setEditValue('')
        }
    }

    function cancelEdit() {
        setEditingIndex(null)
        setEditValue('')
    }

    function handleSave() {
        const types = configs.map(c => c.name)
        onSave(types, configs)
    }

    // Expose current configs for parent components
    // This is a pattern for when we don't use footer (embedded mode)
    // Parent can read configs via ref or callback

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">Öğünleri düzenleyin. Her öğün için min-max yemek satırı belirleyin.</p>

            <div className="space-y-1">
                {configs.map((config, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        {editingIndex === idx ? (
                            <div className="flex-1 flex gap-1">
                                <Input
                                    className="h-7 text-sm flex-1"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                    autoFocus
                                />
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={saveEdit}>✓</Button>
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>✕</Button>
                            </div>
                        ) : (
                            <span
                                className="flex-1 font-medium text-sm cursor-pointer hover:text-blue-600"
                                onClick={() => startEdit(idx)}
                                title="Düzenlemek için tıklayın"
                            >
                                {config.name}
                            </span>
                        )}

                        {/* Min/Max Inputs */}
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>Min:</span>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={config.min_items}
                                onChange={e => updateConfig(idx, 'min_items', parseInt(e.target.value) || 1)}
                                className="h-6 w-12 text-xs text-center p-1"
                            />
                            <span>Max:</span>
                            <Input
                                type="number"
                                min={1}
                                max={10}
                                value={config.max_items}
                                onChange={e => updateConfig(idx, 'max_items', parseInt(e.target.value) || 1)}
                                className="h-6 w-12 text-xs text-center p-1"
                            />
                        </div>

                        <div className="flex gap-0.5">
                            {idx > 0 && (
                                <button className="p-1 hover:bg-gray-200 rounded" onClick={() => moveType(idx, 'up')}>
                                    <ChevronUp size={14} />
                                </button>
                            )}
                            {idx < configs.length - 1 && (
                                <button className="p-1 hover:bg-gray-200 rounded" onClick={() => moveType(idx, 'down')}>
                                    <ChevronDown size={14} />
                                </button>
                            )}
                        </div>
                        <button className="p-1 hover:bg-red-100 text-red-500 rounded" onClick={() => removeType(idx)}>
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="border-t pt-3 space-y-2">
                <Label className="text-xs">Öğün Ekle</Label>
                <div className="flex gap-1 flex-wrap">
                    {PRESET_TYPES.filter(t => !configs.some(c => c.name === t)).map(type => (
                        <Button key={type} variant="outline" size="sm" className="text-xs h-7" onClick={() => addType(type)}>
                            + {type}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Özel öğün adı..."
                        className="h-8 text-sm"
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addType(newType)}
                    />
                    <Button size="sm" variant="outline" onClick={() => addType(newType)}>Ekle</Button>
                </div>
            </div>

            {showFooter && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onCancel}>İptal</Button>
                    <Button onClick={handleSave}>Uygula</Button>
                </div>
            )}
        </div>
    )
}

// Export for use as controlled component
export function useSlotConfigsState(mealTypes: string[], slotConfigs?: SlotConfig[]) {
    const initialConfigs: SlotConfig[] = mealTypes.map(name => {
        const existing = slotConfigs?.find(c => c.name === name)
        return existing || { name, min_items: DEFAULT_CONFIGS[name]?.min || 2, max_items: DEFAULT_CONFIGS[name]?.max || 4 }
    })
    return useState<SlotConfig[]>(initialConfigs)
}
