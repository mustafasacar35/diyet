import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { Trash2 } from "lucide-react"

type MealEditDialogProps = {
    meal: any
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
    onDelete: () => void
}

export function MealEditDialog({ meal, isOpen, onClose, onUpdate, onDelete }: MealEditDialogProps) {
    const [portion, setPortion] = useState(meal.portion_multiplier)
    const [notes, setNotes] = useState(meal.custom_notes || '')
    const [loading, setLoading] = useState(false)

    async function handleSave() {
        setLoading(true)
        const { error } = await supabase.from('diet_meals').update({
            portion_multiplier: portion,
            custom_notes: notes
        }).eq('id', meal.id)

        setLoading(false)
        if (error) {
            alert("Error updating meal: " + error.message)
        } else {
            onUpdate()
            onClose()
        }
    }

    async function handleDelete() {
        if (!confirm("Bu öğünü silmek istediğinize emin misiniz?")) return
        setLoading(true)
        const { error } = await supabase.from('diet_meals').delete().eq('id', meal.id)
        setLoading(false)
        if (error) {
            alert("Error deleting meal: " + error.message)
        } else {
            onDelete()
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{meal.foods.name} Düzenle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="portion" className="text-right">
                            Porsiyon
                        </Label>
                        <Input
                            id="portion"
                            type="number"
                            step="0.1"
                            value={portion}
                            onChange={(e) => setPortion(parseFloat(e.target.value))}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                            Notlar
                        </Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                        Toplam Kalori: {Math.round(meal.foods.calories * portion)} kcal
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        <Trash2 size={16} className="mr-2" /> Sil
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={loading}>İptal</Button>
                        <Button onClick={handleSave} disabled={loading}>Kaydet</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
