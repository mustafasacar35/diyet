"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, Trash2, Check, Plus, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type MealTemplate = {
    id: string
    name: string
    meal_types: string[]
}

interface MealTemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentMealTypes: string[]
    onApply: (types: string[]) => void
}

export function MealTemplateDialog({ open, onOpenChange, currentMealTypes, onApply }: MealTemplateDialogProps) {
    const [templates, setTemplates] = useState<MealTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    // Create Template State
    const [isCreating, setIsCreating] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            fetchTemplates()
        }
    }, [open])

    async function fetchTemplates() {
        setLoading(true)
        const { data, error } = await supabase
            .from('meal_templates')
            .select('*')
            .order('name', { ascending: true })

        if (data) {
            setTemplates(data)
        }
        setLoading(false)
    }

    async function handleSaveTemplate() {
        if (!newTemplateName.trim()) return

        setSaving(true)
        const { data, error } = await supabase
            .from('meal_templates')
            .insert([{
                name: newTemplateName,
                meal_types: currentMealTypes
            }])
            .select()
            .single()

        if (data) {
            setTemplates([...templates, data])
            setNewTemplateName("")
            setIsCreating(false)
        }
        setSaving(false)
    }

    async function handleDeleteTemplate(id: string, e: React.MouseEvent) {
        e.stopPropagation()
        if (!confirm("Bu şablonu silmek istediğinize emin misiniz?")) return

        const { error } = await supabase.from('meal_templates').delete().eq('id', id)
        if (!error) {
            setTemplates(templates.filter(t => t.id !== id))
            if (selectedTemplateId === id) setSelectedTemplateId(null)
        }
    }

    function handleApply() {
        const template = templates.find(t => t.id === selectedTemplateId)
        if (template) {
            onApply(template.meal_types)
            onOpenChange(false)
        }
    }

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0">
                <div className="px-6 py-4 border-b shrink-0 flex justify-between items-center">
                    <DialogHeader className="m-0">
                        <DialogTitle>Öğün Şablonları</DialogTitle>
                    </DialogHeader>
                    {!isCreating ? (
                        <Button size="sm" onClick={() => setIsCreating(true)}>
                            <Plus size={16} className="mr-2" /> Mevcut Düzeni Kaydet
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Şablon adı..."
                                value={newTemplateName}
                                onChange={e => setNewTemplateName(e.target.value)}
                                className="h-8 w-48"
                            />
                            <Button size="sm" onClick={handleSaveTemplate} disabled={saving || !newTemplateName}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>İptal</Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar: List */}
                    <div className="w-1/3 border-r flex flex-col bg-gray-50/50">
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                                <Input
                                    placeholder="Şablon ara..."
                                    className="pl-8 h-9 text-sm"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {loading ? (
                                    <div className="text-center py-8 text-gray-500 text-xs">Yükleniyor...</div>
                                ) : filteredTemplates.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 text-xs">Şablon bulunamadı.</div>
                                ) : (
                                    filteredTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            className={cn(
                                                "group flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-white hover:shadow-sm transition-all border border-transparent",
                                                selectedTemplateId === template.id ? "bg-white shadow-sm border-gray-200 font-medium text-blue-600" : "text-gray-600"
                                            )}
                                            onClick={() => setSelectedTemplateId(template.id)}
                                        >
                                            <span className="truncate">{template.name}</span>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 rounded transition-opacity"
                                                onClick={(e) => handleDeleteTemplate(template.id, e)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Content: Preview */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {selectedTemplate ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">{selectedTemplate.name}</h3>
                                    <p className="text-sm text-gray-500">Bu şablon uygulandığında aşağıdaki öğün yapısı geçerli olacak:</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        {selectedTemplate.meal_types.map((type, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-gray-700">{type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Grid3X3 size={24} className="opacity-50" />
                                </div>
                                <p>Detayları görmek için<br />soldan bir şablon seçin.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button
                        onClick={handleApply}
                        disabled={!selectedTemplate}
                        className="w-32"
                    >
                        <Check size={16} className="mr-2" /> Uygula
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Grid3X3({ size, className }: { size: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M3 9h18" />
            <path d="M3 15h18" />
            <path d="M9 3v18" />
            <path d="M15 3v18" />
        </svg>
    )
}
