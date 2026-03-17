"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Upload, FileText, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface KeywordEntry {
    keyword: string
    type: 'positive' | 'negative'
    matchType?: 'name' | 'tag' | 'both'
}

interface BulkKeywordImportProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    existingKeywords?: KeywordEntry[]
    onSave: (keywords: KeywordEntry[]) => Promise<void>
    showMatchType?: boolean  // true for micronutrients, false for diseases
}

/**
 * Parse TXT content into keyword entries
 * Format:
 *   +keyword          → positive (önerilen)
 *   -keyword          → negative (yasaklı)
 *   +keyword:name     → positive, match only in name
 *   +keyword:tag      → positive, match only in tags
 *   +keyword:both     → positive, match in both (default)
 *   # comment         → ignored
 *   empty lines       → ignored
 */
function parseKeywords(text: string, defaultMatchType: 'name' | 'tag' | 'both' = 'both'): KeywordEntry[] {
    const lines = text.split('\n')
    const keywords: KeywordEntry[] = []

    for (const line of lines) {
        const trimmed = line.trim()

        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#')) continue

        let type: 'positive' | 'negative' = 'positive'
        let keyword = trimmed
        let matchType: 'name' | 'tag' | 'both' = defaultMatchType

        // Check prefix
        if (trimmed.startsWith('+')) {
            type = 'positive'
            keyword = trimmed.slice(1)
        } else if (trimmed.startsWith('-')) {
            type = 'negative'
            keyword = trimmed.slice(1)
        }

        // Check for match type suffix (e.g., keyword:name)
        if (keyword.includes(':')) {
            const parts = keyword.split(':')
            keyword = parts[0].trim()
            const mt = parts[1]?.trim().toLowerCase()
            if (mt === 'name' || mt === 'tag' || mt === 'both') {
                matchType = mt
            }
        }

        // Clean keyword
        keyword = keyword.trim()
        if (keyword) {
            keywords.push({ keyword, type, matchType })
        }
    }

    return keywords
}

export function BulkKeywordImport({
    open,
    onOpenChange,
    title,
    description,
    existingKeywords = [],
    onSave,
    showMatchType = false
}: BulkKeywordImportProps) {
    const [textInput, setTextInput] = useState('')
    const [parsedKeywords, setParsedKeywords] = useState<KeywordEntry[]>([...existingKeywords])
    const [saving, setSaving] = useState(false)
    const [parseError, setParseError] = useState<string | null>(null)

    // Initialize with existing keywords when dialog opens
    const handleOpenChange = useCallback((isOpen: boolean) => {
        if (isOpen) {
            setParsedKeywords([...existingKeywords])
            setTextInput('')
            setParseError(null)
        }
        onOpenChange(isOpen)
    }, [existingKeywords, onOpenChange])

    const handleParse = () => {
        try {
            const parsed = parseKeywords(textInput)
            if (parsed.length === 0) {
                setParseError('Geçerli keyword bulunamadı. Format: +önerilen veya -yasaklı')
                return
            }
            // Merge with existing, avoiding duplicates
            const existing = new Set(parsedKeywords.map(k => `${k.keyword}-${k.type}`))
            const newKeywords = parsed.filter(k => !existing.has(`${k.keyword}-${k.type}`))
            setParsedKeywords([...parsedKeywords, ...newKeywords])
            setTextInput('')
            setParseError(null)
        } catch (err) {
            setParseError('Parse hatası: ' + String(err))
        }
    }

    const handleRemove = (index: number) => {
        setParsedKeywords(prev => prev.filter((_, i) => i !== index))
    }

    const handleTypeChange = (index: number, newType: 'positive' | 'negative') => {
        setParsedKeywords(prev => prev.map((k, i) => i === index ? { ...k, type: newType } : k))
    }

    const handleMatchTypeChange = (index: number, newMatchType: 'name' | 'tag' | 'both') => {
        setParsedKeywords(prev => prev.map((k, i) => i === index ? { ...k, matchType: newMatchType } : k))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await onSave(parsedKeywords)
            onOpenChange(false)
        } catch (err) {
            setParseError('Kaydetme hatası: ' + String(err))
        } finally {
            setSaving(false)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            setTextInput(content)
        }
        reader.readAsText(file)
    }

    const positiveCount = parsedKeywords.filter(k => k.type === 'positive').length
    const negativeCount = parsedKeywords.filter(k => k.type === 'negative').length

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {/* Input Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">TXT İçeriği</label>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept=".txt"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <span><Upload className="h-4 w-4 mr-1" /> Dosya Yükle</span>
                                </Button>
                            </label>
                        </div>
                        <Textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={`Her satıra bir keyword yazın:
+önerilen_keyword
-yasaklı_keyword
${showMatchType ? '+keyword:name (sadece isimde)\n+keyword:tag (sadece tag\'de)\n+keyword:both (her ikisinde)' : ''}
# Bu bir yorum satırı`}
                            className="min-h-[120px] font-mono text-sm"
                        />
                        <div className="flex items-center gap-2">
                            <Button onClick={handleParse} disabled={!textInput.trim()}>
                                Parse Et ve Ekle
                            </Button>
                            {parseError && (
                                <span className="text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" /> {parseError}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border rounded-md">
                        <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                            <span className="text-sm font-medium">
                                Önizleme ({parsedKeywords.length} keyword)
                            </span>
                            <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    +{positiveCount} Önerilen
                                </Badge>
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                    -{negativeCount} Yasaklı
                                </Badge>
                            </div>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Keyword</TableHead>
                                        <TableHead>Tür</TableHead>
                                        {showMatchType && <TableHead>Eşleşme</TableHead>}
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {parsedKeywords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={showMatchType ? 4 : 3} className="text-center text-muted-foreground py-8">
                                                Henüz keyword eklenmedi. Yukarıdan TXT yapıştırın veya dosya yükleyin.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        parsedKeywords.map((entry, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{entry.keyword}</TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={entry.type}
                                                        onValueChange={(v) => handleTypeChange(idx, v as 'positive' | 'negative')}
                                                    >
                                                        <SelectTrigger className="w-[120px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="positive">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="text-green-600">+</span> Önerilen
                                                                </span>
                                                            </SelectItem>
                                                            <SelectItem value="negative">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="text-red-600">−</span> Yasaklı
                                                                </span>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                {showMatchType && (
                                                    <TableCell>
                                                        <Select
                                                            value={entry.matchType || 'both'}
                                                            onValueChange={(v) => handleMatchTypeChange(idx, v as 'name' | 'tag' | 'both')}
                                                        >
                                                            <SelectTrigger className="w-[100px] h-8">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="name">İsim</SelectItem>
                                                                <SelectItem value="tag">Tag</SelectItem>
                                                                <SelectItem value="both">Her İkisi</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                )}
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleRemove(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={saving || parsedKeywords.length === 0}>
                        {saving ? 'Kaydediliyor...' : `Kaydet (${parsedKeywords.length} keyword)`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
