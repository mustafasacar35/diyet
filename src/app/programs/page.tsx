'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Calendar, Activity, Ban, ArrowLeft } from 'lucide-react'
import ProgramDialog from '@/components/programs/program-dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DietTypesEditor } from "@/components/diet/diet-types-editor"

interface ProgramTemplate {
    id: string
    name: string
    description: string | null
    total_weeks: number
    default_activity_level: number
    is_active: boolean
    created_at: string
    program_template_weeks?: ProgramTemplateWeek[]
    program_template_restrictions?: ProgramTemplateRestriction[]
}

interface ProgramTemplateWeek {
    id: string
    week_start: number
    week_end: number
    diet_type_id: string | null
    diet_types?: { name: string; abbreviation?: string } | null
    notes: string | null
}

interface ProgramTemplateRestriction {
    id: string
    restriction_type: 'keyword' | 'tag' | 'food_id'
    restriction_value: string
    reason: string | null
    severity: 'warn' | 'block'
}

export default function ProgramsPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Yükleniyor...</div>}>
            <ProgramsContent />
        </Suspense>
    )
}

function ProgramsContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = useState('programs')

    const [programs, setPrograms] = useState<ProgramTemplate[]>([])
    const [dietTypes, setDietTypes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingProgram, setEditingProgram] = useState<ProgramTemplate | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [programToDelete, setProgramToDelete] = useState<ProgramTemplate | null>(null)

    useEffect(() => {
        const tabParam = searchParams.get('tab')
        if (tabParam && (tabParam === 'programs' || tabParam === 'diet-types')) {
            setActiveTab(tabParam)
        }
    }, [searchParams])

    useEffect(() => {
        fetchPrograms()
        fetchDietTypes()
    }, [])

    async function fetchPrograms() {
        setLoading(true)
        const { data, error } = await supabase
            .from('program_templates')
            .select(`
                *,
                program_template_weeks (
                    id, week_start, week_end, diet_type_id, notes,
                    diet_types (name, abbreviation)
                ),
                program_template_restrictions (
                    id, restriction_type, restriction_value, reason, severity
                )
            `)
            .order('name')

        if (error) {
            console.error('Error fetching programs:', error)
        } else {
            setPrograms(data || [])
        }
        setLoading(false)
    }

    async function fetchDietTypes() {
        // Fetch only GLOBAL diet types (patient_id is IS NULL)
        const { data, error } = await supabase
            .from('diet_types')
            .select('*')
            .is('patient_id', null)
            .order('name')

        if (data) setDietTypes(data)
    }

    async function handleDelete() {
        if (!programToDelete) return

        const { error } = await supabase
            .from('program_templates')
            .delete()
            .eq('id', programToDelete.id)

        if (error) {
            console.error('Error deleting program:', error)
            alert('Program silinirken hata oluştu')
        } else {
            fetchPrograms()
        }
        setDeleteDialogOpen(false)
        setProgramToDelete(null)
    }

    function openEditDialog(program: ProgramTemplate) {
        setEditingProgram(program)
        setDialogOpen(true)
    }

    function openNewDialog() {
        setEditingProgram(null)
        setDialogOpen(true)
    }

    function handleDialogClose() {
        setDialogOpen(false)
        setEditingProgram(null)
        fetchPrograms()
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.push('/admin')}>
                            <ArrowLeft size={16} className="mr-1" />
                            Panele Dön
                        </Button>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Program Yönetimi</h1>
                    <p className="text-gray-500 mt-1">
                        Program şablonları ve diyet türlerini buradan yönetebilirsiniz.
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(val) => {
                setActiveTab(val)
                // Update URL without refresh
                const params = new URLSearchParams(searchParams)
                params.set('tab', val)
                router.replace(`/programs?${params.toString()}`, { scroll: false })
            }} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="programs">Program Şablonları</TabsTrigger>
                    <TabsTrigger value="diet-types">Diyet Türleri Kütüphanesi</TabsTrigger>
                </TabsList>

                <TabsContent value="programs">
                    <div className="flex justify-end mb-4">
                        <Button onClick={openNewDialog} className="flex items-center gap-2">
                            <Plus size={18} />
                            Yeni Program
                        </Button>
                    </div>

                    {/* Programs Grid */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
                    ) : programs.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <p className="text-gray-500 mb-4">Henüz program şablonu oluşturulmamış</p>
                                <Button onClick={openNewDialog} variant="outline">
                                    <Plus size={18} className="mr-2" />
                                    İlk Programı Oluştur
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {programs.map(program => (
                                <Card key={program.id} className={`transition-shadow hover:shadow-md ${!program.is_active ? 'opacity-60' : ''}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{program.name}</CardTitle>
                                                {program.description && (
                                                    <CardDescription className="mt-1 line-clamp-2">
                                                        {program.description}
                                                    </CardDescription>
                                                )}
                                            </div>
                                            {!program.is_active && (
                                                <Badge variant="secondary">Pasif</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Quick Stats */}
                                        <div className="flex gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                <span>{program.total_weeks} hafta</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Activity size={14} />
                                                <span>Seviye {program.default_activity_level}</span>
                                            </div>
                                            {(program.program_template_restrictions?.length || 0) > 0 && (
                                                <div className="flex items-center gap-1 text-red-600">
                                                    <Ban size={14} />
                                                    <span>{program.program_template_restrictions?.length} yasak</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Week Diet Types Preview */}
                                        {program.program_template_weeks && program.program_template_weeks.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {program.program_template_weeks
                                                    .sort((a, b) => a.week_start - b.week_start)
                                                    .slice(0, 4)
                                                    .map(week => (
                                                        <Badge key={week.id} variant="outline" className="text-xs">
                                                            H{week.week_start}-{week.week_end}: {week.diet_types?.abbreviation || week.diet_types?.name || '?'}
                                                        </Badge>
                                                    ))}
                                                {program.program_template_weeks.length > 4 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        +{program.program_template_weeks.length - 4}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => openEditDialog(program)}
                                            >
                                                <Pencil size={14} className="mr-1" />
                                                Düzenle
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => {
                                                    setProgramToDelete(program)
                                                    setDeleteDialogOpen(true)
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="diet-types">
                    <Card>
                        <CardHeader>
                            <CardTitle>Diyet Türleri Kütüphanesi</CardTitle>
                            <CardDescription>
                                Sistem genelinde kullanılan diyet şablonlarını yönetin. Hastalara özel kopyalar bu şablonlardan türetilir.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DietTypesEditor
                                dietTypes={dietTypes}
                                onUpdate={fetchDietTypes}
                            // No patientId passed -> Global Mode
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Program Dialog */}
            <ProgramDialog
                open={dialogOpen}
                onClose={handleDialogClose}
                program={editingProgram}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Programı Sil</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{programToDelete?.name}" programını silmek istediğinize emin misiniz?
                            Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
