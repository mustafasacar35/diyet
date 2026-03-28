'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type SystemPrompt = {
    id: string
    key: string
    description: string | null
    prompt_template: string
    model: string
    temperature: number
    updated_at: string
}

export default function AiSettingsPage() {
    const [prompts, setPrompts] = useState<SystemPrompt[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadPrompts()
    }, [])

    const loadPrompts = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('system_prompts')
            .select('*')
            .order('key')

        if (error) {
            console.error('Error loading prompts:', error)
            alert('Promptlar yüklenirken hata oluştu: ' + error.message)
        } else {
            setPrompts(data || [])
        }
        setLoading(false)
    }

    const handlePromptChange = (id: string, field: keyof SystemPrompt, value: string | number) => {
        setPrompts(prev => prev.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ))
    }

    const savePrompt = async (prompt: SystemPrompt) => {
        setSaving(true)
        const { error } = await supabase
            .from('system_prompts')
            .update({
                prompt_template: prompt.prompt_template,
                model: prompt.model,
                temperature: prompt.temperature,
                updated_at: new Date().toISOString()
            })
            .eq('id', prompt.id)

        if (error) {
            alert('Kaydetme başarısız: ' + error.message)
        } else {
            alert('Prompt başarıyla güncellendi.')
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
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Yapay Zeka Ayarları</h1>
                    <p className="text-muted-foreground">Sistem promptlarını ve model ayarlarını yönetin</p>
                </div>
                <Button variant="outline" onClick={loadPrompts}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Yenile
                </Button>
            </div>

            <Tabs defaultValue={prompts[0]?.key} className="w-full">
                <TabsList className="mb-4">
                    {prompts.map(p => (
                        <TabsTrigger key={p.key} value={p.key}>
                            {p.key.replace('_', ' ').toUpperCase()}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {prompts.map(prompt => (
                    <TabsContent key={prompt.id} value={prompt.key}>
                        <Card>
                            <CardHeader>
                                <CardTitle>{prompt.key.toUpperCase()}</CardTitle>
                                <CardDescription>{prompt.description || 'Bu prompt için açıklama yok.'}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Model</Label>
                                        <Input
                                            value={prompt.model}
                                            onChange={(e) => handlePromptChange(prompt.id, 'model', e.target.value)}
                                            placeholder="gemini-pro"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Sıcaklık (Temperature)</Label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            value={prompt.temperature}
                                            onChange={(e) => handlePromptChange(prompt.id, 'temperature', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Prompt Şablonu</Label>
                                    <Textarea
                                        className="font-mono text-sm min-h-[300px]"
                                        value={prompt.prompt_template}
                                        onChange={(e) => handlePromptChange(prompt.id, 'prompt_template', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Değişkenler: {`{{medication_name}}`}, vb.
                                    </p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={() => savePrompt(prompt)} disabled={saving} className="ml-auto">
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Kaydet
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {prompts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    Henüz bir prompt tanımlanmamış.
                </div>
            )}
        </div>
    )
}
