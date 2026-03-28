import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { Calendar as CalendarIcon, Loader2, Plus, Trash2, Pencil, Save, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"

type Note = {
    id: string
    note: string
    note_date: string
    created_at: string
    dietitian_id: string
}

interface PatientNotesSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    patientName: string
}

export function PatientNotesSheet({ open, onOpenChange, patientId, patientName }: PatientNotesSheetProps) {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState<'list' | 'edit'>('list')
    const [editingNote, setEditingNote] = useState<Note | null>(null) // null means new note
    const { profile } = useAuth()
    const isDietitian = profile?.role === 'dietitian'

    // Form State
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
    const [formText, setFormText] = useState("")

    useEffect(() => {
        if (open) {
            fetchNotes()
            setView('list')
        }
    }, [open, patientId])

    async function fetchNotes() {
        setLoading(true)
        const { data, error } = await supabase
            .from('patient_notes')
            .select('*')
            .eq('patient_id', patientId)
            .order('note_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching notes:', error)
        } else {
            setNotes(data || [])
        }
        setLoading(false)
    }

    function handleAddNew() {
        setEditingNote(null)
        setFormDate(new Date().toISOString().split('T')[0])
        setFormText("")
        setView('edit')
    }

    function handleEdit(note: Note) {
        setEditingNote(note)
        setFormDate(note.note_date)
        setFormText(note.note)
        setView('edit')
    }

    async function handleSave() {
        if (!formText.trim()) return

        setLoading(true)
        if (editingNote) {
            // Update
            const { error } = await supabase
                .from('patient_notes')
                .update({ note: formText, note_date: formDate })
                .eq('id', editingNote.id)

            if (error) alert('Güncelleme hatası: ' + error.message)
        } else {
            // Insert
            const { error } = await supabase
                .from('patient_notes')
                .insert([{
                    patient_id: patientId,
                    note: formText,
                    note_date: formDate,
                    dietitian_id: profile?.id
                }])

            if (error) alert('Ekleme hatası: ' + error.message)
        }

        await fetchNotes()
        setView('list')
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return

        setLoading(true)
        const { error } = await supabase.from('patient_notes').delete().eq('id', id)
        if (error) {
            alert('Silme hatası: ' + error.message)
        } else {
            await fetchNotes()
        }
        setLoading(false)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full" side="right">
                <SheetHeader className="mb-4">
                    <SheetTitle>Takip Notları</SheetTitle>
                    <SheetDescription>
                        {patientName} için alınan notlar.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {view === 'list' ? (
                        <>
                            <div className="flex justify-end mb-4">
                                {isDietitian && (
                                    <Button onClick={handleAddNew} size="sm" className="gap-2">
                                        <Plus size={16} /> Yeni Not Ekle
                                    </Button>
                                )}
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                {loading ? (
                                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                                ) : notes.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">Henüz not eklenmemiş.</div>
                                ) : (
                                    <div className="space-y-4">
                                        {notes.map(note => (
                                            <Card key={note.id} className="relative group">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                            <CalendarIcon size={14} />
                                                            {format(new Date(note.note_date), 'd MMMM yyyy', { locale: tr })}
                                                        </div>
                                                        {isDietitian && profile?.id === note.dietitian_id && (
                                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(note)}>
                                                                    <Pencil size={12} />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(note.id)}>
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap text-gray-800">{note.note}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-200">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tarih</label>
                                <Input
                                    type="date"
                                    value={formDate}
                                    onChange={e => setFormDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 flex-1 flex flex-col">
                                <label className="text-sm font-medium">Not İçeriği</label>
                                <Textarea
                                    value={formText}
                                    onChange={e => setFormText(e.target.value)}
                                    className="flex-1 min-h-[200px] resize-none"
                                    placeholder="Görüşme notları..."
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="outline" onClick={() => setView('list')} disabled={loading}>
                                    İptal
                                </Button>
                                <Button onClick={handleSave} disabled={loading} className="gap-2">
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Kaydet
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
