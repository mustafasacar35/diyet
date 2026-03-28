"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

import { Scale, Activity, X } from "lucide-react"

interface CopiedWeekInitModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultWeight: number | null
    defaultActivity: number | null
    onSave: (weight: number, activity: number) => Promise<void>
    isPatientApp?: boolean
}

export function CopiedWeekInitModal({ open, onOpenChange, defaultWeight, defaultActivity, onSave, isPatientApp = false }: CopiedWeekInitModalProps) {
    const [weight, setWeight] = useState<string>('')
    const [activity, setActivity] = useState<string>('3')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setWeight(defaultWeight ? String(defaultWeight) : '')
            setActivity(defaultActivity ? String(defaultActivity) : '3')
        }
    }, [open, defaultWeight, defaultActivity])

    const handleSave = async () => {
        let parsedW = parseFloat(weight)
        if (isNaN(parsedW) || parsedW <= 0) {
            parsedW = defaultWeight || 70 // Fallback
        }
        let parsedA = parseInt(activity)
        if (isNaN(parsedA) || parsedA < 1 || parsedA > 5) {
            parsedA = defaultActivity || 3 // Fallback
        }

        setLoading(true)
        try {
            await onSave(parsedW, parsedA)
            onOpenChange(false)
        } catch (err: any) {
            alert(err.message || 'Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const handleLater = async () => {
        setLoading(true)
        try {
            await onSave(defaultWeight || 70, defaultActivity || 3)
            onOpenChange(false)
        } catch (err: any) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && !loading) handleLater() 
        }}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl border-none pt-8 px-6 pb-6 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400" />
                
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-black text-center text-gray-800 mb-2 mt-2">
                        {isPatientApp ? 'Yeni Haftanız Hazır!' : 'Yeni Hafta Bilgileri'}
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 text-sm font-medium px-2">
                        {isPatientApp 
                            ? 'Hedeflerinizi doğru belirleyebilmemiz için güncel bilgilerinizi teyit edin.' 
                            : 'Kopya haftanın makro hesaplaması için kilo ve aktivite değerlerini onaylayın.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 my-2">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <Label className="text-xs font-bold text-gray-500 tracking-wider uppercase flex items-center gap-1.5">
                            <Scale size={14} className="text-indigo-400" />
                            {isPatientApp ? 'Güncel Kilonuz (kg)' : 'Hastanın Kilosu (kg)'}
                        </Label>
                        <Input 
                            type="number" 
                            step="0.1" 
                            value={weight} 
                            onChange={(e) => setWeight(e.target.value)} 
                            className="h-14 text-2xl text-center font-black text-gray-800 bg-gray-50 rounded-xl border-gray-100 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300 placeholder:font-normal"
                            placeholder="Örn: 75.5"
                        />
                    </div>
                    
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                        <Label className="text-xs font-bold text-gray-500 tracking-wider uppercase flex items-center gap-1.5">
                            <Activity size={14} className="text-emerald-400" />
                            {isPatientApp ? 'Günlük Aktiviteniz' : 'Tahmini Aktivite'}
                        </Label>
                        <Select value={activity} onValueChange={setActivity}>
                            <SelectTrigger className="h-14 text-sm font-semibold bg-gray-50 rounded-xl border-gray-100 focus:bg-white focus:ring-2 focus:ring-emerald-100">
                                <SelectValue placeholder="Aktivite seçin" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-lg border-gray-100">
                                <SelectItem value="1" className="py-3 cursor-pointer">1. Masa Başı / Sedanter</SelectItem>
                                <SelectItem value="2" className="py-3 cursor-pointer">2. Hafif Hareketli (1-2 gün yürüyüş)</SelectItem>
                                <SelectItem value="3" className="py-3 cursor-pointer">3. Orta Aktif (3-5 gün spor/egzersiz)</SelectItem>
                                <SelectItem value="4" className="py-3 cursor-pointer">4. Çok Hareketli (6-7 gün spor)</SelectItem>
                                <SelectItem value="5" className="py-3 cursor-pointer">5. Aşırı Hareketli (Ağır idman/İş)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <Button 
                        onClick={handleSave} 
                        disabled={loading} 
                        className="w-full h-14 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        {loading ? 'Kaydediliyor...' : 'Güncel Bilgileri Kaydet'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={handleLater} 
                        disabled={loading}
                        className="w-full h-12 rounded-xl text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                    >
                        Sonra Sor (Mevcut Kilo Kullanılır)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
