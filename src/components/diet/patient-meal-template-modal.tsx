"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, Clock, Utensils } from "lucide-react"
import { cn } from "@/lib/utils"

interface PatientMealTemplateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentMealTypes: string[]
    onApply: (mealTypes: string[]) => void
}

const mealTemplates = [
    {
        id: "3_main_1_snack",
        name: "Standart (3 Ana, 1 Ara)",
        description: "En yaygın kullanılan düzen",
        mealTypes: ['KAHVALTI', 'ÖĞLE', 'AKŞAM', 'ARA ÖĞÜN'],
        icon: <Utensils className="w-5 h-5" />
    },
    {
        id: "2_main_2_snack",
        name: "2 Ana, 2 Ara Öğün",
        description: "Aralıklı beslenenler için ideal (Örn: Geç kahvaltı)",
        mealTypes: ['GEÇ KAHVALTI', 'ARA ÖĞÜN 1', 'AKŞAM', 'ARA ÖĞÜN 2'],
        icon: <Clock className="w-5 h-5" />
    },
    {
        id: "3_main",
        name: "3 Ana Öğün",
        description: "Ara öğün sevmeyenler için",
        mealTypes: ['KAHVALTI', 'ÖĞLE', 'AKŞAM'],
        icon: <Utensils className="w-5 h-5" />
    },
    {
        id: "2_main",
        name: "2 Ana Öğün (Aralıklı Oruç)",
        description: "Sadece iki ana öğün",
        mealTypes: ['İLK ÖĞÜN', 'İKİNCİ ÖĞÜN'],
        icon: <Clock className="w-5 h-5" />
    },
    {
        id: "3_main_2_snack",
        name: "Sık Sık Yiyenler",
        description: "3 Ana ve 2 Ara öğün düzeni",
        mealTypes: ['KAHVALTI', 'ARA ÖĞÜN 1', 'ÖĞLE', 'ARA ÖĞÜN 2', 'AKŞAM'],
        icon: <Utensils className="w-5 h-5" />
    },
]

export function PatientMealTemplateModal({ open, onOpenChange, currentMealTypes, onApply }: PatientMealTemplateModalProps) {
    // Find initial matching template, or default to custom
    const initialMatch = mealTemplates.find(t => JSON.stringify(t.mealTypes) === JSON.stringify(currentMealTypes))
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(initialMatch?.id || "3_main_1_snack")

    function handleApply() {
        if (!selectedTemplate) return
        const template = mealTemplates.find(t => t.id === selectedTemplate)
        if (template) {
            onApply(template.mealTypes)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-6">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-xl text-center">Öğün Düzeni Seçimi</DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        Size en uygun günlük öğün yapısını seçin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1 py-1">
                    {mealTemplates.map(template => (
                        <div
                            key={template.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer relative",
                                selectedTemplate === template.id
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                    : "border-gray-100 hover:border-emerald-200 bg-white"
                            )}
                            onClick={() => setSelectedTemplate(template.id)}
                        >
                            <div className={cn(
                                "p-2 rounded-full",
                                selectedTemplate === template.id ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
                            )}>
                                {template.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm">{template.name}</h4>
                                <p className={cn("text-xs mt-1", selectedTemplate === template.id ? "text-emerald-700" : "text-gray-500")}>
                                    {template.description}
                                </p>
                            </div>
                            {selectedTemplate === template.id && (
                                <div className="absolute top-4 right-4">
                                    <Check className="w-5 h-5 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <DialogFooter className="mt-4 sm:justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleApply}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={!selectedTemplate}
                    >
                        Değişikliği Uygula
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
