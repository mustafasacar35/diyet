"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface MockFood {
    id: string
    name: string
    calories: number
    protein: number
    carbs: number
    fats: number
    unit: string
    amount: number
}

// Mock alternatives database
const mockAlternatives: Record<string, MockFood[]> = {
    "yumurta": [
        { id: "alt-1", name: "Menemen", calories: 180, protein: 10, carbs: 8, fats: 12, unit: "porsiyon", amount: 1 },
        { id: "alt-2", name: "Peynirli Omlet", calories: 210, protein: 14, carbs: 2, fats: 16, unit: "porsiyon", amount: 1 },
        { id: "alt-3", name: "Haşlanmış Yumurta (Büyük)", calories: 155, protein: 13, carbs: 1, fats: 11, unit: "adet", amount: 2 },
    ],
    "ekmek": [
        { id: "alt-4", name: "Yulaf Lapası", calories: 150, protein: 5, carbs: 27, fats: 3, unit: "kase", amount: 1 },
        { id: "alt-5", name: "Wasa", calories: 35, protein: 1, carbs: 7, fats: 0, unit: "dilim", amount: 2 },
    ],
    "peynir": [
        { id: "alt-6", name: "Lor Peyniri", calories: 40, protein: 8, carbs: 1, fats: 0, unit: "kaşık", amount: 3 },
        { id: "alt-7", name: "Kaşar Peyniri", calories: 110, protein: 7, carbs: 0, fats: 9, unit: "dilim", amount: 2 },
    ]
}

interface MealSwapSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    foodName: string // The food we want to swap
    onSwap: (newFood: MockFood) => void
}

export function MealSwapSheet({ open, onOpenChange, foodName, onSwap }: MealSwapSheetProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // Simple keyword matching for mock data
    const key = Object.keys(mockAlternatives).find(k => foodName.toLowerCase().includes(k))
    const alternatives = key ? mockAlternatives[key] : []

    const handleSelect = (food: MockFood) => {
        setSelectedId(food.id)
        // Simulate network delay
        setTimeout(() => {
            onSwap(food)
            onOpenChange(false)
            setSelectedId(null)
        }, 500)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[80vh] sm:h-full sm:w-[400px] sm:side-right rounded-t-2xl sm:rounded-none">
                <SheetHeader className="text-left mb-4">
                    <SheetTitle>Alternatif Seçimi</SheetTitle>
                    <SheetDescription>
                        {foodName} yerine seçebileceğiniz alternatifler:
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100%-100px)] pr-4">
                    <div className="space-y-3">
                        {alternatives.length > 0 ? alternatives.map((alt) => (
                            <div
                                key={alt.id}
                                onClick={() => handleSelect(alt)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer",
                                    selectedId === alt.id
                                        ? "border-green-600 bg-green-50"
                                        : "border-gray-100 bg-white hover:border-green-200"
                                )}
                            >
                                <div>
                                    <div className="font-semibold text-gray-900">{alt.name}</div>
                                    <div className="text-sm text-gray-500">{alt.amount} {alt.unit}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1 text-sm font-bold text-orange-600">
                                        <Flame className="h-3 w-3" />
                                        {alt.calories}
                                    </div>
                                    {selectedId === alt.id && (
                                        <span className="flex items-center text-xs text-green-700 font-medium">
                                            <Check className="h-3 w-3 mr-1" /> Seçildi
                                        </span>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>Bu besin için uygun alternatif bulunamadı.</p>
                                <p className="text-xs mt-2 text-gray-400">Diyetisyeniniz henüz alternatif tanımlamamış olabilir.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
