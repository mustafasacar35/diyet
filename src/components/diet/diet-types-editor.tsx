'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagInput } from '@/components/ui/tag-input'
import { RichTagInput, RichTag } from '@/components/ui/rich-tag-input'

const AVAILABLE_DIET_TAGS = [
    { id: 'KETOGENIC', label: 'Ketojenik' },
    { id: 'LOW_CARB', label: 'Low Carb' },
    { id: 'GLUTEN_FREE', label: 'Glutensiz' },
    { id: 'VEGAN', label: 'Vegan' },
    { id: 'VEGETARIAN', label: 'Vejetaryen' },
    { id: 'DAIRY_FREE', label: 'Sütsüz' },
    { id: 'HIGH_PROTEIN', label: 'Yüksek Protein' },
    { id: 'PALEO', label: 'Paleo' },
]

// ... (imports remain)

export function DietTypesEditor({ dietTypes, onUpdate, patientId = null }: { dietTypes: any[], onUpdate: () => void, patientId?: string | null }) {
    // const supabase = createClientComponentClient()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({
        name: '', abbreviation: '', description: '',
        carb_factor: 0, protein_factor: 0, fat_factor: 0,
        allowed_tags: [] as string[],
        banned_keywords: [] as RichTag[],
        banned_tags: [] as RichTag[]
    })
    const [isAdding, setIsAdding] = useState(false)
    const [newForm, setNewForm] = useState({
        name: '', abbreviation: '', description: '',
        carb_factor: 1.0, protein_factor: 1.0, fat_factor: 1.0,
        allowed_tags: [] as string[],
        banned_keywords: [] as RichTag[],
        banned_tags: [] as RichTag[]
    })
    const [saving, setSaving] = useState(false)

    // ... (helpers remain: stringToKeywords, normalizeForTag, uniqueTags, toggleTag)
    const normalizeForTag = (text: string) => {
        let t = text.toUpperCase()
            .replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ş/g, 'S')
            .replace(/İ/g, 'I').replace(/Ö/g, 'O').replace(/Ç/g, 'C')
            .replace(/[\s\-]/g, '_').replace(/[^A-Z0-9_]/g, '')

        const MAPPING: Record<string, string> = {
            'KETOJENIK': 'KETOGENIC', 'KETO': 'KETOGENIC',
            'LOWCARB': 'LOW_CARB', 'LOW_CARB': 'LOW_CARB',
            'VEJETARYEN': 'VEGETARIAN', 'VEJETERYAN': 'VEGETARIAN',
            'VEGAN': 'VEGAN',
            'GLUTENSIZ': 'GLUTEN_FREE',
            'SUTSUZ': 'DAIRY_FREE',
            'PALEO': 'PALEO'
        }
        return MAPPING[t] || t
    }

    const availableDietTags = dietTypes.map(dt => {
        const tagId = normalizeForTag(dt.name)
        return { id: tagId, label: dt.name }
    })
    const uniqueTags = Array.from(new Map(availableDietTags.map(item => [item.id, item])).values())

    const toggleTag = (tagId: string, isEdit: boolean) => {
        if (isEdit) {
            const current = editForm.allowed_tags || []
            if (current.includes(tagId)) setEditForm({ ...editForm, allowed_tags: current.filter(t => t !== tagId) })
            else setEditForm({ ...editForm, allowed_tags: [...current, tagId] })
        } else {
            const current = newForm.allowed_tags || []
            if (current.includes(tagId)) setNewForm({ ...newForm, allowed_tags: current.filter(t => t !== tagId) })
            else setNewForm({ ...newForm, allowed_tags: [...current, tagId] })
        }
    }

    // Helper to convert DB format (string[] + jsonb) to RichTag[]
    const toRichTags = (items: string[], details: Record<string, any> = {}): RichTag[] => {
        return (items || []).map(text => ({
            text,
            warning: details?.[text]?.warning,
            info: details?.[text]?.info
        }))
    }

    // Helper to convert RichTag[] to DB format
    const fromRichTags = (tags: RichTag[]) => {
        const items = tags.map(t => t.text)
        const details = tags.reduce((acc, t) => {
            if (t.warning || t.info) {
                acc[t.text] = { warning: t.warning, info: t.info }
            }
            return acc
        }, {} as Record<string, any>)
        return { items, details }
    }


    const startEdit = (dt: any) => {
        if (patientId && !dt.patient_id) {
            // Editing a GLOBAL type in Patient Context -> Warn & Prepare Copy
            if (!confirm("Bu genel (global) bir diyet şablonu. Düzenleme yaptığınızda BU HASTA İÇİN bir kopyası oluşturulacak. Onaylıyor musunuz?")) {
                return
            }
        }
        setEditingId(dt.id)

        // Parse raw data
        const banned_keywords = toRichTags(dt.banned_keywords, dt.banned_details)
        // Note: We intentionally share banned_details for both lists if they use same keys, 
        // or we could split them. Ideally they are separate but schema has one JSONB.
        // Assuming keys are unique enough or shared context is fine.
        const banned_tags = toRichTags(dt.banned_tags, dt.banned_details)

        setEditForm({
            name: dt.name || '',
            abbreviation: dt.abbreviation || '',
            description: dt.description || '',
            carb_factor: dt.carb_factor || 0,
            protein_factor: dt.protein_factor || 0,
            fat_factor: dt.fat_factor || 0,
            allowed_tags: dt.allowed_tags || [],
            banned_keywords,
            banned_tags
        })
    }

    const saveEdit = async () => {
        if (!editingId) return

        const original = dietTypes.find(d => d.id === editingId)
        if (!original) return

        setSaving(true)
        try {
            // Prepare data
            const keywordsData = fromRichTags(editForm.banned_keywords)
            const tagsData = fromRichTags(editForm.banned_tags)

            // Merge details (last one wins if duplicate keys, which shouldn't happen ideally)
            const mergedDetails = { ...keywordsData.details, ...tagsData.details }

            const updatePayload = {
                name: editForm.name,
                abbreviation: editForm.abbreviation,
                description: editForm.description,
                carb_factor: editForm.carb_factor,
                protein_factor: editForm.protein_factor,
                fat_factor: editForm.fat_factor,
                allowed_tags: editForm.allowed_tags,
                banned_keywords: keywordsData.items,
                banned_tags: tagsData.items,
                banned_details: mergedDetails // New column
            }

            // 1) Shadow Copy or 2) Update
            if (patientId && !original.patient_id) {
                // Shadow Copy Logic
                const { data: newDietType, error } = await supabase.from('diet_types').insert({
                    patient_id: patientId,
                    parent_diet_type_id: original.id,
                    ...updatePayload
                }).select().single()

                if (error) throw new Error(error.message)

                // Update weeks...
                const { data: patientPlans } = await supabase.from('diet_plans').select('id').eq('patient_id', patientId)
                if (patientPlans && patientPlans.length > 0) {
                    const planIds = patientPlans.map(p => p.id)
                    await supabase.from('diet_weeks').update({ assigned_diet_type_id: newDietType.id }).in('diet_plan_id', planIds).eq('assigned_diet_type_id', original.id)
                }
                setEditingId(null)
                onUpdate()
            } else {
                // Update
                const { error } = await supabase.from('diet_types').update(updatePayload).eq('id', editingId)
                if (error) throw new Error(error.message)
                setEditingId(null)
                onUpdate()
            }

        } catch (error: any) {
            alert('Kaydetme hatası: ' + (error.message || error))
        } finally {
            setSaving(false)
        }
    }

    const addNew = async () => {
        if (!newForm.name.trim()) {
            alert('Diyet türü adı gerekli')
            return
        }
        setSaving(true)

        const keywordsData = fromRichTags(newForm.banned_keywords)
        const tagsData = fromRichTags(newForm.banned_tags)
        const mergedDetails = { ...keywordsData.details, ...tagsData.details }

        const { error } = await supabase.from('diet_types').insert({
            patient_id: patientId || null,
            name: newForm.name,
            abbreviation: newForm.abbreviation || newForm.name.charAt(0).toUpperCase(),
            description: newForm.description,
            carb_factor: newForm.carb_factor,
            protein_factor: newForm.protein_factor,
            fat_factor: newForm.fat_factor,
            allowed_tags: newForm.allowed_tags,
            banned_keywords: keywordsData.items,
            banned_tags: tagsData.items,
            banned_details: mergedDetails
        })

        if (error) alert('Ekleme hatası: ' + error.message)
        else {
            setNewForm({
                name: '', abbreviation: '', description: '',
                carb_factor: 1.0, protein_factor: 1.0, fat_factor: 1.0,
                allowed_tags: [], banned_keywords: [], banned_tags: []
            })
            setIsAdding(false)
            onUpdate()
        }
        setSaving(false)
    }

    const deleteDietType = async (id: string, name: string) => {
        if (!confirm(`"${name}" diyet türünü silmek istediğinize emin misiniz?`)) return
        setSaving(true)
        const { error } = await supabase.from('diet_types').delete().eq('id', id)
        if (error) alert('Silme hatası: ' + error.message)
        else onUpdate()
    }

    const handleReset = async (dt: any) => {
        if (!confirm(`"${dt.name}" için yaptığınız özelleştirmeler silinecek ve orijinal Global ayarlara dönülecek. Onaylıyor musunuz?`)) return

        // 1. Revert weeks to parent ID
        const { error: updateError } = await supabase
            .from('diet_weeks')
            .update({ assigned_diet_type_id: dt.parent_diet_type_id })
            .eq('assigned_diet_type_id', dt.id)

        if (updateError) {
            alert('Hata (Haftaları güncelleme): ' + updateError.message)
            return
        }

        // 2. Delete the custom override
        const { error: deleteError } = await supabase
            .from('diet_types')
            .delete()
            .eq('id', dt.id)

        if (deleteError) {
            alert('Hata (Özelleştirmeyi silme): ' + deleteError.message)
        } else {
            onUpdate()
        }
    }

    return (
        <div className="space-y-4">
            {/* Add Button */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                    {patientId ? 'Bu hastaya özel veya genel diyet türlerini yönetin' : 'Sistem genelindeki diyet türlerini yönetin'}
                </p>
                <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus size={14} className="mr-1" /> {patientId ? 'Hastaya Özel Ekle' : 'Yeni Ekle'}
                </Button>
            </div>

            {/* New Diet Type Form */}
            {isAdding && (
                <div className={`border rounded-lg p-4 space-y-3 ${patientId ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                    <h4 className="font-medium text-sm flex items-center gap-2">
                        {patientId ? <span className="text-[10px] bg-amber-200 px-1 rounded text-amber-800">Kişisel</span> : <span className="text-[10px] bg-blue-200 px-1 rounded text-blue-800">Global</span>}
                        Yeni Diyet Türü
                    </h4>
                    {/* ... (inputs same as before) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs">Adı *</Label>
                            <Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="ör: Eliminasyonlu Ketojenik" />
                        </div>
                        <div>
                            <Label className="text-xs">Kısaltma</Label>
                            <Input value={newForm.abbreviation} onChange={e => setNewForm({ ...newForm, abbreviation: e.target.value })} placeholder="ör: EK" maxLength={3} />
                        </div>
                    </div>
                    <div>
                        <Label className="text-xs">Açıklama</Label>
                        <Input value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} placeholder="Kısa açıklama..." />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <Label className="text-xs">Karb Katsayısı</Label>
                            <Input type="number" step="0.1" value={newForm.carb_factor} onChange={e => setNewForm({ ...newForm, carb_factor: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <Label className="text-xs">Protein Katsayısı</Label>
                            <Input type="number" step="0.1" value={newForm.protein_factor} onChange={e => setNewForm({ ...newForm, protein_factor: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div>
                            <Label className="text-xs">Yağ Katsayısı</Label>
                            <Input type="number" step="0.1" value={newForm.fat_factor} onChange={e => setNewForm({ ...newForm, fat_factor: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs mb-1 block">Uyumlu Diyet Etiketleri</Label>
                        <div className="flex flex-wrap gap-2">
                            {uniqueTags.length > 0 ? uniqueTags.map(tag => (
                                <div key={tag.id}
                                    className={`text-[10px] px-2 py-1 rounded cursor-pointer border ${newForm.allowed_tags.includes(tag.id) ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}
                                    onClick={() => toggleTag(tag.id, false)}
                                >
                                    {tag.label}
                                </div>
                            )) : <span className="text-[10px] text-gray-400">Tanımlı başka diyet yok</span>}
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs">Yasaklı Kelimeler (Yemek İsminde Geçen)</Label>
                        <RichTagInput
                            placeholder="ör: Şeker; Uyarı Mesajı; Ekstra Bilgi (Enter ile ekle)"
                            value={newForm.banned_keywords}
                            onChange={(val) => setNewForm({ ...newForm, banned_keywords: val })}
                        />
                        <p className="text-[9px] text-gray-400 mt-0.5">Format: <b>Kelime; Uyarı; Bilgi</b> şeklinde yapıştırabilirsiniz.</p>
                    </div>
                    <div>
                        <Label className="text-xs">Yasaklı Tagler (Yemek İçeriği)</Label>
                        <RichTagInput
                            placeholder="ör: Gluten; Çölyak Riski; (Enter ile ekle)"
                            value={newForm.banned_tags}
                            onChange={(val) => setNewForm({ ...newForm, banned_tags: val })}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" onClick={addNew} disabled={saving}>Kaydet</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>İptal</Button>
                    </div>
                </div>
            )}

            {/* Diet Types List */}
            <div className="space-y-2">
                {dietTypes.filter(dt => {
                    // Filter Logic:
                    // 1. If it's a patient-specific type, always show it.
                    if (dt.patient_id) return true

                    // 2. If it's a Global type, checking if it is overridden by a specific type for this patient.
                    // (i.e., is there any other type in the list that has parent_diet_type_id === this.id)
                    const isOverridden = dietTypes.some(other => other.parent_diet_type_id === dt.id)
                    // If overridden, HIDE the global origin (so user only sees the customized version)
                    if (isOverridden) return false

                    return true
                }).map(dt => (
                    <div key={dt.id} className={`border rounded-lg p-3 ${editingId === dt.id ? 'bg-yellow-50 border-yellow-200' : (dt.patient_id ? 'bg-amber-50/50 border-amber-100' : 'bg-white')}`}>
                        {editingId === dt.id ? (
                            <div className="space-y-3">
                                {/* Edit Mode */}
                                {patientId && !dt.patient_id && (
                                    <div className="text-xs bg-blue-100 text-blue-700 p-2 rounded flex items-center gap-2">
                                        <span className="font-bold">Bilgi:</span> Bu genel şablonu düzenliyorsunuz. Kaydettiğinizde kişisel bir kopya oluşturulacak.
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs">Adı</Label>
                                        <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Kısaltma</Label>
                                        <Input value={editForm.abbreviation} onChange={e => setEditForm({ ...editForm, abbreviation: e.target.value })} maxLength={3} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Açıklama</Label>
                                    <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <Label className="text-xs">Karb</Label>
                                        <Input type="number" step="0.1" value={editForm.carb_factor} onChange={e => setEditForm({ ...editForm, carb_factor: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Prot</Label>
                                        <Input type="number" step="0.1" value={editForm.protein_factor} onChange={e => setEditForm({ ...editForm, protein_factor: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Yağ</Label>
                                        <Input type="number" step="0.1" value={editForm.fat_factor} onChange={e => setEditForm({ ...editForm, fat_factor: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                { /* Tags & Keywords inputs... simplified reuse */}
                                <div>
                                    <Label className="text-xs mb-1 block">Uyumlu Diyet Etiketleri</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {uniqueTags.map(tag => (
                                            <div key={tag.id} className={`text-[9px] px-2 py-1 cursor-pointer border rounded ${editForm.allowed_tags?.includes(tag.id) ? 'bg-green-100 border-green-300' : 'bg-white'}`} onClick={() => toggleTag(tag.id, true)}>{tag.label}</div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Yasaklı Kelimeler (Yemek İsminde Geçen)</Label>
                                    <RichTagInput
                                        placeholder="ör: Şeker; Uyarı; Bilgi (Enter ile ekle)"
                                        value={editForm.banned_keywords}
                                        onChange={(val) => setEditForm({ ...editForm, banned_keywords: val })}
                                    />
                                    <p className="text-[9px] text-gray-400 mt-0.5">Format: <b>Kelime; Uyarı; Bilgi</b> şeklinde yapıştırabilirsiniz.</p>
                                </div>
                                <div>
                                    <Label className="text-xs">Yasaklı Tagler (Yemek İçeriği)</Label>
                                    <RichTagInput
                                        placeholder="ör: Gluten; Uyarı; Bilgi (Enter ile ekle)"
                                        value={editForm.banned_tags}
                                        onChange={(val) => setEditForm({ ...editForm, banned_tags: val })}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button size="sm" onClick={saveEdit} disabled={saving}>Kaydet</Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>İptal</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{dt.name}</span>
                                        <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{dt.abbreviation}</span>
                                        {dt.patient_id ? (
                                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1 rounded border border-amber-200">Kişisel</span>
                                        ) : (
                                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">Global</span>
                                        )}
                                    </div>
                                    {dt.description && <p className="text-xs text-gray-500">{dt.description}</p>}
                                    <div className="text-[10px] text-gray-400 mt-1 flex gap-3">
                                        <span className="font-mono text-gray-600">K:{dt.carb_factor} P:{dt.protein_factor} Y:{dt.fat_factor}</span>
                                    </div>
                                    {/* Show tags summary */}
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {dt.allowed_tags && dt.allowed_tags.length > 0 && dt.allowed_tags.map((t: string) => (
                                            <span key={t} className="text-[9px] bg-green-50 text-green-600 px-1 rounded border border-green-100">
                                                {uniqueTags.find(tag => tag.id === t)?.label || t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {dt.parent_diet_type_id && (
                                        <Button size="sm" variant="ghost" className="text-amber-500 hover:text-amber-700" onClick={() => handleReset(dt)} title="Fabrika Ayarlarına Dön (Global'e Sıfırla)">
                                            <RotateCcw size={14} />
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => startEdit(dt)}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteDietType(dt.id, dt.name)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {
                dietTypes.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        Henüz diyet türü tanımlanmamış
                    </div>
                )
            }
        </div >
    )
}
