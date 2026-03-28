import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Lock, Unlock, Calendar, LayoutGrid, CalendarDays } from 'lucide-react'

interface LockManagerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mode: 'lock' | 'unlock'
    mealName: string
    onConfirm: (scope: 'single' | 'week' | 'plan', deleteFuture: boolean) => void
}

export function LockManagerDialog({ open, onOpenChange, mode, mealName, onConfirm }: LockManagerDialogProps) {
    const [scope, setScope] = useState<'single' | 'week' | 'plan'>('single')
    const [deleteFuture, setDeleteFuture] = useState(false)

    const handleConfirm = () => {
        onConfirm(scope, deleteFuture)
        onOpenChange(false)
        // Reset states after close
        setTimeout(() => {
            setScope('single')
            setDeleteFuture(false)
        }, 300)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {mode === 'lock' ? <Lock className="w-5 h-5 text-red-500" /> : <Unlock className="w-5 h-5 text-blue-500" />}
                        {mode === 'lock' ? 'Yemeği Kilitle' : 'Kilidi Kaldır'}
                    </DialogTitle>
                    <DialogDescription>
                        <strong>{mealName}</strong> için işlem yapılıyor.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {mode === 'lock' ? (
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Uygulama Kapsamı:</Label>
                            <RadioGroup value={scope} onValueChange={(v: any) => setScope(v)} className="space-y-3">
                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => setScope('single')}>
                                    <RadioGroupItem value="single" id="scope-single" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="scope-single" className="font-medium cursor-pointer">Sadece Bu Öğün</Label>
                                        <p className="text-sm text-muted-foreground">Sadece seçili gün ve öğün kilitlenir.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => setScope('week')}>
                                    <RadioGroupItem value="week" id="scope-week" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="scope-week" className="font-medium flex items-center gap-1 cursor-pointer">
                                            <CalendarDays className="w-3 h-3" /> Hafta Boyunca Yay
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Bu günden itibaren <strong>haftanın sonuna kadar</strong> aynı öğüne kopyalanır ve kilitlenir. Mevcut yemekler silinir.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer" onClick={() => setScope('plan')}>
                                    <RadioGroupItem value="plan" id="scope-plan" className="mt-1" />
                                    <div className="space-y-1">
                                        <Label htmlFor="scope-plan" className="font-medium flex items-center gap-1 cursor-pointer">
                                            <LayoutGrid className="w-3 h-3" /> Tüm Plana Yay
                                        </Label>
                                        <p className="text-sm text-muted-foreground">Bu günden itibaren <strong>tüm plan boyunca</strong> (gelecek haftalar dahil) kopyalanır ve kilitlenir.</p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                                Bu yemeğin kilidi kaldırılacak ve tekrar düzenlenebilir/silinebilir hale gelecek.
                            </div>

                            <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-slate-50">
                                <Checkbox
                                    id="delete-future"
                                    checked={deleteFuture}
                                    onCheckedChange={(c: boolean) => setDeleteFuture(c)}
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="delete-future" className="font-medium cursor-pointer">Gelecek Tekrarları da Kaldır</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Eğer bu yemek "Haftaya Yay" veya "Plana Yay" ile oluşturulduysa, gelecek günlerdeki kopyaları da otomatik olarak silinir.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button
                        variant={mode === 'lock' ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                        className={mode === 'lock' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                        {mode === 'lock' ? 'Kilitle ve Uygula' : 'Kilidi Kaldır'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
