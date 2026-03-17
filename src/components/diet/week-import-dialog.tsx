"use client"

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, AlertCircle, Loader2, Settings, Trash2, Plus, FileSpreadsheet, Search, Key, LogIn, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useGapi } from '@/hooks/use-gapi'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WeekImportDialogProps {
    isOpen: boolean
    onClose: () => void
    onImport: (days: ParsedDay[], mode: 'replace' | 'append') => Promise<void>
    weekId: string
    checkSeasonality: (food: any, date?: Date) => { inSeason: boolean, reason?: string }
    allFoods: any[] // Now passed as a prop
    patientName?: string // New prop for auto-search
    weekNumber?: number // New prop for auto-tab selection
    autoStart?: boolean // Auto-start Google Sheets flow
    onBulkImport?: (weekData: { weekNumber: number, days: ParsedDay[] }[]) => Promise<void> // NEW: Bulk import
}

export interface ParsedDay {
    dayName: string
    date?: string
    meals: ParsedMeal[]
}

export interface ParsedMeal {
    mealName: string
    foods: ParsedFood[]
}

export interface ParsedFood {
    originalText: string
    foodName: string
    calories: number
    protein: number
    carbs: number
    fat: number
    matchedFoodId?: string
    matchConfidence?: number // 0-1
    portionMultiplier?: number
    status: 'matched' | 'unknown' | 'created'
}

type RuleType = 'replace' | 'ignore' | 'header' | 'food'

interface ImportRule {
    id: string
    rule_type: RuleType
    pattern: string
    replacement?: string
}

