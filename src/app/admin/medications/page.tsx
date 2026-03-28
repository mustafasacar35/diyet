'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Pencil, Trash2, Loader2, Search, AlertTriangle, Shield, Heart, Info, ClipboardCopy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { RichTagInput, RichTag } from "@/components/ui/rich-tag-input"

type Medication = {
    id: string
    name: string
    generic_name: string | null
    category: string | null
    description: string | null
}

type InteractionRule = {
    id: string
    rule_type: 'negative' | 'warning' | 'positive'
    keyword: string
    match_name: boolean
    match_tags: boolean
    notes: string | null
}

type KeywordEntry = {
    keyword: string
    match_type: 'name' | 'tag' | 'both'
    warning?: string
    info?: string
}

const MEDICATION_CATEGORIES = [
    'Analjezikler',
    'Antibiyotikler',
    'Antikoagülanlar',
    'Antidepresanlar',
    'Kalp ve Damar İlaçları',
    'Diyabet İlaçları',
    'Mide İlaçları',
    'Vitaminler ve Mineraller',
    'Diğer'
]

export default function MedicationsPage() {
    const [medications, setMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Dialog State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
    const [formData, setFormData] = useState<Omit<Medication, 'id'>>({
        name: '',
        generic_name: '',
        category: '',
        description: ''
    })

    // Interaction Rules State
    const [interactionRules, setInteractionRules] = useState<InteractionRule[]>([])
    const [selectedRuleType, setSelectedRuleType] = useState<'negative' | 'warning' | 'positive'>('negative')
    const [ruleNotes, setRuleNotes] = useState('')

    // RichTagInput state
    const [newKeywords, setNewKeywords] = useState<KeywordEntry[]>([])
    // const [currentKeyword, setCurrentKeyword] = useState('') // Removed as RichTagInput handles internal state
    const [currentMatchType, setCurrentMatchType] = useState<'name' | 'tag' | 'both'>('both')

    // AI State
    const [aiLoading, setAiLoading] = useState(false)

    useEffect(() => {
        loadMedications()
        // Check if Gemini API key is configured (optional: could check via a server action or just let it fail gracefully)
    }, [])

    const loadMedications = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('medications')
            .select('*')
            .order('name')

        if (error) {
            console.error('Error loading medications:', error)
            alert('İlaçlar yüklenirken hata oluştu: ' + error.message)
        } else {
            setMedications(data || [])
        }
        setLoading(false)
    }

    const openAddDialog = () => {
        setEditingMedication(null)
        setFormData({
            name: '',
            generic_name: '',
            category: '',
            description: ''
        })
        setInteractionRules([])
        setNewKeywords([])
        setRuleNotes('')
        setSelectedRuleType('negative')
        setIsAddDialogOpen(true)
    }

    const openEditDialog = async (medication: Medication) => {
        setEditingMedication(medication)
        setFormData({
            name: medication.name,
            generic_name: medication.generic_name || '',
            category: medication.category || '',
            description: medication.description || ''
        })
        setNewKeywords([])
        setRuleNotes('')
        setSelectedRuleType('negative')
        await loadInteractionRules(medication.id)
        setIsAddDialogOpen(true)
    }

    const loadInteractionRules = async (medicationId: string) => {
        const { data, error } = await supabase
            .from('medication_interactions')
            .select('*')
            .eq('medication_id', medicationId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error loading rules:', error)
        } else {
            setInteractionRules(data || [])
        }
    }

    const saveMedication = async () => {
        if (!formData.name) {
            alert('Lütfen ilaç adını girin.')
            return
        }

        let medicationId = editingMedication?.id

        if (editingMedication) {
            // Update
            const { error } = await supabase
                .from('medications')
                .update(formData)
                .eq('id', editingMedication.id)

            if (error) {
                alert('Güncelleme hatası: ' + error.message)
                return
            }
        } else {
            // Create
            const { data, error } = await supabase
                .from('medications')
                .insert(formData)
                .select()
                .single()

            if (error) {
                alert('Kaydetme hatası: ' + error.message)
                return
            }
            medicationId = data.id
            setEditingMedication(data) // Switch to edit mode after save
        }

        await loadMedications()

        // If we just created, keep dialog open to add rules
        if (!editingMedication) {
            // alert('İlaç kaydedildi. Şimdi etkileşim kurallarını ekleyebilirsiniz.')
            // Don't close dialog
        } else {
            setIsAddDialogOpen(false)
        }
    }

    const deleteMedication = async (id: string) => {
        if (!confirm('Bu ilacı silmek istediğinizden emin misiniz?')) return

        const { error } = await supabase
            .from('medications')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Hata: ' + error.message)
            return
        }

        await loadMedications()
    }

    // Add multiple rules via Chips
    const addInteractionRulesFromChips = async () => {
        if (!editingMedication) {
            alert('Önce ilacı kaydetmelisiniz (veya düzenleme modunda olmalısınız).')
            return
        }
        if (newKeywords.length === 0) {
            alert('En az bir anahtar kelime ekleyin')
            return
        }

        const inserts = newKeywords.map(k => {
            // Combine global notes with specific parsed notes (warning/info)
            let combinedNotes = ruleNotes.trim()
            const specificNotes = [k.warning, k.info].filter(Boolean).join('\n\n')

            if (specificNotes) {
                combinedNotes = combinedNotes ? `${combinedNotes}\n\n${specificNotes}` : specificNotes
            }

            return {
                medication_id: editingMedication.id,
                rule_type: selectedRuleType,
                keyword: k.keyword.trim().toLowerCase(),
                match_name: k.match_type === 'name' || k.match_type === 'both',
                match_tags: k.match_type === 'tag' || k.match_type === 'both',
                notes: combinedNotes || null
            }
        })

        const { error } = await supabase
            .from('medication_interactions')
            .insert(inserts)

        if (error) {
            alert('Hata: ' + error.message)
            return
        }

        await loadInteractionRules(editingMedication.id)
        setNewKeywords([])
        setRuleNotes('')
    }

    const deleteInteractionRule = async (ruleId: string) => {
        const { error } = await supabase
            .from('medication_interactions')
            .delete()
            .eq('id', ruleId)

        if (error) {
            alert('Hata: ' + error.message)
            return
        }

        if (editingMedication) {
            await loadInteractionRules(editingMedication.id)
        }
    }

    const autoFillWithAI = async () => {
        if (!formData.name.trim()) {
            alert('Lütfen önce ilaç adını girin.')
            return
        }

        setAiLoading(true)
        try {
            const response = await fetch('/api/ai/medication-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicationName: formData.name })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'AI yanıtı başarısız')
            }

            // Fill form data
            setFormData(prev => ({
                ...prev,
                name: data.name || prev.name,
                generic_name: data.generic_name || '',
                category: data.category || '',
                description: data.description || ''
            }))

            if (data.interaction_rules && Array.isArray(data.interaction_rules)) {
                // Map AI rules to KeywordEntry for preview/adding
                // Note: Since `newKeywords` expects user to ADD them via button, 
                // we populate `newKeywords` so user can review and click "Add Rule".
                // However, we need to handle mixed rule types.
                // The current UI assumes ONE `selectedRuleType` for the batch.
                // The AI returns mixed types.
                // We will just show a message or maybe populate `newKeywords` and force user to review.
                // For now, simple Alert is safer than complex logic.
                alert('AI tarafından bilgiler dolduruldu: ' + data.name + '\n(Etkileşim kuralları şu an için otomatik eklenmiyor, sadece detaylar.)')
            }

        } catch (error: any) {
            alert('AI Hatası: ' + error.message)
        } finally {
            setAiLoading(false)
        }
    }

    const filteredMedications = medications.filter(med =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getRuleIcon = (type: string) => {
        switch (type) {
            case 'negative': return <Shield className="h-4 w-4 text-red-600" />
            case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />
            case 'positive': return <Heart className="h-4 w-4 text-green-600" />
            default: return null
        }
    }

    const getRuleBadgeVariant = (type: string) => {
        switch (type) {
            case 'negative': return 'destructive'
            case 'warning': return 'outline'
            case 'positive': return 'default'
            default: return 'secondary'
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">İlaç Yönetimi</h1>
                    <p className="text-muted-foreground">Global ilaç veritabanı ve etkileşim kuralları</p>
                </div>
                <Button onClick={openAddDialog} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni İlaç Ekle
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="İlaç adı, etken madde veya kategori ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>İlaç Adı</TableHead>
                                <TableHead>Etken Madde</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead className="text-center">Etkileşim</TableHead>
                                <TableHead className="text-right">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMedications.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                        İlaç bulunamadı
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMedications.map((med) => (
                                    <TableRow key={med.id}>
                                        <TableCell className="font-medium">{med.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{med.generic_name || '-'}</TableCell>
                                        <TableCell>
                                            {med.category ? (
                                                <Badge variant="outline">{med.category}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(med)}
                                            >
                                                Kuralları Gör
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => openEditDialog(med)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteMedication(med.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingMedication ? 'İlaç Düzenle' : 'Yeni İlaç Ekle'}
                        </DialogTitle>
                        <DialogDescription>
                            İlaç bilgilerini ve etkileşim kurallarını ayarlayın
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="info" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="info">İlaç Bilgileri</TabsTrigger>
                            <TabsTrigger value="interactions" disabled={!editingMedication}>
                                Etkileşim Kuralları
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Info */}
                        <TabsContent value="info" className="space-y-4 mt-4">
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        İlaç Adı *
                                    </Label>
                                    <div className="col-span-3 flex gap-2">
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="col-span-3"
                                            placeholder="Örn: Coumadin"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={autoFillWithAI}
                                            disabled={aiLoading || !formData.name}
                                            title="Yapay Zeka ile Doldur"
                                            className="shrink-0 text-purple-600 border-purple-200 hover:bg-purple-50"
                                        >
                                            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-lg">✨</span>}
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="generic_name" className="text-right">
                                        Etken Madde
                                    </Label>
                                    <Input
                                        id="generic_name"
                                        value={formData.generic_name || ''}
                                        onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Örn: Warfarin"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <Select
                                        value={formData.category || ''}
                                        onValueChange={(val) => setFormData({ ...formData, category: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Kategori seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MEDICATION_CATEGORIES.map((cat) => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea
                                        placeholder="İlaç hakkında notlar..."
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab: Interactions */}
                        <TabsContent value="interactions" className="space-y-6 mt-4">
                            {/* Add Rule Form */}
                            <div className="border rounded-lg p-4 bg-slate-50 space-y-4">
                                <h4 className="font-semibold flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Yeni Kural Ekle
                                </h4>

                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Kural Tipi</Label>
                                        <RadioGroup
                                            value={selectedRuleType}
                                            onValueChange={(val: any) => setSelectedRuleType(val)}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="negative" id="neg" />
                                                <Label htmlFor="neg" className="flex items-center gap-2 cursor-pointer">
                                                    <Shield className="h-4 w-4 text-red-600" />
                                                    Yasaklı
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="warning" id="warn" />
                                                <Label htmlFor="warn" className="flex items-center gap-2 cursor-pointer">
                                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                                    Uyarı
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="positive" id="pos" />
                                                <Label htmlFor="pos" className="flex items-center gap-2 cursor-pointer">
                                                    <Heart className="h-4 w-4 text-green-600" />
                                                    Önerilen
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Anahtar Kelimeler (Chips)</Label>
                                            <RichTagInput
                                                placeholder="Örn: greyfurt veya yapıştırın: 'Ispanak; Uyarı metni; Öneri metni'"
                                                value={newKeywords.map(k => ({
                                                    text: k.keyword,
                                                    match_name: k.match_type === 'name' || k.match_type === 'both',
                                                    match_tags: k.match_type === 'tag' || k.match_type === 'both',
                                                    warning: k.warning,
                                                    info: k.info
                                                }))}
                                                onChange={(tags) => {
                                                    // Full sync from RichTagInput to updated schema
                                                    const updated: KeywordEntry[] = tags.map(t => ({
                                                        keyword: t.text,
                                                        match_type: (t.match_name && t.match_tags) ? 'both' : (t.match_name ? 'name' : 'tag'),
                                                        warning: t.warning,
                                                        info: t.info
                                                    }))
                                                    setNewKeywords(updated)
                                                }}
                                                defaultMatchName={currentMatchType === 'both' || currentMatchType === 'name'}
                                                defaultMatchTags={currentMatchType === 'both' || currentMatchType === 'tag'}
                                                showMatchScope={true}
                                            />
                                            <div className="flex items-center gap-4 mt-2 text-sm">
                                                <span className="text-muted-foreground">Kapsam:</span>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={currentMatchType === 'both'}
                                                        onChange={() => setCurrentMatchType('both')}
                                                    />
                                                    İsim + Etiket
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={currentMatchType === 'name'}
                                                        onChange={() => setCurrentMatchType('name')}
                                                    />
                                                    Sadece İsim
                                                </label>
                                                <label className="flex items-center gap-1 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        checked={currentMatchType === 'tag'}
                                                        onChange={() => setCurrentMatchType('tag')}
                                                    />
                                                    Sadece Etiket
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Enter ile ekleyin veya Excel/Metin'den çoklu yapıştırın.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Notlar (Opsiyonel)</Label>
                                            <Input
                                                placeholder="Örn: CYP3A4 enzimini bloke eder"
                                                value={ruleNotes}
                                                onChange={(e) => setRuleNotes(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={addInteractionRulesFromChips} className="w-full" disabled={newKeywords.length === 0}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        {newKeywords.length > 0 ? `${newKeywords.length} Kuralı Ekle` : 'Kural Ekle'}
                                    </Button>
                                </div>
                            </div>

                            {/* Existing Rules */}
                            <div>
                                <h4 className="font-semibold mb-3 flex items-center justify-between">
                                    <span>Mevcut Kurallar</span>
                                    <Badge variant="secondary">{interactionRules.length}</Badge>
                                </h4>
                                {interactionRules.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>Henüz etkileşim kuralı eklenmemiş</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {interactionRules.map((rule) => (
                                            <div
                                                key={rule.id}
                                                className="flex items-start justify-between border rounded p-3 hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-1">{getRuleIcon(rule.rule_type)}</div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge variant={getRuleBadgeVariant(rule.rule_type)} className="text-sm">
                                                                {rule.keyword}
                                                            </Badge>
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 border">
                                                                {rule.match_name && rule.match_tags ? 'İsim + Tag' :
                                                                    rule.match_name ? 'Sadece İsim' :
                                                                        rule.match_tags ? 'Sadece Tag' : 'Kapsam Yok'}
                                                            </span>
                                                        </div>
                                                        {rule.notes && (
                                                            <p className="text-xs text-muted-foreground mt-1 bg-slate-100/50 p-1 rounded">
                                                                {rule.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => deleteInteractionRule(rule.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Kapat
                        </Button>
                        <Button onClick={saveMedication}>
                            {editingMedication ? 'İlacı Güncelle' : 'İlacı Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
