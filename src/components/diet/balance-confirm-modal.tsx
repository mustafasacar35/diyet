'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, ArrowRight } from 'lucide-react'

export interface BalanceChange {
    id: string; // Unique ID for the change
    type: 'portion' | 'swap' | 'add' | 'remove';
    foodId?: string;
    foodName: string;
    detail: string;
    slotName?: string;
    diffCals: number;
    diffProt: number;
    diffFat: number;
    diffCarbs: number;
    originalMultiplier?: number;
    newMultiplier?: number;
    newFood?: any;
    // Weekly metadata
    dayName?: string;
    // Tiered recommendations logic
    isAlternative?: boolean;
}

interface BalanceConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (approvedChanges: BalanceChange[]) => void;
    title: string;
    initialTotals: {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
    };
    targetMacros: {
        calories: number;
        protein: number;
        fat: number;
        carbs: number;
    };
    changes: BalanceChange[];
}

export function BalanceConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    initialTotals,
    targetMacros,
    changes
}: BalanceConfirmModalProps) {
    const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set())

    // Initialize all primary changes as selected when modal opens
    useEffect(() => {
        if (isOpen && changes) {
            setSelectedChanges(new Set(changes.filter(c => !c.isAlternative).map(c => c.id)))
        }
    }, [isOpen, changes])

    const handleToggle = (id: string) => {
        const next = new Set(selectedChanges)
        if (next.has(id)) {
            next.delete(id)
        } else {
            next.add(id)
        }
        setSelectedChanges(next)
    }

    // Calculate dynamic totals based on selected changes
    const currentTotals = { ...initialTotals }
    changes.forEach(c => {
        if (selectedChanges.has(c.id)) {
            currentTotals.calories += c.diffCals
            currentTotals.protein += c.diffProt
            currentTotals.fat += c.diffFat
            currentTotals.carbs += c.diffCarbs
        }
    })

    const calcPct = (val: number, target: number) => {
        if (!target || target <= 0) return 0
        return Math.round((val / target) * 100)
    }

    const renderMacroRow = (label: string, initialVal: number, currentVal: number, target: number) => {
        const initialPct = calcPct(initialVal, target)
        const currentPct = calcPct(currentVal, target)
        const displayInitial = Math.round(initialVal)
        const displayCurrent = Math.round(currentVal)
        const displayTarget = Math.round(target)
        
        return (
            <div className="flex flex-col py-0.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                    <span className="font-bold text-slate-700 w-12 sm:w-16 truncate">{label}:</span>
                    <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
                        <span className="text-slate-500 font-medium truncate">{displayInitial}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-300 shrink-0" />
                        <span className="font-bold text-slate-800 truncate">{displayCurrent}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 w-14 sm:w-16 text-right truncate">
                        Hd: {displayTarget}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-8 text-[9px] text-slate-400 text-right">% {initialPct}</div>
                    <div className="flex-1 relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        {/* Initial Progress Bar */}
                        <div 
                            className="absolute top-0 left-0 h-full bg-slate-300 opacity-50" 
                            style={{ width: `${Math.min(100, initialPct)}%` }} 
                        />
                        {/* Current Progress Bar */}
                        <div 
                            className={`absolute top-0 left-0 h-full transition-all duration-300 ${currentPct >= 90 && currentPct <= 110 ? 'bg-emerald-500' : currentPct > 110 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, currentPct)}%` }} 
                        />
                    </div>
                    <div className={`w-8 text-[9px] font-bold text-right ${currentPct >= 90 && currentPct <= 110 ? 'text-emerald-600' : currentPct > 110 ? 'text-amber-600' : 'text-blue-600'}`}>
                        % {currentPct}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="!w-screen !h-[100dvh] !max-w-none !rounded-none !border-0 !left-0 !top-0 !translate-x-0 !translate-y-0 sm:!w-full sm:!h-auto sm:!max-w-[450px] sm:!max-h-[90dvh] sm:!rounded-xl sm:!top-[50%] sm:!left-[50%] sm:!translate-x-[-50%] sm:!translate-y-[-50%] sm:!border p-0 bg-slate-50 sm:bg-white flex flex-col overflow-hidden">
                <DialogHeader className="p-3 sm:p-4 bg-white border-b border-slate-100 shrink-0 flex flex-col items-center">
                    <DialogTitle className="text-base sm:text-lg text-center font-bold text-slate-800">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto w-full flex flex-col relative">
                    <div className="bg-white px-3 py-2 sm:p-4 border-b border-slate-100 sm:rounded-b-xl shadow-sm shrink-0 sticky top-0 z-20">
                        {renderMacroRow('Kalori', initialTotals.calories, currentTotals.calories, targetMacros.calories)}
                        {renderMacroRow('Protein', initialTotals.protein, currentTotals.protein, targetMacros.protein)}
                        {renderMacroRow('Karb', initialTotals.carbs, currentTotals.carbs, targetMacros.carbs)}
                        {renderMacroRow('Yağ', initialTotals.fat, currentTotals.fat, targetMacros.fat)}
                    </div>

                    <div className="px-2 sm:px-6 pt-3 pb-6 space-y-5">
                        {changes.length === 0 && (
                            <div className="text-center text-sm text-slate-500 py-6 bg-slate-50 rounded-lg border border-slate-100">
                                Önerilen değişiklik bulunamadı.
                            </div>
                        )}
                        
                        {/* Phase 1: Primary Changes */}
                        {changes.filter(c => !c.isAlternative).length > 0 && (
                            <div>
                                <div className="text-sm font-bold text-slate-800 mb-2.5 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px]">1</div>
                                    <span>Temel Düzenlemeler</span>
                                </div>
                                <div className="space-y-2">
                                    {changes.filter(c => !c.isAlternative).map((change) => {
                                        const isSelected = selectedChanges.has(change.id)
                                        return (
                                            <div 
                                                key={change.id} 
                                                className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-white border-emerald-400 shadow-[0_0_0_1px_rgba(52,211,153,0.3)]' : 'bg-white border-slate-200 hover:border-emerald-300 opacity-60 grayscale-[30%]'}`} 
                                                onClick={() => handleToggle(change.id)}
                                            >
                                                <div className="pt-0.5 shrink-0">
                                                    <Checkbox 
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggle(change.id)}
                                                        className={`w-4 h-4 rounded-sm ${isSelected ? 'data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600' : ''}`}
                                                    />
                                                </div>
                                                <div className="flex-1 text-[13px] sm:text-sm leading-tight min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                        {change.dayName && <span className="text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded mr-1">{change.dayName}</span>}
                                                        {change.slotName && <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">{change.slotName}</span>}
                                                        <span className={`font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600 line-through decoration-slate-400'}`}>
                                                            {change.foodName}
                                                        </span>
                                                        <div className="ml-0 sm:ml-auto w-full sm:w-auto mt-1 sm:mt-0">
                                                            {change.type === 'add' && <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Ekleme</span>}
                                                            {change.type === 'remove' && <span className="text-[9px] sm:text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Çıkarma</span>}
                                                            {change.type === 'swap' && <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Değişim</span>}
                                                            {change.type === 'portion' && <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Porsiyon</span>}
                                                        </div>
                                                    </div>
                                                    <div className={`text-xs sm:text-[13px] ${isSelected ? 'text-slate-700' : 'text-slate-500 line-through decoration-slate-400'} mb-2`}>
                                                        {change.detail}
                                                    </div>
                                                    {/* Delta Values */}
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium mb-1">
                                                        {change.diffCals !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffCals > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                Kalori: {change.diffCals > 0 ? '+' : ''}{Math.round(change.diffCals)}
                                                            </span>
                                                        )}
                                                        {change.diffProt !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffProt > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                Pro: {change.diffProt > 0 ? '+' : ''}{Math.round(change.diffProt)}
                                                            </span>
                                                        )}
                                                        {change.diffCarbs !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffCarbs > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                Karb: {change.diffCarbs > 0 ? '+' : ''}{Math.round(change.diffCarbs)}
                                                            </span>
                                                        )}
                                                        {change.diffFat !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffFat > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                Yağ: {change.diffFat > 0 ? '+' : ''}{Math.round(change.diffFat)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Phase 2: Alternative Changes */}
                        {changes.filter(c => c.isAlternative).length > 0 && (
                            <div className="mt-4">
                                <div className="text-sm font-bold text-amber-700 mb-2.5 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px]">2</div>
                                    <span>Alternatif İnce Ayarlar (İsteğe Bağlı)</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-3 ml-8 leading-relaxed">
                                    Hedefe daha iyi yaklaşmak isterseniz aşağıdaki değişiklikleri seçerek makrolar üzerindeki etkisini anında görebilirsiniz.
                                </div>
                                <div className="space-y-2">
                                    {changes.filter(c => c.isAlternative).map((change) => {
                                        const isSelected = selectedChanges.has(change.id)
                                        return (
                                            <div 
                                                key={change.id} 
                                                className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-white border-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.3)]' : 'bg-white border-slate-200 border-dashed hover:border-amber-300 opacity-80'}`} 
                                                onClick={() => handleToggle(change.id)}
                                            >
                                                <div className="pt-0.5 shrink-0">
                                                    <Checkbox 
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggle(change.id)}
                                                        className={`w-4 h-4 rounded-sm ${isSelected ? 'data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600' : ''}`}
                                                    />
                                                </div>
                                                <div className="flex-1 text-[13px] sm:text-sm leading-tight min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                        {change.dayName && <span className="text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded mr-1">{change.dayName}</span>}
                                                        {change.slotName && <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">{change.slotName}</span>}
                                                        <span className={`font-bold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                                                            {change.foodName}
                                                        </span>
                                                        <div className="ml-0 sm:ml-auto w-full sm:w-auto mt-1 sm:mt-0">
                                                            {change.type === 'add' && <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Ekleme</span>}
                                                            {change.type === 'remove' && <span className="text-[9px] sm:text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">Çıkarma</span>}
                                                            {change.type === 'swap' && <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">Değişim</span>}
                                                            {change.type === 'portion' && <span className="text-[9px] sm:text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Porsiyon</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs sm:text-[13px] text-slate-600 mb-2">
                                                        {change.detail}
                                                    </div>
                                                    {/* Delta Values */}
                                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-medium opacity-90 mb-1">
                                                        {change.diffCals !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffCals > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                Kalori: {change.diffCals > 0 ? '+' : ''}{Math.round(change.diffCals)}
                                                            </span>
                                                        )}
                                                        {change.diffProt !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffProt > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                Pro: {change.diffProt > 0 ? '+' : ''}{Math.round(change.diffProt)}
                                                            </span>
                                                        )}
                                                        {change.diffCarbs !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffCarbs > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                Karb: {change.diffCarbs > 0 ? '+' : ''}{Math.round(change.diffCarbs)}
                                                            </span>
                                                        )}
                                                        {change.diffFat !== 0 && (
                                                            <span className={`px-2 py-0.5 rounded-full ${change.diffFat > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                Yağ: {change.diffFat > 0 ? '+' : ''}{Math.round(change.diffFat)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-4 bg-white border-t border-slate-100 shrink-0 flex flex-row items-center gap-3 w-full">
                    <Button variant="outline" className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900" onClick={onClose}>
                        İptal
                    </Button>
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm" onClick={() => {
                        const approved = changes.filter(c => selectedChanges.has(c.id))
                        onConfirm(approved)
                    }}>
                        Onayla
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

