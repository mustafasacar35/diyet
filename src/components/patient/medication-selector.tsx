'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlusCircle, X, Loader2, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

type Medication = {
    id: string
    name: string
    generic_name: string | null
    category: string | null
}

type PatientMedication = {
    id?: string
    medication_id: string | null
    medication_name: string
    dosage: string
    started_at: string | null
    ended_at: string | null
    notes: string
}

type MedicationSelectorProps = {
    patientId: string
    value: PatientMedication[]
    onChange: (medications: PatientMedication[]) => void
    className?: string
}

export default function MedicationSelector({ patientId, value, onChange, className }: MedicationSelectorProps) {
    // const supabase = createClientComponentClient()

    const [allMedications, setAllMedications] = useState<Medication[]>([])
    const [loading, setLoading] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    // Add medication dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newMedication, setNewMedication] = useState<PatientMedication>({
        medication_id: null,
        medication_name: '',
        dosage: '',
        started_at: null,
        ended_at: null,
        notes: ''
    })

    useEffect(() => {
        loadMedications()
    }, [])

    const loadMedications = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('medications')
            .select('id, name, generic_name, category')
            .order('name')

        if (!error && data) {
            setAllMedications(data)
        }
        setLoading(false)
    }

    const selectMedication = (medication: Medication) => {
        setNewMedication({
            medication_id: medication.id,
            medication_name: medication.name,
            dosage: '',
            started_at: null,
            ended_at: null,
            notes: ''
        })
        setSearchOpen(false)
        setIsAddDialogOpen(true)
    }

    const selectCustomMedication = () => {
        setNewMedication({
            medication_id: null,
            medication_name: '',
            dosage: '',
            started_at: null,
            ended_at: null,
            notes: ''
        })
        setSearchOpen(false)
        setIsAddDialogOpen(true)
    }

    const addMedication = () => {
        if (!newMedication.medication_name.trim()) {
            alert('İlaç adı zorunludur')
            return
        }

        onChange([...value, { ...newMedication }])
        setIsAddDialogOpen(false)
        setNewMedication({
            medication_id: null,
            medication_name: '',
            dosage: '',
            started_at: null,
            ended_at: null,
            notes: ''
        })
    }

    const removeMedication = (index: number) => {
        onChange(value.filter((_, i) => i !== index))
    }

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-2">
                <Label>Kullanılan İlaçlar</Label>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            İlaç Ekle
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <Command>
                            <CommandInput placeholder="İlaç ara..." />
                            <CommandList>
                                <CommandEmpty>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-6">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    ) : (
                                        'İlaç bulunamadı'
                                    )}
                                </CommandEmpty>
                                <CommandGroup heading="Sistemdeki İlaçlar">
                                    {allMedications.map((med) => (
                                        <CommandItem
                                            key={med.id}
                                            onSelect={() => selectMedication(med)}
                                            className="cursor-pointer"
                                        >
                                            <Pill className="mr-2 h-4 w-4" />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{med.name}</span>
                                                {med.generic_name && (
                                                    <span className="text-xs text-muted-foreground">{med.generic_name}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem onSelect={selectCustomMedication} className="cursor-pointer">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        <span>Serbest metin olarak ekle</span>
                                    </CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Selected Medications */}
            <div className="border rounded-lg min-h-[100px] p-3 space-y-2">
                {value.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                        Henüz ilaç eklenmemiş
                    </p>
                ) : (
                    value.map((med, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 group"
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <Pill className="h-4 w-4 text-blue-600" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{med.medication_name}</span>
                                        {med.dosage && (
                                            <Badge variant="outline" className="text-xs">
                                                {med.dosage}
                                            </Badge>
                                        )}
                                    </div>
                                    {med.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">{med.notes}</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeMedication(index)}
                            >
                                <X className="h-4 w-4 text-red-600" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Medication Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>İlaç Ekle</DialogTitle>
                        <DialogDescription>
                            İlaç bilgilerini girin
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>İlaç Adı *</Label>
                            <Input
                                placeholder="Örn: Glucophage"
                                value={newMedication.medication_name}
                                onChange={(e) => setNewMedication({ ...newMedication, medication_name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Dozaj</Label>
                            <Input
                                placeholder="Örn: 500mg 2x1"
                                value={newMedication.dosage}
                                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Başlangıç Tarihi</Label>
                                <Input
                                    type="date"
                                    value={newMedication.started_at || ''}
                                    onChange={(e) => setNewMedication({ ...newMedication, started_at: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Bitiş Tarihi</Label>
                                <Input
                                    type="date"
                                    value={newMedication.ended_at || ''}
                                    onChange={(e) => setNewMedication({ ...newMedication, ended_at: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Notlar</Label>
                            <Input
                                placeholder="Ek bilgiler..."
                                value={newMedication.notes}
                                onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={addMedication}>
                            Ekle
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
