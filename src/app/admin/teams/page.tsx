"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, UserPlus, Trash2, Shield, UserCog } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Profile = {
    id: string
    full_name: string
    role: string
    title?: string
}

type TeamMember = {
    id: string // relation id
    member_id: string
    status: string
    profile: Profile // joined profile
}

export default function AdminTeamsPage() {
    const { isAdmin, loading, profile } = useAuth()
    const router = useRouter()

    const [doctors, setDoctors] = useState<Profile[]>([])
    const [selectedDoctor, setSelectedDoctor] = useState<Profile | null>(null)
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

    // For assigning new members
    const [availableDietitians, setAvailableDietitians] = useState<Profile[]>([])
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [selectedDietitianId, setSelectedDietitianId] = useState<string>("")

    useEffect(() => {
        // Only redirect if loading done AND profile loaded AND not admin
        if (!loading && profile && !isAdmin) router.push("/")
    }, [isAdmin, loading, router, profile])

    useEffect(() => {
        if (isAdmin) loadDoctors()
    }, [isAdmin])

    useEffect(() => {
        if (selectedDoctor) {
            loadTeam(selectedDoctor.id)
        } else {
            setTeamMembers([])
        }
    }, [selectedDoctor])

    async function loadDoctors() {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'doctor')
        if (data) setDoctors(data)
    }

    async function loadTeam(supervisorId: string) {
        // Fetch team members and fetch their profile info manually or via join if setup
        // Supabase join syntax: select('*, member:member_id(*)') if FK relation is detected
        // Assuming FK is setup correctly in schema...

        // Let's try explicit join
        const { data, error } = await supabase
            .from('team_members')
            .select(`
                id,
                member_id,
                status,
                member:profiles!member_id (id, full_name, role, title)
            `)
            .eq('supervisor_id', supervisorId)

        if (data) {
            // Transform to shape
            const formatted = data.map((d: any) => ({
                id: d.id,
                member_id: d.member_id,
                status: d.status,
                profile: d.member
            }))
            setTeamMembers(formatted)
        }
    }

    async function loadAvailableDietitians() {
        // Find dietitians NOT in this doctor's team (or entirely free? depending on logic)
        // For simplicity: All dietitians.
        const { data } = await supabase.from('profiles').select('*').eq('role', 'dietitian')

        if (data) {
            // Filter out already assigned ones
            const currentMemberIds = teamMembers.map(m => m.member_id)
            const available = data.filter(d => !currentMemberIds.includes(d.id))
            setAvailableDietitians(available)
        }
    }

    async function handleAssign() {
        if (!selectedDoctor || !selectedDietitianId) return

        const { error } = await supabase.from('team_members').insert({
            supervisor_id: selectedDoctor.id,
            member_id: selectedDietitianId,
            status: 'active'
        })

        if (!error) {
            loadTeam(selectedDoctor.id)
            setAssignDialogOpen(false)
            setSelectedDietitianId("")
        } else {
            alert("Atama başarısız: " + error.message)
        }
    }

    async function removeMember(relationId: string) {
        if (!confirm("Bu diyetisyeni takımdan çıkarmak istediğinize emin misiniz?")) return

        await supabase.from('team_members').delete().eq('id', relationId)
        if (selectedDoctor) loadTeam(selectedDoctor.id)
    }

    if (loading || !isAdmin) return null

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 h-[calc(100vh-60px)] flex flex-col">
            <div className="flex items-center gap-4 shrink-0">
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.push('/admin')}>
                    <ArrowLeft size={16} className="mr-1" />
                    Panele Dön
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Takım Yapılandırması</h1>
                    <p className="text-gray-500 text-sm">Doktorlar ve onlara bağlı diyetisyen ekiplerini yönetin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left Panel: Doctors List */}
                <Card className="flex flex-col h-full bg-white shadow-sm border-r md:col-span-1">
                    <CardHeader className="py-4 px-4 border-b bg-gray-50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            Doktorlar (Baş Diyetisyen)
                        </CardTitle>
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {doctors.length === 0 && <p className="text-xs text-gray-500 p-4 text-center">Henüz doktor bulunmuyor.</p>}
                        {doctors.map(doc => (
                            <div
                                key={doc.id}
                                onClick={() => setSelectedDoctor(doc)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center gap-3 border ${selectedDoctor?.id === doc.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'hover:bg-gray-50 border-transparent'}`}
                            >
                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                    {doc.full_name?.charAt(0) || "D"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">{doc.full_name || "İsimsiz"}</div>
                                    <div className="text-xs text-gray-500 truncate">{doc.title || "Ünvan yok"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Right Panel: Team Members */}
                <Card className="flex flex-col h-full bg-white shadow-sm border md:col-span-2">
                    <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                                {selectedDoctor ? (selectedDoctor.full_name?.charAt(0) || "D") : "?"}
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold">
                                    {selectedDoctor ? selectedDoctor.full_name + "'in Takımı" : "Doktor Seçiniz"}
                                </CardTitle>
                                {selectedDoctor && <p className="text-xs text-gray-500">Bu takımdaki diyetisyenler</p>}
                            </div>
                        </div>
                        {selectedDoctor && (
                            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm" onClick={loadAvailableDietitians}>
                                        <UserPlus className="h-4 w-4 mr-1.5" /> Diyetisyen Ekle
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Takıma Diyetisyen Ekle</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-semibold">{selectedDoctor.full_name}</span> adlı yöneticinin takımına eklenecek diyetisyeni seçin.
                                            </p>
                                            <Select onValueChange={setSelectedDietitianId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Diyetisyen Seçin..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableDietitians.map(d => (
                                                        <SelectItem key={d.id} value={d.id}>
                                                            {d.full_name || "İsimsiz"} ({d.title || "Ünvan yok"})
                                                        </SelectItem>
                                                    ))}
                                                    {availableDietitians.length === 0 && (
                                                        <div className="p-2 text-xs text-gray-500 text-center">Uygun diyetisyen bulunamadı.</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button className="w-full" onClick={handleAssign} disabled={!selectedDietitianId}>
                                            Atamayı Yap
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </CardHeader>
                    <div className="flex-1 overflow-y-auto p-4">
                        {!selectedDoctor ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Shield className="h-12 w-12 mb-3 opacity-20" />
                                <p>Detayları görmek için soldan bir doktor seçin.</p>
                            </div>
                        ) : teamMembers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <UserCog className="h-12 w-12 mb-3 opacity-20" />
                                <p>Bu takımda henüz diyetisyen yok.</p>
                                <Button variant="link" onClick={() => { loadAvailableDietitians(); setAssignDialogOpen(true); }}>
                                    Hemen bir tane ekleyin
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="border rounded-lg p-3 hover:shadow-sm transition-all bg-white flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                                                {member.profile?.full_name?.charAt(0) || "D"}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{member.profile?.full_name}</div>
                                                <div className="text-xs text-green-600 font-medium">Diyetisyen</div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeMember(member.id)}
                                            title="Takımdan Çıkar"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
