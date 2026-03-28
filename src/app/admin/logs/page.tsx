"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollText, Activity, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [filteredLogs, setFilteredLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        fetchLogs()
    }, [])

    useEffect(() => {
        if (!search.trim()) {
            setFilteredLogs(logs)
            return
        }
        const lower = search.toLowerCase()
        const filtered = logs.filter(log =>
            log.patients?.full_name?.toLowerCase().includes(lower) ||
            log.action_type?.toLowerCase().includes(lower) ||
            (log.metadata?.ip_address && log.metadata.ip_address.includes(lower))
        )
        setFilteredLogs(filtered)
    }, [search, logs])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('patient_activity_logs')
                .select('*, patients(full_name)')
                .order('created_at', { ascending: false })
                .limit(500) // Keep standard limit or implement pagination if needed

            if (error) {
                console.error("Error fetching logs:", error)
                return
            }

            setLogs(data || [])
            setFilteredLogs(data || [])
        } catch (err) {
            console.error("Fetch exception:", err)
        } finally {
            setLoading(false)
        }
    }

    const actionLabels: Record<string, string> = {
        'login_success': 'Sisteme Giriş (Login)',
        'auto_plan_generated': 'Otomatik Plan Oluşturuldu'
    }

    return (
        <div className="container mx-auto max-w-7xl animate-in fade-in zoom-in-95 duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
                        <ScrollText className="h-8 w-8 text-indigo-600" />
                        Sistem Logları & Aktiviteler
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Tüm hasta aktiviteleri (sisteme giriş, otomatik plan oluşturma işlemleri vb.) IP adresi ve zaman etiketleriyle kaydedilir.
                    </p>
                </div>
            </div>

            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-gray-500" />
                                Son Aktiviteler
                            </CardTitle>
                            <CardDescription>Sistem üzerindeki en son olay kayıtları</CardDescription>
                        </div>
                        <Input
                            placeholder="Hasta Adı, Eylem veya IP Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-500" />
                            <p className="font-medium animate-pulse">Log kayıtları yükleniyor...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            Aradığınız kritere uygun log bulunamadı.
                        </div>
                    ) : (
                        <div className="rounded-md border bg-white overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead>Tarih & Saat</TableHead>
                                        <TableHead>Hasta</TableHead>
                                        <TableHead>Eylem Türü</TableHead>
                                        <TableHead>Detaylar / IP Adresi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.map(log => {
                                        const label = actionLabels[log.action_type] || log.action_type
                                        let details = '-'
                                        if (log.metadata) {
                                            if (log.metadata.ip_address) {
                                                details = `IP: ${log.metadata.ip_address} | ${log.metadata.user_agent ? log.metadata.user_agent.substring(0, 40) + '...' : ''}`
                                            } else {
                                                details = JSON.stringify(log.metadata)
                                            }
                                        }

                                        return (
                                            <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="font-medium text-xs text-gray-500 whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString("tr-TR")}
                                                </TableCell>
                                                <TableCell className="font-bold whitespace-nowrap">
                                                    {log.patients?.full_name || <span className="text-gray-400 italic">Bilinmeyen Kullanıcı</span>}
                                                </TableCell>
                                                <TableCell className="font-semibold text-sm">
                                                    {label}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500">
                                                    {details}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