function ImportRulesDialog({ rules, onRulesChange }: { rules: ImportRule[], onRulesChange: () => void }) {
    const [newPattern, setNewPattern] = useState('')
    const [newReplacement, setNewReplacement] = useState('')
    const [newType, setNewType] = useState<RuleType>('replace')
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function addRule() {
        if (!newPattern.trim()) return
        setLoading(true)
        const { error } = await supabase.from('import_rules').insert({
            rule_type: newType,
            pattern: newPattern,
            replacement: (newType === 'replace' || newType === 'header' || newType === 'food') ? newReplacement : null
        })

        if (error) {
            alert('Kural eklenirken hata oluştu: ' + error.message)
        } else {
            onRulesChange()
            setNewPattern('')
            setNewReplacement('')
        }
        setLoading(false)
    }

    async function removeRule(id: string) {
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return
        setLoading(true)
        const { error } = await supabase.from('import_rules').delete().eq('id', id)
        if (error) {
            alert('Silme hatası: ' + error.message)
        } else {
            onRulesChange()
        }
        setLoading(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
                    <Settings size={14} />
                    Ayrıştırma Kuralları
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ayrıştırma Ayarları</DialogTitle>
                    <DialogDescription>
                        Metin ayrıştırılırken uygulanacak manuel kurallar ekleyin. Bu kurallar veritabanında saklanır.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2 items-end border-b pb-4">
                        <div className="grid gap-2 flex-[1.5]">
                            <Label>Kural Tipi</Label>
                            <Select value={newType} onValueChange={(v: RuleType) => setNewType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="replace">Düzelt &amp; Yemek (Replace)</SelectItem>
                                    <SelectItem value="header">Sadece Başlık (Yemek Yok)</SelectItem>
                                    <SelectItem value="food">Yemek Olarak Ekle (0 Makro)</SelectItem>
                                    <SelectItem value="ignore">Yoksay (Ignore)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2 flex-[2]">
                            <Label>Aranacak Metin (İçerir)</Label>
                            <Input value={newPattern} onChange={e => setNewPattern(e.target.value)} placeholder="Örn: Öğle (Saat..." />
                        </div>
                        {(newType === 'replace' || newType === 'header' || newType === 'food') && (
                            <div className="grid gap-2 flex-[2]">
                                <Label>{newType === 'food' ? 'Yemek Adı (Boş bırakılırsa satır alınır)' : 'Yeni Değer / Başlık Adı'}</Label>
                                <Input value={newReplacement} onChange={e => setNewReplacement(e.target.value)} placeholder={newType === 'food' ? 'Örn: Turşu' : newType === 'header' ? "Örn: ÖĞLEN" : "Örn: ÖĞLEN"} />
                            </div>
                        )}
                        <Button onClick={addRule} size="icon" className="mb-0.5" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px]">
                        {rules.length === 0 && <div className="text-center text-gray-400 py-8">Henüz kural yok.</div>}
                        <div className="space-y-2">
                            {rules.map(rule => (
                                <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${rule.rule_type === 'replace' ? 'bg-blue-100 text-blue-700' :
                                            rule.rule_type === 'header' ? 'bg-purple-100 text-purple-700' :
                                                rule.rule_type === 'food' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {rule.rule_type === 'replace' ? 'DÜZELT' :
                                                rule.rule_type === 'header' ? 'BAŞLIK' :
                                                    rule.rule_type === 'food' ? 'YEMEK' : 'YOKSAY'}
                                        </span>
                                        <span className="font-mono truncate max-w-[150px]" title={rule.pattern}>"{rule.pattern}"</span>
                                        {(rule.rule_type === 'replace' || rule.rule_type === 'header' || rule.rule_type === 'food') && (
                                            <>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-bold text-green-700">"{rule.replacement}"</span>
                                            </>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-700" onClick={() => removeRule(rule.id)} disabled={loading}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function WeekImportDialog({ isOpen, onClose, onImport, weekId, checkSeasonality, allFoods, patientName = '', weekNumber = 1, autoStart = false, onBulkImport }: WeekImportDialogProps) {
    const [step, setStep] = useState<'input' | 'review'>('input')
    const [text, setText] = useState('')
    const [parsedDays, setParsedDays] = useState<ParsedDay[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [activeTab, setActiveTab] = useState<'text' | 'google'>(autoStart ? 'google' : 'text')

    // Google State
    const gapiEnabled = isOpen && activeTab === 'google'
    const { isReady, initClient, login, isAuthenticated, error: gapiError, gapi, logs } = useGapi(gapiEnabled)
    const [apiKey, setApiKey] = useState('')
    const [clientId, setClientId] = useState('')
    const [searchQuery, setSearchQuery] = useState(patientName)
    const [foundFiles, setFoundFiles] = useState<any[]>([])
    const [selectedFile, setSelectedFile] = useState<any>(null)
    const [sheetTabs, setSheetTabs] = useState<string[]>([])
    const [selectedTab, setSelectedTab] = useState('')
    const [configOpen, setConfigOpen] = useState(false)
    const [autoImportStatus, setAutoImportStatus] = useState<string>('')
    const [pendingAutoImport, setPendingAutoImport] = useState(false)
    const [autoStartTriggered, setAutoStartTriggered] = useState(false)

    // DB Rules
    const [rules, setRules] = useState<ImportRule[]>([])

    // Bulk Import Mode
    const [bulkMode, setBulkMode] = useState<'single' | 'all'>('single')
    const [detectedWeekTabs, setDetectedWeekTabs] = useState<{ tabName: string, weekNumber: number }[]>([])

    // Auto-start effect: trigger oneClickImport when dialog opens with autoStart=true
    useEffect(() => {
        if (isOpen && autoStart && !autoStartTriggered) {
            setAutoStartTriggered(true)
            setActiveTab('google')
            // Small delay to ensure component is mounted
            setTimeout(() => {
                oneClickImport()
            }, 300)
        }
        // Reset trigger when dialog closes
        if (!isOpen) {
            setAutoStartTriggered(false)
        }
    }, [isOpen, autoStart])

    // --- WEEK TAB MATCHING ---
    function matchWeekTab(tabs: string[], targetWeek: number): string | null {
        // Normalize: "1. Hafta" → "1hafta", "1.    HAFTA" → "1hafta", "1. hafta" → "1hafta"
        const normalizeTab = (t: string) => t.toLowerCase()
            .replace(/\s+/g, '')
            .replace(/\./g, '')

        const targetPattern = `${targetWeek}hafta`

        for (const tab of tabs) {
            if (normalizeTab(tab).includes(targetPattern)) {
                return tab
            }
        }
        return null
    }



    // --- ONE-CLICK IMPORT AUTOMATION ---
    async function oneClickImport() {
        setAutoImportStatus('Bağlantı hazırlanıyor...')
        setIsProcessing(true)

        // 1. Check API Keys from localStorage
        const storedKey = localStorage.getItem('diyet_google_api_key')
        const storedClient = localStorage.getItem('diyet_google_client_id')

        if (!storedKey || !storedClient) {
            setAutoImportStatus('API anahtarları eksik. Lütfen önce Ayarları yapılandırın.')
            setConfigOpen(true)
            setIsProcessing(false)
            return
        }

        // Update state with stored values
        setApiKey(storedKey)
        setClientId(storedClient)

        // 2. Init Client and wait a moment for React state to update
        setAutoImportStatus('Google API başlatılıyor...')
        await initClient(storedKey, storedClient)

        // Wait for tokenClient to be ready (React state update delay)
        setAutoImportStatus('Servis hazırlanıyor...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 3. Set pending flag and trigger login
        // Login will be handled separately, and effect will continue the flow
        if (!isAuthenticated) {
            setAutoImportStatus('Google ile giriş için popup açılıyor...')
            setPendingAutoImport(true)
            // Small delay then trigger login
            setTimeout(() => {
                login()
            }, 500)
            return
        }

        // If already authenticated, continue flow
        await continueAutoImport()
    }

    async function continueAutoImport() {
        if (!gapi || !patientName) {
            setAutoImportStatus('Hasta adı veya bağlantı eksik.')
            setIsProcessing(false)
            return
        }

        // 4. Search Drive
        setAutoImportStatus(`"${patientName}" Drive'da aranıyor...`)
        try {
            const q = `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${patientName}' and trashed=false`
            const response = await gapi.client.drive.files.list({
                q: q,
                fields: 'files(id, name)',
                pageSize: 10
            })
            const files = response.result.files || []

            if (files.length === 0) {
                setAutoImportStatus(`"${patientName}" adında dosya bulunamadı.`)
                setIsProcessing(false)
                return
            }

            setFoundFiles(files)

            // 5. Select first matching file
            const file = files[0]
            setSelectedFile(file)
            setAutoImportStatus(`"${file.name}" açılıyor...`)

            // 6. Fetch tabs
            const tabResponse = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: file.id,
                fields: 'sheets.properties.title'
            })
            const tabs = tabResponse.result.sheets?.map((s: any) => s.properties.title) || []
            setSheetTabs(tabs)

            // 7. Detect all week tabs for bulk import option
            const weekTabs = detectWeekTabs(tabs)
            setDetectedWeekTabs(weekTabs)

            // 8. Auto-select current week tab
            let matchedTab = matchWeekTab(tabs, weekNumber)

            if (!matchedTab) {
                setAutoImportStatus(`${weekNumber}. Hafta tabı otomatik bulunamadı. Lütfen listeden seçin.`)
                matchedTab = tabs[0] // Fallback to first tab
            }

            setSelectedTab(matchedTab || '')

            // If multiple week tabs found, show selection UI instead of auto-importing
            if (weekTabs.length > 1) {
                setAutoImportStatus(`${weekTabs.length} hafta tabı bulundu. Tek hafta mı, tüm haftalar mı?`)
                setIsProcessing(false)
                return // Wait for user selection
            }

            if (matchedTab) {
                // 9. Import from sheet (single tab)
                await fetchTabContent(file.id, matchedTab)
            } else {
                setIsProcessing(false) // Stop processing to let user select
            }

        } catch (err: any) {
            setAutoImportStatus('Hata: ' + (err.result?.error?.message || err.message))
            setIsProcessing(false)
        }
    }

    // Helper: Fetch content from a specific tab
    async function fetchTabContent(fileId: string, tabName: string) {
        setAutoImportStatus(`"${tabName}" verisi çekiliyor...`)
        setIsProcessing(true) // Ensure processing state

        try {
            const range = `${tabName}!A:E`
            const dataResponse = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: fileId,
                range: range
            })

            const rows = dataResponse.result.values
            if (!rows || rows.length === 0) {
                setAutoImportStatus('Sayfa boş veya veri okunamadı.')
                setIsProcessing(false)
                return
            }

            // Convert to text for parser
            const lines: string[] = []
            for (const row of rows) {
                if (row && row.length > 0) {
                    // Boş hücreleri koru, sadece tamamen boş satırları atla
                    const hasContent = row.some((c: any) => c !== null && c !== undefined && String(c).trim() !== '')
                    if (hasContent) {
                        // Satırı 5 sütuna padle (A-E: Name, Cal, Carbs, Prot, Fat)
                        // Google Sheets API trailing boş hücreleri döndürmeyebilir
                        const paddedRow = [...row]
                        while (paddedRow.length < 5) {
                            paddedRow.push('')
                        }
                        // Hücreleri tab ile birleştir, boşları da dahil et (sütun sırasını koru)
                        lines.push(paddedRow.map((c: any) => String(c ?? '').trim()).join('\t'))
                    }
                }
            }

            const combinedText = lines.join('\n')
            setText(combinedText)
            setAutoImportStatus('Veriler ayrıştırılıyor...')

            // Parse and show review
            parseText(combinedText)
            setAutoImportStatus('')
            // Don't set isProcessing false yet? parseText might be sync. 
            // In original code, isProcessing wasn't set to false explicitly on success, maybe useEffect or review step handles it?
            // Actually original code didn't set isProcessing(false) on success, likely because dialog content switches to 'review' step or closes.
            // Let's check parseText... it probably sets parsedDays.
            // But we need to stop spinner.
            setIsProcessing(false)

        } catch (err: any) {
            setAutoImportStatus('Veri çekme hatası: ' + (err.result?.error?.message || err.message))
            setIsProcessing(false)
        }
    }

    async function handleManualTabChange(newTab: string) {
        if (!selectedFile || !gapi) return
        setSelectedTab(newTab)
        await fetchTabContent(selectedFile.id, newTab)
    }

    // --- BULK IMPORT ALL WEEKS ---
    async function handleBulkImportAllWeeks() {
        if (!selectedFile || !gapi || detectedWeekTabs.length === 0) {
            setAutoImportStatus('Dosya veya hafta tabları eksik.')
            return
        }

        setIsProcessing(true)
        const allWeekData: { weekNumber: number, days: ParsedDay[] }[] = []

        for (let i = 0; i < detectedWeekTabs.length; i++) {
            const weekTab = detectedWeekTabs[i]
            setAutoImportStatus(`${weekTab.tabName} çekiliyor... (${i + 1}/${detectedWeekTabs.length})`)

            try {
                const range = `${weekTab.tabName}!A:E`
                const dataResponse = await gapi.client.sheets.spreadsheets.values.get({
                    spreadsheetId: selectedFile.id,
                    range: range
                })

                const rows = dataResponse.result.values
                if (!rows || rows.length === 0) {
                    console.warn(`Tab "${weekTab.tabName}" boş, atlanıyor.`)
                    continue
                }

                // Convert to text for parser
                const lines: string[] = []
                for (const row of rows) {
                    if (row && row.length > 0) {
                        // Boş hücreleri koru, sadece tamamen boş satırları atla
                        const hasContent = row.some((c: any) => c !== null && c !== undefined && String(c).trim() !== '')
                        if (hasContent) {
                            // Satırı 5 sütuna padle (A-E: Name, Cal, Carbs, Prot, Fat)
                            // Google Sheets API trailing boş hücreleri döndürmeyebilir
                            const paddedRow = [...row]
                            while (paddedRow.length < 5) {
                                paddedRow.push('')
                            }
                            // Hücreleri tab ile birleştir, boşları da dahil et (sütun sırasını koru)
                            lines.push(paddedRow.map((c: any) => String(c ?? '').trim()).join('\t'))
                        }
                    }
                }

                const combinedText = lines.join('\n')

                // Parse this week's data - use internal parsing logic
                const days = parseTextToDays(combinedText, allFoods)

                if (days.length > 0) {
                    allWeekData.push({
                        weekNumber: weekTab.weekNumber,
                        days: days
                    })
                }
            } catch (err: any) {
                console.error(`Hafta ${weekTab.weekNumber} çekilemedi:`, err)
            }
        }

        setAutoImportStatus(`${allWeekData.length} hafta verisi işleniyor...`)

        // Call the bulk import callback
        if (onBulkImport && allWeekData.length > 0) {
            await onBulkImport(allWeekData)
            setAutoImportStatus('')
            onClose()
        } else {
            setAutoImportStatus('Aktarılacak veri bulunamadı.')
        }

        setIsProcessing(false)
    }

    // --- DETECT ALL WEEK TABS ---
    function detectWeekTabs(tabs: string[]): { tabName: string, weekNumber: number }[] {
        const weekTabs: { tabName: string, weekNumber: number }[] = []
        // Stricter pattern: Only match "X. hafta" or "Hafta X". Exclude "pdf" etc.
        const weekPattern = /^(\d+)\.?\s*hafta$|^hafta\s*(\d+)$/i

        for (const tab of tabs) {
            const trimmedTab = tab.trim()
            const match = trimmedTab.match(weekPattern)
            if (match) {
                weekTabs.push({
                    tabName: tab,
                    weekNumber: parseInt(match[1] || match[2], 10)
                })
            }
        }

        // Sort by week number
        weekTabs.sort((a, b) => a.weekNumber - b.weekNumber)
        return weekTabs
    }

    // New helper for bulk import parsing
    function parseTextToDays(inputText: string, allFoods: any[]): ParsedDay[] {
        const result: ParsedDay[] = []

        // DEBUG LOGGING
        console.log('--- PARSER START ---')

        const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        // Reordered to prevent "CUMA" matching inside "CUMARTESİ"
        const dayNames = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMARTESİ', 'CUMA', 'PAZAR']
        const mealHeaders = ['KAHVALTI', 'ÖĞLE', 'ÖĞLEN', 'AKŞAM', 'ARA ÖĞÜN', 'KUŞLUK', 'GEÇ GECE']

        let currentDay: ParsedDay | null = null
        let currentMeal: ParsedMeal | null = null

        for (const line of lines) {
            console.log('Processing line:', line) // Log every line

            // Apply rules first
            let processedLine = line
            for (const rule of rules) {
                if (rule.rule_type === 'ignore' && processedLine.includes(rule.pattern)) {
                    processedLine = ''
                    break
                }
                if (rule.rule_type === 'replace' && rule.replacement) {
                    processedLine = processedLine.replace(new RegExp(rule.pattern, 'gi'), rule.replacement)
                }
            }
            if (!processedLine) continue

            // AGGRESSIVE FILTERING REMOVED: User wants to process foods starting with * (e.g. "*Avokadolu omlet")
            // Informational lines should be handled by 'ignore' rules defined by the user.

            // Remove common garbage characters from start
            let cleanLine = processedLine.replace(/^['"•\-\*✦➤>]\s*/, '').trim()

            // Filter out junk lines
            if (
                cleanLine.length < 2 || // Too short
                cleanLine.match(/^\d+$/) || // Only digits "983"
                cleanLine.match(/^\d+\s*\(x\)/i) || // "1032 (x)"
                cleanLine.match(/kcal$/i) || // Ends with kcal
                cleanLine.match(/^toplam/i) || // Starts with Toplam
                cleanLine.match(/^\(x\)$/i) || // Just (x)
                cleanLine.match(/^[\d\s\t.,]+$/) || // Only digits/spaces/tabs (daily totals like "983\t13\t55\t79")
                // cleanLine.match(/^\t/) || // REMOVED: Starts with tab check prevented indented lines
                cleanLine.match(/^günlük/i) || // Begins with "Günlük..." (daily tips)
                cleanLine.match(/yerine.*ekleyebilirsiniz/i) || // "... yerine ... ekleyebilirsiniz" (substitution tips)
                cleanLine.match(/için.*değiştirebilirsiniz/i) || // "... için ... değiştirebilirsiniz" (substitution tips)
                cleanLine.match(/önerilir$/i) // Ends with "önerilir" (recommendations)
            ) {
                console.log('-> IGNORED:', cleanLine)
                continue
            }

            const upperLine = cleanLine.toLocaleUpperCase('tr-TR')

            // Check day (Relaxed Match)
            const matchedDay = dayNames.find(d => upperLine.includes(d))
            if (matchedDay) {
                console.log(`-> Day MATCHED: ${matchedDay} in "${upperLine}"`)
                if (currentDay) result.push(currentDay)
                currentDay = { dayName: matchedDay, meals: [] }
                currentMeal = null
                continue
            }

            // Check meal header
            const matchedMeal = mealHeaders.find(m => upperLine === m || upperLine.startsWith(m + ' '))
            if (matchedMeal && currentDay) {
                currentMeal = { mealName: matchedMeal, foods: [] }
                currentDay.meals.push(currentMeal)
                continue
            }

            // Food line
            if (currentMeal && currentDay) {
                // Tab ile ayır (Google Sheets'ten gelen veri)
                let parts = cleanLine.split('\t')
                // Eğer tab yoksa, 2+ boşlukla dene
                if (parts.length === 1) {
                    parts = cleanLine.split(/ {2,}/)
                }

                // Handle indentation: Find first non-empty column
                let nameIndex = 0
                while (nameIndex < parts.length && !parts[nameIndex]?.trim()) {
                    nameIndex++
                }

                // If all columns are empty, skip
                if (nameIndex >= parts.length) continue

                let foodName = parts[nameIndex]?.trim() || cleanLine

                // Skip if foodName is too short or just numbers (daily total)
                if (!foodName || foodName.length < 2 || foodName.match(/^[\d.,\s]+$/)) continue

                // Check for inline nutrition values
                let lineCalories = 0, lineProtein = 0, lineCarbs = 0, lineFat = 0
                let hasLineValues = false
                const cleanNum = (val: string) => {
                    if (!val) return 0
                    // Virgül ve nokta ile sayıları temizle
                    const cleaned = val.replace(',', '.').replace(/[^0-9.]/g, '')
                    return parseFloat(cleaned) || 0
                }

                // parts[0] = name, sonraki sütunlar makrolar (Name Index'e göre kaydır)
                // Google Sheets sırası: Kalori > Karbonhidrat > Protein > Yağ
                if (parts.length >= nameIndex + 2) {
                    // Sütunları tara - Name [nameIndex], Cal [nameIndex+1], Carbs [nameIndex+2], Protein [nameIndex+3], Fat [nameIndex+4]
                    const cal = cleanNum(parts[nameIndex + 1])
                    const carb = parts.length >= nameIndex + 3 ? cleanNum(parts[nameIndex + 2]) : 0
                    const prot = parts.length >= nameIndex + 4 ? cleanNum(parts[nameIndex + 3]) : 0
                    const fat = parts.length >= nameIndex + 5 ? cleanNum(parts[nameIndex + 4]) : 0

                    // En az kalori değeri varsa veya herhangi bir makro varsa
                    if (cal > 0 || prot > 0 || carb > 0 || fat > 0) {
                        lineCalories = cal
                        lineProtein = prot
                        lineCarbs = carb
                        lineFat = fat
                        hasLineValues = true
                    }
                }

                // If no tab separation, try regex extraction for "406 1 33 30" pattern at end of line
                if (!hasLineValues) {
                    // Pattern: matches 4 numbers at the end of string
                    const macroMatch = cleanLine.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/)
                    if (macroMatch) {
                        // Google Sheets sırası: Kalori > Karbonhidrat > Protein > Yağ
                        lineCalories = parseInt(macroMatch[1])
                        lineCarbs = parseInt(macroMatch[2])
                        lineProtein = parseInt(macroMatch[3])
                        lineFat = parseInt(macroMatch[4])
                        hasLineValues = true
                        // Remove macros from name
                        // foodName = foodName.replace(macroMatch[0], '').trim() 
                        // No, foodName is parts[0], which should be fine if split worked.
                        // But if split didn't work (spaces), foodName is whole line.
                        // So we should clean foodName.
                        if (foodName === cleanLine) {
                            // clean the food name
                            const namePart = cleanLine.substring(0, macroMatch.index).trim()
                            if (namePart.length > 1) { // valid name
                                // We can't easily re-assign const foodName, so let's use the local scope
                                // Actually const foodName is blocked scope.
                                // Let's rely on logic below.
                            }
                        }
                    }
                }

                // Try to match with DB
                const matchResult = findBestMatch(foodName)

                // Prioritize line values
                const finalCalories = hasLineValues ? lineCalories : (matchResult ? (allFoods.find(f => f.id === matchResult.id)?.calories || 0) : 0)
                const finalProtein = hasLineValues ? lineProtein : (matchResult ? (allFoods.find(f => f.id === matchResult.id)?.protein || 0) : 0)
                const finalCarbs = hasLineValues ? lineCarbs : (matchResult ? (allFoods.find(f => f.id === matchResult.id)?.carbs || 0) : 0)
                const finalFat = hasLineValues ? lineFat : (matchResult ? (allFoods.find(f => f.id === matchResult.id)?.fat || 0) : 0)

                currentMeal.foods.push({
                    originalText: processedLine,
                    foodName: foodName.replace(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*$/, '').trim(), // Clean macros from name just in case
                    calories: finalCalories,
                    protein: finalProtein,
                    carbs: finalCarbs,
                    fat: finalFat,
                    matchedFoodId: matchResult?.id, // Her zaman eşleşme varsa ayarla
                    matchConfidence: matchResult?.score || 0,
                    status: matchResult ? 'matched' : (hasLineValues ? 'created' : 'unknown')
                })
            }
        }

        if (currentDay) result.push(currentDay)
        console.log('--- PARSER END --- Result:', result)
        return result
    }

    // Effect to continue auto-import after login
    useEffect(() => {
        if (isAuthenticated && pendingAutoImport) {
            setPendingAutoImport(false) // Reset flag to prevent re-runs
            continueAutoImport()
        }
    }, [isAuthenticated, pendingAutoImport])

    // Load Rules & Foods
    useEffect(() => {
        if (isOpen) {
            fetchFoods()
            fetchRules()
        }
    }, [isOpen])

    async function fetchRules() {
        const { data } = await supabase.from('import_rules').select('*').order('created_at', { ascending: false })
        if (data) setRules(data)
    }

    async function fetchFoods() {
        console.log("WeekImportDialog: Fetching foods (v2 patch)...")
        // Fetch most recent foods first to ensure newly added ones are found immediately
        const { data } = await supabase.from('foods').select('id, name').order('created_at', { ascending: false }).limit(10000)
        if (data) setLocalFoods(data)
    }

    // Correction: Adding local state for foods to fix the bug in original code
    const [localFoods, setLocalFoods] = useState<any[]>(allFoods || [])

    // Sync prop to local state
    useEffect(() => {
        if (allFoods) setLocalFoods(allFoods)
    }, [allFoods])

    // --- PARSER LOGIC ---
    function parseText(input: string) {
        setIsProcessing(true)
        const appendLog = (msg: string) => console.log(`[Parser] ${msg}`) // Fix: Define local logger
        appendLog(`Starting parse. Input length: ${input.length}`)

        // Robust split for various newline types
        const lines = input.split(/\r?\n/).map(l => l.trim()).filter(l => l)
        appendLog(`Total lines to process: ${lines.length}`)

        const days: ParsedDay[] = []
        let currentDay: ParsedDay | null = null
        let currentMeal: ParsedMeal | null = null

        // Order matters! Check longer words first to avoid 'CUMA' matching inside 'CUMARTESİ'
        const dayKeywords = ['PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMARTESİ', 'CUMA', 'PAZAR']
        const mealKeywords = ['KAHVALTI', 'ÖĞLE', 'ÖĞLEN', 'AKŞAM', 'ARA', 'SAHUR', 'İFTAR']

        // Regex to identify food line with macros
        // Allow tabs or spaces. Handle comma/dot decimals.
        // ^(name) (cal) (carb) (pro) (fat)$
        const foodMacroRegex = /^(.*?)\s+([0-9]+(?:[.,][0-9]+)?)\s+([0-9]+(?:[.,][0-9]+)?)\s+([0-9]+(?:[.,][0-9]+)?)\s+([0-9]+(?:[.,][0-9]+)?)$/

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            // appendLog(`Line ${i+1}: ${line.substring(0, 30)}...`) // Verbose log

            // APPLY RULES FIRST
            let shouldSkip = false
            let forcedHeaderName = null
            let forcedFoodName = null

            for (const rule of rules) {
                if (line.includes(rule.pattern)) {
                    if (rule.rule_type === 'ignore') {
                        shouldSkip = true
                        break
                    } else if (rule.rule_type === 'replace') {
                        line = line.replace(rule.pattern, rule.replacement || '')
                    } else if (rule.rule_type === 'header') {
                        forcedHeaderName = rule.replacement || 'ÖĞÜN'
                        break
                    } else if (rule.rule_type === 'food') {
                        forcedFoodName = rule.replacement || line
                        break
                    }
                }
            }
            if (shouldSkip) continue

            const upperLine = line.toLocaleUpperCase('tr-TR')

            // SPECIAL: Forced Header Rule
            if (forcedHeaderName) {
                if (!currentDay) {
                    currentDay = { dayName: 'BELİRSİZ GÜN', meals: [] }
                    days.push(currentDay)
                }
                currentMeal = { mealName: forcedHeaderName, foods: [] }
                currentDay.meals.push(currentMeal)
                continue
            }

            // 1. Detect Day Header
            // Check if line contains a day name.
            const foundDay = dayKeywords.find(d => upperLine.includes(d))
            if (foundDay) {
                appendLog(`Day Found: ${foundDay} in line "${line}"`)
                currentDay = {
                    dayName: line,
                    meals: []
                }
                days.push(currentDay)
                currentMeal = null
                continue
            }

            // 2. Detect Meal Header
            // Prioritize keywords.
            const foundMealKeyword = mealKeywords.find(mk => {
                const regex = new RegExp(`(^|\\s)${mk}($|\\s|[0-9])`, 'i')
                return regex.test(upperLine)
            })

            // If it matches a Meal Keyword OR (is strict text line inside a Day and NOT a food macro line)
            if (foundMealKeyword) {
                appendLog(`Meal Header Found: ${foundMealKeyword} in line "${line}"`)
                if (!currentDay) {
                    appendLog(`Warning: Meal found but no Day detected yet. Creating generic day.`)
                    currentDay = { dayName: 'BELİRSİZ GÜN', meals: [] }
                    days.push(currentDay)
                }

                currentMeal = {
                    mealName: line, // Use full line as name (e.g. "Öğle (Saat 12:00)")
                    foods: []
                }
                currentDay?.meals.push(currentMeal)

                // CRITICAL: If this line was a header (like "Öğle ... 90 0 0 10"), do NOT parse it as food.
                // We assume headers with macros are Subtotals, not items to eat.
                continue
            }

            // 3. Check Forced Food (Zero Macro)
            if (forcedFoodName) {
                if (currentMeal) {
                    appendLog(`Forced Food Rule Matched: ${forcedFoodName} (0 macros)`)
                    const newFood: ParsedFood = {
                        originalText: forcedFoodName,
                        foodName: forcedFoodName,
                        calories: 0, carbs: 0, protein: 0, fat: 0,
                        status: 'created'
                    }
                    currentMeal.foods.push(newFood)
                }
                continue
            }

            // 4. Detect Food Row
            const match = line.match(foodMacroRegex)
            if (match) {
                if (!currentMeal) {
                    // Food found but no meal? Skip or create generic?
                    // Let's skip for now, or log warning.
                    // appendLog(`Food skipped (no meal): ${line.substring(0, 10)}...`)
                    continue
                }

                let rawName = match[1].trim()
                if (!rawName || rawName.length < 2) continue

                // Cleanup rawName
                rawName = rawName.replace(/^[-.]+\s*/, '').replace(/\s*[-.]+$/, '')

                const val1 = parseFloat(match[2].replace(',', '.'))
                const val2 = parseFloat(match[3].replace(',', '.'))
                const val3 = parseFloat(match[4].replace(',', '.'))
                const val4 = parseFloat(match[5].replace(',', '.'))

                // Log found food
                // appendLog(`Food Parsed: ${rawName} (${val1}cal)`)

                const bestMatch = findBestMatch(rawName)

                const newFood: ParsedFood = {
                    originalText: rawName,
                    foodName: rawName,
                    calories: val1,
                    carbs: val2,
                    protein: val3,
                    fat: val4,
                    matchedFoodId: bestMatch?.id,
                    matchConfidence: bestMatch?.score,
                    status: bestMatch && bestMatch.score > 0.75 ? 'matched' : (bestMatch && bestMatch.score > 0.6) ? 'unknown' : 'created'
                }
                // Note: Changed default status logic above slightly for UX

                currentMeal.foods.push(newFood)
            }
        }

        appendLog(`Parse complete. Found ${days.length} days.`)
        setParsedDays(days)
        setStep('review')
        setIsProcessing(false)
    }

    function findBestMatch(text: string) {
        if (!localFoods.length) return null

        const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9ğüşıöç]/g, '')
        const target = normalize(text)

        let best = null
        let bestScore = 0

        for (const food of localFoods) {
            const current = normalize(food.name)

            // 1. Exact or Substring Match (DB contains Target)
            if (current.includes(target)) {
                // Score based on how much of the DB name is covered by target
                // "Elma" (DB) vs "Elma (Amasya)" (Target) -> DB matches Target? No, "elma" includes "elmaamasya" is False.
                // "Elma (Amasya)" (DB) vs "Elma" (Target) -> DB includes Target.
                // Score = 4 / 12 = 0.33 (Low match).

                // If Target is "Yeşillikler (full...)" and DB is "Yeşillikler (full...)" -> Score 1.
                const score = target.length / current.length
                if (score > bestScore) {
                    bestScore = score
                    best = food
                }
            }
            // 2. Reverse Substring Match REMOVED to prevent "1 adet domates" matching "Tavuk Sote (.... 1 adet domates...)"

            // 3. Prefix Boost: If one starts with the other, it's a very strong match intent
            // e.g. "Yeşillikler" vs "Yeşillikler (Bol Limonlu)"
            if (current.startsWith(target) || target.startsWith(current)) {
                // If the shorter one is at least 3 chars long (avoid matching 'e' to 'elma')
                const shorterLen = Math.min(current.length, target.length)
                if (shorterLen >= 3) {
                    // Set a high score, but prefer exact matches (1.0)
                    // We use 0.95 to ensure it passes the threshold
                    if (0.95 > bestScore) {
                        bestScore = 0.95
                        best = food
                    }
                }
            }
        }

        // Boost score for exact matches (after normalization)
        if (best && normalize(best.name) === target) {
            bestScore = 1.0
        }

        // Threshold lowered to 0.75 for flexibility, but prefix matches are 0.95
        return best ? { id: best.id, score: bestScore } : null
    }

    const [importMode, setImportMode] = useState<'append' | 'replace'>('replace')

    // Auto-search when opening dialog if name provided
    useEffect(() => {
        if (isOpen && patientName && isAuthenticated && activeTab === 'google' && !foundFiles.length) {
            setSearchQuery(patientName)
            // searchDrive() // Dont auto search to avoid spam/errors if not desired
        }
    }, [isOpen, patientName, isAuthenticated, activeTab])

    // --- GOOGLE DRIVES/SHEETS LOGIC ---
    // Save keys to local storage or state
    // Save keys to local storage or state & Init when ready
    useEffect(() => {
        const storedKey = localStorage.getItem('diyet_google_api_key')
        const storedClient = localStorage.getItem('diyet_google_client_id')
        if (storedKey) setApiKey(storedKey)
        if (storedClient) setClientId(storedClient)

        // Only try to init if scripts are ready AND we have keys
        if (storedKey && storedClient && isReady) {
            // Check if already authenticated or client ready? 
            // The hook handles re-init protection mostly, but let's call it.
            initClient(storedKey, storedClient)
        }
    }, [isReady]) // Dependency added: runs when scripts finish loading

    // Re-init if keys change
    function saveKeys() {
        if (!apiKey || !clientId) return
        localStorage.setItem('diyet_google_api_key', apiKey)
        localStorage.setItem('diyet_google_client_id', clientId)
        initClient(apiKey, clientId)
        setConfigOpen(false)
    }

    async function searchDrive() {
        if (!gapi || !searchQuery) return
        setIsProcessing(true)
        try {
            // Drive API: list files query
            // mimeType = 'application/vnd.google-apps.spreadsheet'
            const q = `mimeType='application/vnd.google-apps.spreadsheet' and name contains '${searchQuery}' and trashed=false`
            const response = await gapi.client.drive.files.list({
                q: q,
                fields: 'files(id, name)',
                pageSize: 10
            })
            setFoundFiles(response.result.files || [])
        } catch (err: any) {
            alert('Arama başarısız: ' + (err.result?.error?.message || err.message))
        }
        setIsProcessing(false)
    }

    async function fetchTabs(file: any) {
        setSelectedFile(file)
        setSheetTabs([])
        setSelectedTab('')
        setIsProcessing(true)
        try {
            const response = await gapi.client.sheets.spreadsheets.get({
                spreadsheetId: file.id,
                fields: 'sheets.properties.title'
            })
            const tabs = response.result.sheets?.map((s: any) => s.properties.title) || []

            // User requested explicit week selection.
            // Let's default to showing all, or prioritize those with "Hafta"
            setSheetTabs(tabs)

            // Detect weeks for bulk import UI
            const weekTabs = detectWeekTabs(tabs)
            setDetectedWeekTabs(weekTabs)
        } catch (err: any) {
            alert('Tablar alınamadı: ' + (err.result?.error?.message || err.message))
        }
        setIsProcessing(false)
    }

    async function importFromSheet() {
        if (!selectedFile || !selectedTab) return
        setIsProcessing(true)
        try {
            // Read range A:E
            const range = `${selectedTab}!A:E`
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: selectedFile.id,
                range: range
            })

            const rows = response.result.values
            if (!rows || rows.length === 0) {
                alert('Sayfa boş veya veri okunamadı.')
                return
            }

            // Convert columns to text format expected by parser
            // Col 0: Name, Col 1..4: Macros
            // We join them with spaces.
            const textData = rows.map((row: any[]) => row.join('\t')).join('\n')
            setText(textData)

            // Auto switch to processing
            // parseText(textData) // We can call this directly or just let user see it in text area
            // Let's just set text and switch tab to view it
            setActiveTab('text')
            // Optionally auto-parse?
            // parseText(textData) 
            alert('Veriler çekildi. "Ayrıştır ve Önizle" butonuna basarak kontrol edin.')

        } catch (err: any) {
            alert('Veri çekme hatası: ' + (err.result?.error?.message || err.message))
        }
        setIsProcessing(false)
    }

    async function handleConfirm() {
        if (!parsedDays.length) return
        await onImport(parsedDays, importMode)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
                <div className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle>Dışarıdan Program Al</DialogTitle>
                        <DialogDescription>
                            İster metin yapıştırın, ister Google Sheets'ten çekin.
                        </DialogDescription>
                    </div>
                    {step === 'input' && (
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('text')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'text' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText size={14} /> Metin / Excel
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('google')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'google' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet size={14} /> Google Sheets
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-hidden min-h-0 py-4 px-6">
                    {step === 'input' ? (
                        activeTab === 'text' ? (
                            <div className="h-full flex flex-col gap-2">
                                <div className="flex justify-between items-center px-1">
                                    <Label>Yapıştırılacak Metin (Tablo)</Label>
                                    <ImportRulesDialog rules={rules} onRulesChange={fetchRules} />
                                </div>
                                <Textarea
                                    className="flex-1 font-mono text-sm whitespace-pre"
                                    placeholder="Örn: PAZARTESİ\nKAHVALTI\nYumurta 1 adet 90 0 6 5"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2">
                                {/* ONE-CLICK IMPORT BUTTON */}
                                <div className="bg-green-50 border border-green-100 p-4 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-green-800 font-semibold">
                                            <FileSpreadsheet size={18} /> Google Sheets - {weekNumber}. Hafta
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setConfigOpen(!configOpen)} className="text-green-700 h-8">
                                            <Key size={14} className="mr-1" /> Ayarlar
                                        </Button>
                                    </div>

                                    {/* Status Message */}
                                    {autoImportStatus && (
                                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm border border-blue-200 flex items-center gap-2">
                                            <Loader2 size={14} className="animate-spin" />
                                            {autoImportStatus}
                                        </div>
                                    )}

                                    {/* NEW: File & Tab Selector Dashboard */}
                                    {isAuthenticated && selectedFile && selectedTab && !isProcessing && (
                                        <div className="p-3 bg-white border border-green-200 rounded-lg shadow-sm space-y-2 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 border-b border-gray-100 pb-2">
                                                <FileSpreadsheet className="text-green-600" size={16} />
                                                <span className="truncate flex-1" title={selectedFile.name}>{selectedFile.name}</span>
                                                <div className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Aktif</div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <Label className="text-xs text-gray-500 whitespace-nowrap">Seçili Sayfa:</Label>
                                                <select
                                                    className="flex-1 h-8 text-xs border border-gray-300 rounded px-2 bg-white outline-none focus:border-green-500 cursor-pointer hover:border-green-400 transition-colors"
                                                    value={selectedTab}
                                                    onChange={(e) => handleManualTabChange(e.target.value)}
                                                >
                                                    {sheetTabs.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* BULK IMPORT SELECTION - when multiple week tabs found */}
                                    {isAuthenticated && selectedFile && detectedWeekTabs.length > 1 && !isProcessing && (
                                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg shadow-sm space-y-3 animate-in fade-in slide-in-from-top-1">
                                            <div className="text-sm font-semibold text-purple-800">
                                                📚 {detectedWeekTabs.length} hafta tabı bulundu
                                            </div>
                                            <div className="text-xs text-purple-600">
                                                Bulunan: {detectedWeekTabs.map(t => t.tabName).join(', ')}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-100"
                                                    onClick={() => {
                                                        setBulkMode('single')
                                                        if (selectedTab && selectedFile) {
                                                            fetchTabContent(selectedFile.id, selectedTab)
                                                        }
                                                    }}
                                                >
                                                    Sadece {weekNumber}. Hafta
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                                    onClick={() => {
                                                        setBulkMode('all')
                                                        handleBulkImportAllWeeks()
                                                    }}
                                                >
                                                    Tüm Haftaları Çek ({detectedWeekTabs.length})
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {(configOpen || !apiKey || !clientId) && (
                                        <div className="bg-white p-3 rounded border border-green-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="apiKey">API Key</Label>
                                                <Input id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." className="font-mono text-xs" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="clientId">Client ID</Label>
                                                <Input id="clientId" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="733...apps.googleusercontent.com" className="font-mono text-xs" />
                                            </div>
                                            <Button onClick={saveKeys} size="sm" className="w-full bg-green-600 hover:bg-green-700">Kaydet</Button>
                                        </div>
                                    )}

                                    {gapiError && (
                                        <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-xs border border-red-200">
                                            <strong>Hata:</strong> {gapiError}
                                            <br />
                                            <span className="opacity-75">API Key kısıtlamalarını kontrol edin.</span>
                                        </div>
                                    )}

                                    {/* MAIN ACTION BUTTON */}
                                    <div className="pt-2">
                                        <Button
                                            onClick={oneClickImport}
                                            disabled={isProcessing}
                                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg py-6 text-lg font-semibold"
                                        >
                                            {isProcessing ? (
                                                <Loader2 className="animate-spin mr-2" size={20} />
                                            ) : (
                                                <FileSpreadsheet className="mr-2" size={20} />
                                            )}
                                            {isAuthenticated ? `${weekNumber}. Hafta Verisini Getir` : 'Bağlan ve Getir'}
                                        </Button>
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            {patientName ? `"${patientName}" aranacak` : 'Hasta adı ile arama yapılacak'}
                                        </p>
                                    </div>

                                    {isAuthenticated && (
                                        <div className="flex items-center gap-2 text-sm text-green-700 bg-white px-3 py-2 rounded border border-green-200">
                                            <Check size={14} className="bg-green-100 rounded-full p-0.5" /> Google Bağlantısı Aktif
                                        </div>
                                    )}
                                </div>

                                {/* Search Section */}
                                {isAuthenticated && (
                                    <div className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Dosya adı veya Hasta ismi..."
                                                onKeyDown={e => e.key === 'Enter' && searchDrive()}
                                            />
                                            <Button onClick={searchDrive} disabled={isProcessing}>
                                                {isProcessing ? <Loader2 className="animate-spin" /> : <Search size={16} />} Ara
                                            </Button>
                                        </div>

                                        {foundFiles.length > 0 && (
                                            <div className="border rounded-md overflow-hidden">
                                                <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 border-b">Bulunan Dosyalar</div>
                                                <div className="max-h-40 overflow-y-auto divide-y">
                                                    {foundFiles.map(file => (
                                                        <div
                                                            key={file.id}
                                                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 flex justify-between items-center ${selectedFile?.id === file.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                                                            onClick={() => fetchTabs(file)}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <FileSpreadsheet size={14} className="text-green-600" />
                                                                {file.name}
                                                            </div>
                                                            {selectedFile?.id === file.id && isProcessing && <Loader2 size={12} className="animate-spin text-blue-600" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Tab Selection */}
                                        {selectedFile && sheetTabs.length > 0 && (
                                            <div className="space-y-2 animate-in fade-in">
                                                <Label>Sayfa (Tab) Seçin:</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {sheetTabs.map(tab => (
                                                        <div
                                                            key={tab}
                                                            onClick={() => setSelectedTab(tab)}
                                                            className={`px-3 py-2 border rounded text-center text-sm cursor-pointer transition-all ${selectedTab === tab ? 'bg-green-600 text-white border-green-600 shadow' : 'hover:bg-gray-50 hover:border-gray-300'}`}
                                                        >
                                                            {tab}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-4 flex justify-end">
                                                    <Button onClick={importFromSheet} disabled={!selectedTab || isProcessing} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                                                        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                                                        Verileri Çek ve Düzenle
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <ScrollArea className="h-full border rounded-md p-4 bg-gray-50">
                            {parsedDays.length === 0 && <div className="text-center text-gray-500 py-10">Hiçbir veri algılanamadı. Formatı kontrol edin veya Kurallar ekleyin.</div>}

                            {parsedDays.map((day, dIdx) => (
                                <div key={dIdx} className="mb-6 bg-white border rounded shadow-sm overflow-hidden">
                                    <div className="bg-orange-100 px-4 py-2 font-bold text-orange-900 border-b border-orange-200">
                                        {day.dayName}
                                    </div>
                                    <div className="divide-y">
                                        {day.meals.map((meal, mIdx) => (
                                            <div key={mIdx}>
                                                <div className="bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-800 uppercase tracking-wide">
                                                    {meal.mealName}
                                                </div>
                                                <div className="p-2 space-y-1">
                                                    {meal.foods.map((food, fIdx) => (
                                                        <div key={fIdx} className="flex items-center gap-3 text-sm p-1 hover:bg-gray-50 rounded group">
                                                            <div
                                                                className="w-6 flex justify-center cursor-pointer"
                                                                onClick={() => {
                                                                    // Deep clone to ensure React detects state change for nested objects
                                                                    const newDays = JSON.parse(JSON.stringify(parsedDays))
                                                                    const targetFood = newDays[dIdx].meals[mIdx].foods[fIdx]

                                                                    if (targetFood.status === 'matched') {
                                                                        // Unmatch: Force to unknown
                                                                        targetFood.status = 'unknown'
                                                                        targetFood.matchedFoodId = undefined
                                                                    } else {
                                                                        // Rematch: Try to find match again
                                                                        const match = findBestMatch(targetFood.originalText)
                                                                        if (match && match.score > 0.75) {
                                                                            targetFood.matchedFoodId = match.id
                                                                            targetFood.matchConfidence = match.score
                                                                            targetFood.status = 'matched'
                                                                        } else {
                                                                            // Could not find match, maybe alert or just stay unknown
                                                                            // For UX, maybe just blink or nothing?
                                                                        }
                                                                    }
                                                                    setParsedDays(newDays)
                                                                }}
                                                                title={food.status === 'matched' ? "Eşleşmeyi Boz (Özel Yemek Olarak Ekle)" : "Tekrar Eşleştirmeyi Dene"}
                                                            >
                                                                {food.status === 'matched' ? (
                                                                    <div className="relative">
                                                                        <Check size={16} className="text-green-500" />
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/80">
                                                                            <span className="text-[10px] font-bold text-red-500">X</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative">
                                                                        <AlertCircle size={16} className="text-yellow-500" />
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/80">
                                                                            <span className="text-[10px] font-bold text-green-500">?</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium truncate" title={food.originalText}>{food.originalText}</div>
                                                                {food.status === 'matched' && food.matchedFoodId && (
                                                                    <div className="text-[10px] text-green-600 flex items-center gap-1">
                                                                        <Check size={10} /> {localFoods.find(f => f.id === food.matchedFoodId)?.name}
                                                                        <span className="text-gray-400 text-[9px]">(Otomatik Eşleşme)</span>
                                                                    </div>
                                                                )}
                                                                {food.status !== 'matched' && (
                                                                    <div className="text-[10px] text-orange-600 flex items-center gap-1">
                                                                        <span>⚠️ Veritabanına yeni kayıt olarak eklenecek</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Macros */}
                                                            <div className="flex gap-2 text-xs text-gray-500 font-mono">
                                                                <span className="w-10 text-right">{food.calories}</span>
                                                                <span className="w-8 text-right text-orange-600">{food.carbs}</span>
                                                                <span className="w-8 text-right text-blue-600">{food.protein}</span>
                                                                <span className="w-8 text-right text-yellow-600">{food.fat}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {meal.foods.length === 0 && <div className="text-xs text-gray-400 italic px-4">Besin bulunamadı</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </ScrollArea>
                    )}
                </div>

                <div className="px-6 py-4 border-t flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 shrink-0">
                    {step === 'review' ? (
                        <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 bg-blue-50/50 p-2 rounded border border-blue-100 max-w-2xl">
                            <div className="text-xs font-semibold text-blue-700 whitespace-nowrap">İçe Aktarma Modu:</div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-100/50 px-2 py-1 rounded transition-colors">
                                    <input type="radio" name="mode" className="accent-blue-600" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
                                    <span>Değiştir (Eskileri Sil*)</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-blue-100/50 px-2 py-1 rounded transition-colors">
                                    <input type="radio" name="mode" className="accent-blue-600" checked={importMode === 'append'} onChange={() => setImportMode('append')} />
                                    <span>Ekle (Mevcutun Altına)</span>
                                </label>
                            </div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1 sm:ml-auto whitespace-nowrap italic">
                                *Kilitli yemekler korunur.
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1"></div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {step === 'review' && (
                            <Button variant="outline" onClick={() => setStep('input')}>Geri Dön</Button>
                        )}
                        {step === 'input' ? (
                            <Button onClick={() => parseText(text)} disabled={!text.trim() || isProcessing} className="w-full sm:w-auto">
                                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                                Ayrıştır ve Önizle
                            </Button>
                        ) : (
                            <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto shadow-sm">
                                Onayla ve İçe Aktar ({parsedDays.reduce((acc, d) => acc + d.meals.reduce((mAcc, m) => mAcc + m.foods.length, 0), 0)} Besin)
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
