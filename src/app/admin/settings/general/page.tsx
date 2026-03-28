"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export default function GeneralSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [settings, setSettings] = useState({
        allow_program_selection: false,
        allow_goal_selection: false
    })

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'registration_settings')
            .single()

        if (error) {
            console.error('Error loading settings:', error)
            // It might not exist yet, which is fine, we'll just use defaults
        } else if (data && data.value) {
            setSettings({
                allow_program_selection: !!data.value.allow_program_selection,
                allow_goal_selection: !!data.value.allow_goal_selection
            })
        }
        setLoading(false)
    }

    const handleToggle = (key: keyof typeof settings, checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked }))
    }

    const saveSettings = async () => {
        setSaving(true)
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'registration_settings',
                value: settings,
                updated_at: new Date().toISOString()
            })

        if (error) {
            alert('Kaydetme başarısız: ' + error.message)
        } else {
            alert('Genel ayarlar başarıyla güncellendi.')
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Genel Ayarlar</h1>
                <p className="text-muted-foreground">Sistem genelindeki kayıt ve kural yapılandırmalarını yönetin</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Hasta Kayıt Formu İzinleri</CardTitle>
                    <CardDescription>
                        Hastaların kendi başlarına kayıt olurken yapabilecekleri seçimleri kısıtlayın veya serbest bırakın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label htmlFor="program-selection" className="text-base font-semibold">Program Seçme Yetkisi</Label>
                            <p className="text-sm text-muted-foreground">
                                Açık olduğunda hastalar tüm beslenme programlarını seçebilir. Kapalı olduğunda sadece "Lipödem Beslenmesi" seçilebilir.
                            </p>
                        </div>
                        <Switch
                            id="program-selection"
                            checked={settings.allow_program_selection}
                            onCheckedChange={(checked) => handleToggle('allow_program_selection', checked)}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label htmlFor="goal-selection" className="text-base font-semibold">Hedef Seçme Yetkisi</Label>
                            <p className="text-sm text-muted-foreground">
                                Açık olduğunda hastalar farklı hedefler (Kilo verme, Alma, vs.) belirleyebilir. Kapalı olduğunda sadece "Lipödem Beslenmesi" hedefi otomatik seçilir.
                            </p>
                        </div>
                        <Switch
                            id="goal-selection"
                            checked={settings.allow_goal_selection}
                            onCheckedChange={(checked) => handleToggle('allow_goal_selection', checked)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={saveSettings} disabled={saving} className="ml-auto">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Ayarları Kaydet
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
