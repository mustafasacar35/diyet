"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Loader2,
    Brain,
    History,
    AlertTriangle,
    Pill,
    Leaf,
    ShieldAlert,
    FlaskConical,
    Stethoscope,
    Eye,
    FileText,
    ChevronDown,
    ChevronUp,
    UserRound,
    GraduationCap,
    RefreshCw,
    UtensilsCrossed,
    Activity,
    ClipboardList,
    Settings2,
    Ruler,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ==========================================
// TYPES
// ==========================================

type AnalysisModule =
    | 'demographics'
    | 'diseases'
    | 'medications'
    | 'lab_results'
    | 'measurements'
    | 'weekly_menu'
    | 'clinical_notes'
    | 'food_preferences'

type ToneOption =
    | 'motivational'
    | 'realistic'
    | 'warning'
    | 'supportive'
    | 'goal_oriented'

type LengthOption = 'short' | 'medium' | 'detailed'

type RiskFactor = { title: string; severity: string; details: string; mechanism?: string }
type DrugInteraction = { drug1: string; drug2: string; interaction: string; mechanism?: string; severity: string; recommendation: string }
type NutrientDiseaseLink = { nutrient: string; disease: string; relationship: string; mechanism?: string; recommendation: string }
type DietWarning = { warning: string; reason: string; mechanism?: string; suggestion: string }
type SupplementRec = { supplement: string; reason: string; mechanism?: string; dosage_note: string; timing: string }
type NutritionAdvice = { food_group: string; advice: string; reason: string; mechanism?: string }
type SymptomWatch = { symptom: string; possible_cause: string; mechanism?: string; action: string }
type AdditionalTest = { test: string; reason: string; expected_insight?: string }
type MenuAnalysisItem = { day: string; meal_type: string; food: string; positive_effects: string; concerns: string; mechanism?: string }
type MeasurementAnalysis = { trend_summary: string; stagnation_notes: string; regional_changes: string; recommendations: string }
type ClinicalNoteAnalysis = { note_date: string; note_content: string; cross_references: string; recommendation: string }

type ReportContent = {
    summary: string
    risk_factors: RiskFactor[]
    drug_interactions: DrugInteraction[]
    nutrient_disease_links: NutrientDiseaseLink[]
    diet_warnings: DietWarning[]
    supplement_recommendations: SupplementRec[]
    nutrition_advice: NutritionAdvice[]
    symptoms_to_watch: SymptomWatch[]
    additional_tests: AdditionalTest[]
    menu_analysis?: MenuAnalysisItem[]
    measurement_analysis?: MeasurementAnalysis | null
    clinical_note_analysis?: ClinicalNoteAnalysis[]
    overall_recommendations: string
    raw_text?: string
}

type ReportSummary = {
    id: string
    title: string
    audience: string
    report_type: string
    created_at: string
    model_used: string
}

// ==========================================
// MODULE / TONE CONFIGS
// ==========================================

const MODULE_CONFIG: { key: AnalysisModule; label: string; icon: React.ReactNode; description: string }[] = [
    { key: 'demographics', label: 'Demografik', icon: <UserRound size={14} />, description: 'Ad, yaş, BMI, aktivite düzeyi' },
    { key: 'diseases', label: 'Hastalıklar', icon: <ShieldAlert size={14} />, description: 'Tanımlı hastalıklar' },
    { key: 'medications', label: 'İlaçlar', icon: <Pill size={14} />, description: 'Aktif ilaç kullanımı' },
    { key: 'lab_results', label: 'Tahliller', icon: <FlaskConical size={14} />, description: 'Kan/mikro besin sonuçları' },
    { key: 'measurements', label: 'Ölçümler', icon: <Ruler size={14} />, description: 'Kilo, bel, kalça trendleri' },
    { key: 'weekly_menu', label: 'Haftalık Menü', icon: <UtensilsCrossed size={14} />, description: 'Aktif haftanın yemek listesi' },
    { key: 'clinical_notes', label: 'Klinik Notlar', icon: <ClipboardList size={14} />, description: 'Seyir notları, gözlemler' },
    { key: 'food_preferences', label: 'Besin Tercihleri', icon: <Leaf size={14} />, description: 'Sevilen/sevilmeyen yiyecekler' },
]

const TONE_CONFIG: { key: ToneOption; label: string; emoji: string; description: string }[] = [
    { key: 'motivational', label: 'Motive Edici', emoji: '💪', description: 'Pozitif, cesaretlendirici' },
    { key: 'realistic', label: 'Gerçekçi', emoji: '📊', description: 'Verilere dayalı, analitik' },
    { key: 'warning', label: 'Uyarıcı', emoji: '⚠️', description: 'Ciddi, riskleri vurgulayan' },
    { key: 'supportive', label: 'Destekleyici', emoji: '🤗', description: 'Empatik, anlayışlı' },
    { key: 'goal_oriented', label: 'Hedef Odaklı', emoji: '🎯', description: 'Hedefler ve adımlar' },
]

const LENGTH_CONFIG: { key: LengthOption; label: string; description: string }[] = [
    { key: 'short', label: 'Kısa', description: 'Ana noktalar, özet' },
    { key: 'medium', label: 'Orta', description: 'Dengeli detay seviyesi' },
    { key: 'detailed', label: 'Detaylı', description: 'Kapsamlı açıklamalar' },
]

// ==========================================
// HELPERS
// ==========================================

function SeverityBadge({ severity }: { severity: string }) {
    const s = severity?.toLowerCase()
    const color = s === 'high' ? 'bg-red-100 text-red-800 border-red-200'
        : s === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200'
            : 'bg-green-100 text-green-800 border-green-200'
    const label = s === 'high' ? 'Yüksek' : s === 'medium' ? 'Orta' : 'Düşük'
    return <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", color)}>{label}</span>
}

function MechanismTag({ text }: { text?: string }) {
    if (!text) return null
    return <p className="text-purple-700 text-[10px] bg-purple-50 p-1 rounded mt-1">🔬 {text}</p>
}

function SectionCard({
    title, icon, color, children, count
}: {
    title: string; icon: React.ReactNode; color: string; children: React.ReactNode; count?: number
}) {
    const [open, setOpen] = useState(true)
    if (count === 0) return null

    return (
        <Card className={cn("border-l-4", color)}>
            <CardHeader
                className="py-2 px-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        {icon}
                        {title}
                        {count !== undefined && (
                            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">{count}</span>
                        )}
                    </CardTitle>
                    {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </CardHeader>
            {open && <CardContent className="py-2 px-3">{children}</CardContent>}
        </Card>
    )
}


// ==========================================
// REPORT VIEWER
// ==========================================

function ReportViewer({ report }: { report: ReportContent }) {
    if (!report) return null

    if (report.raw_text && !report.risk_factors?.length) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm whitespace-pre-wrap">
                <p className="font-medium text-yellow-800 mb-2">⚠️ AI yanıtı yapılandırılmış formatta ayrıştırılamadı:</p>
                {report.raw_text}
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {/* Summary */}
            {report.summary && (
                <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                    <CardContent className="py-3 px-4">
                        <p className="text-sm font-medium text-indigo-900">{report.summary}</p>
                    </CardContent>
                </Card>
            )}

            {/* Risk Factors */}
            <SectionCard
                title="Risk Faktörleri"
                icon={<ShieldAlert size={14} className="text-red-600" />}
                color="border-l-red-500"
                count={report.risk_factors?.length}
            >
                <div className="space-y-2">
                    {report.risk_factors?.map((r, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{r.title}</span>
                                <SeverityBadge severity={r.severity} />
                            </div>
                            <p className="text-gray-600">{r.details}</p>
                            <MechanismTag text={r.mechanism} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Drug Interactions */}
            <SectionCard
                title="İlaç Etkileşimleri"
                icon={<Pill size={14} className="text-purple-600" />}
                color="border-l-purple-500"
                count={report.drug_interactions?.length}
            >
                <div className="space-y-2">
                    {report.drug_interactions?.map((d, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{d.drug1} ↔ {d.drug2}</span>
                                <SeverityBadge severity={d.severity} />
                            </div>
                            <p className="text-gray-600 mb-1">{d.interaction}</p>
                            <MechanismTag text={d.mechanism} />
                            {d.recommendation && <p className="text-blue-700 text-[10px]">💡 {d.recommendation}</p>}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Nutrient-Disease Links */}
            <SectionCard
                title="Besin-Hastalık İlişkileri"
                icon={<Leaf size={14} className="text-emerald-600" />}
                color="border-l-emerald-500"
                count={report.nutrient_disease_links?.length}
            >
                <div className="space-y-2">
                    {report.nutrient_disease_links?.map((n, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="font-semibold mb-1">{n.nutrient} → {n.disease}</div>
                            <p className="text-gray-600 mb-1">{n.relationship}</p>
                            <MechanismTag text={n.mechanism} />
                            {n.recommendation && <p className="text-green-700 text-[10px]">🥗 {n.recommendation}</p>}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Diet Warnings */}
            <SectionCard
                title="Diyet Uyarıları"
                icon={<AlertTriangle size={14} className="text-amber-600" />}
                color="border-l-amber-500"
                count={report.diet_warnings?.length}
            >
                <div className="space-y-2">
                    {report.diet_warnings?.map((w, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="font-semibold text-amber-800 mb-1">⚠️ {w.warning}</div>
                            <p className="text-gray-600">{w.reason}</p>
                            <MechanismTag text={w.mechanism} />
                            {w.suggestion && <p className="text-blue-700 text-[10px] mt-1">💡 {w.suggestion}</p>}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Supplement Recommendations */}
            <SectionCard
                title="Takviye Önerileri"
                icon={<FlaskConical size={14} className="text-teal-600" />}
                color="border-l-teal-500"
                count={report.supplement_recommendations?.length}
            >
                <div className="space-y-2">
                    {report.supplement_recommendations?.map((s, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="font-semibold text-teal-800 mb-1">💊 {s.supplement}</div>
                            <p className="text-gray-600">{s.reason}</p>
                            <MechanismTag text={s.mechanism} />
                            <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
                                {s.dosage_note && <span>📏 {s.dosage_note}</span>}
                                {s.timing && <span>⏰ {s.timing}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Nutrition Advice */}
            <SectionCard
                title="Beslenme Önerileri"
                icon={<Leaf size={14} className="text-green-600" />}
                color="border-l-green-500"
                count={report.nutrition_advice?.length}
            >
                <div className="space-y-2">
                    {report.nutrition_advice?.map((n, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="font-semibold text-green-800 mb-1">🥗 {n.food_group}</div>
                            <p className="text-gray-700">{n.advice}</p>
                            {n.reason && <p className="text-gray-500 text-[10px] mt-0.5">Neden: {n.reason}</p>}
                            <MechanismTag text={n.mechanism} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Symptoms to Watch */}
            <SectionCard
                title="Dikkat Edilecek Semptomlar"
                icon={<Eye size={14} className="text-orange-600" />}
                color="border-l-orange-500"
                count={report.symptoms_to_watch?.length}
            >
                <div className="space-y-2">
                    {report.symptoms_to_watch?.map((s, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="font-semibold text-orange-800 mb-1">👀 {s.symptom}</div>
                            <p className="text-gray-600">Olası neden: {s.possible_cause}</p>
                            <MechanismTag text={s.mechanism} />
                            <p className="text-blue-700 text-[10px] mt-0.5">🩺 {s.action}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Additional Tests */}
            <SectionCard
                title="Önerilen Ek Tahliller"
                icon={<Stethoscope size={14} className="text-sky-600" />}
                color="border-l-sky-500"
                count={report.additional_tests?.length}
            >
                <div className="space-y-1">
                    {report.additional_tests?.map((t, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="flex items-start gap-2">
                                <span className="font-semibold text-sky-800 shrink-0">🔬 {t.test}</span>
                                <span className="text-gray-600">{t.reason}</span>
                            </div>
                            {t.expected_insight && <p className="text-purple-700 text-[10px] bg-purple-50 p-1 rounded mt-1">📊 {t.expected_insight}</p>}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Menu Analysis */}
            <SectionCard
                title="Menü Analizi (Bu Hafta)"
                icon={<UtensilsCrossed size={14} className="text-cyan-600" />}
                color="border-l-cyan-500"
                count={report.menu_analysis?.length}
            >
                <div className="space-y-2">
                    {report.menu_analysis?.map((m, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded-full font-medium">{m.day}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{m.meal_type}</span>
                                <span className="font-semibold">{m.food}</span>
                            </div>
                            {m.positive_effects && <p className="text-green-700 text-[10px]">✅ {m.positive_effects}</p>}
                            {m.concerns && <p className="text-amber-700 text-[10px]">⚠️ {m.concerns}</p>}
                            <MechanismTag text={m.mechanism} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Measurement Analysis */}
            {report.measurement_analysis && (
                <SectionCard
                    title="Vücut Ölçüm Analizi"
                    icon={<Activity size={14} className="text-rose-600" />}
                    color="border-l-rose-500"
                >
                    <div className="space-y-2 text-xs">
                        {report.measurement_analysis.trend_summary && (
                            <div className="bg-white p-2 rounded border">
                                <div className="font-semibold text-rose-800 mb-1">📈 Trend Özeti</div>
                                <p className="text-gray-700">{report.measurement_analysis.trend_summary}</p>
                            </div>
                        )}
                        {report.measurement_analysis.stagnation_notes && (
                            <div className="bg-white p-2 rounded border">
                                <div className="font-semibold text-amber-800 mb-1">⏸️ Plato Analizi</div>
                                <p className="text-gray-700">{report.measurement_analysis.stagnation_notes}</p>
                            </div>
                        )}
                        {report.measurement_analysis.regional_changes && (
                            <div className="bg-white p-2 rounded border">
                                <div className="font-semibold text-blue-800 mb-1">📐 Bölgesel Değişimler</div>
                                <p className="text-gray-700">{report.measurement_analysis.regional_changes}</p>
                            </div>
                        )}
                        {report.measurement_analysis.recommendations && (
                            <div className="bg-white p-2 rounded border">
                                <div className="font-semibold text-green-800 mb-1">💡 Öneriler</div>
                                <p className="text-gray-700">{report.measurement_analysis.recommendations}</p>
                            </div>
                        )}
                    </div>
                </SectionCard>
            )}

            {/* Clinical Note Analysis */}
            <SectionCard
                title="Klinik Not Analizi"
                icon={<ClipboardList size={14} className="text-violet-600" />}
                color="border-l-violet-500"
                count={report.clinical_note_analysis?.length}
            >
                <div className="space-y-2">
                    {report.clinical_note_analysis?.map((c, i) => (
                        <div key={i} className="bg-white p-2 rounded border text-xs">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] bg-violet-100 text-violet-800 px-1.5 py-0.5 rounded-full font-medium">{c.note_date}</span>
                                <span className="font-semibold text-gray-700">{c.note_content}</span>
                            </div>
                            {c.cross_references && <p className="text-blue-700 text-[10px]">🔗 {c.cross_references}</p>}
                            {c.recommendation && <p className="text-green-700 text-[10px] mt-0.5">💡 {c.recommendation}</p>}
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Overall Recommendations */}
            {report.overall_recommendations && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="py-3 px-4">
                        <p className="text-xs font-medium text-blue-900 mb-1">📋 Genel Sonuç ve Öneriler</p>
                        <p className="text-xs text-blue-800 leading-relaxed">{report.overall_recommendations}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}


// ==========================================
// CONFIGURATION MODAL
// ==========================================

function AnalysisConfigModal({
    open,
    onOpenChange,
    audience,
    onGenerate,
    generating,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    audience: 'doctor' | 'patient'
    onGenerate: (modules: AnalysisModule[], tones: ToneOption[], length: LengthOption) => void
    generating: boolean
}) {
    const [selectedModules, setSelectedModules] = useState<AnalysisModule[]>([
        'demographics', 'diseases', 'medications', 'lab_results',
        'measurements', 'weekly_menu', 'clinical_notes', 'food_preferences'
    ])
    const [selectedTones, setSelectedTones] = useState<ToneOption[]>(['motivational', 'supportive'])
    const [selectedLength, setSelectedLength] = useState<LengthOption>('medium')

    const toggleModule = (mod: AnalysisModule) => {
        setSelectedModules(prev =>
            prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
        )
    }

    const toggleTone = (tone: ToneOption) => {
        setSelectedTones(prev =>
            prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
        )
    }

    const selectAll = () => setSelectedModules(MODULE_CONFIG.map(m => m.key))
    const deselectAll = () => setSelectedModules([])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] p-0">
                <DialogHeader className="px-4 pt-4 pb-2 border-b">
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <Settings2 size={18} className="text-indigo-600" />
                        {audience === 'doctor' ? '🩺 Klinik Analiz Ayarları' : '👤 Hasta Bilgilendirme Ayarları'}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh]">
                    <div className="px-4 py-3 space-y-4">

                        {/* DATA MODULES */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                                    📋 Dahil Edilecek Veriler
                                </h4>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={selectAll}>
                                        Tümü
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-5 text-[10px] px-2" onClick={deselectAll}>
                                        Hiçbiri
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                {MODULE_CONFIG.map(mod => (
                                    <label
                                        key={mod.key}
                                        className={cn(
                                            "flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs",
                                            selectedModules.includes(mod.key)
                                                ? "border-indigo-300 bg-indigo-50/50"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedModules.includes(mod.key)}
                                            onCheckedChange={() => toggleModule(mod.key)}
                                            className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 font-medium">
                                                <span className="text-indigo-600">{mod.icon}</span>
                                                {mod.label}
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-0.5">{mod.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* TONE SELECTION (Patient only) */}
                        {audience === 'patient' && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                                    🎭 Mesaj Tonlaması <span className="text-[10px] font-normal text-gray-400">(birden fazla seçilebilir)</span>
                                </h4>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {TONE_CONFIG.map(tone => (
                                        <label
                                            key={tone.key}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs",
                                                selectedTones.includes(tone.key)
                                                    ? "border-green-300 bg-green-50/50"
                                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedTones.includes(tone.key)}
                                                onCheckedChange={() => toggleTone(tone.key)}
                                            />
                                            <div>
                                                <div className="font-medium">{tone.emoji} {tone.label}</div>
                                                <p className="text-[10px] text-gray-500">{tone.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* MESSAGE LENGTH (Patient only) */}
                        {audience === 'patient' && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                                    📏 Mesaj Uzunluğu
                                </h4>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {LENGTH_CONFIG.map(len => (
                                        <label
                                            key={len.key}
                                            className={cn(
                                                "flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-all text-xs text-center",
                                                selectedLength === len.key
                                                    ? "border-blue-400 bg-blue-50 ring-1 ring-blue-200"
                                                    : "border-gray-200 hover:border-gray-300 bg-white"
                                            )}
                                            onClick={() => setSelectedLength(len.key)}
                                        >
                                            <input type="radio" name="length" className="hidden" checked={selectedLength === len.key} readOnly />
                                            <span className="font-medium">{len.label}</span>
                                            <span className="text-[10px] text-gray-500 mt-0.5">{len.description}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Module count info */}
                        <div className="text-[10px] text-gray-400 text-center">
                            {selectedModules.length}/{MODULE_CONFIG.length} modül seçili
                            {audience === 'patient' && selectedTones.length > 0 && ` • ${selectedTones.length} tonlama`}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-4 py-3 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="text-xs"
                    >
                        İptal
                    </Button>
                    <Button
                        size="sm"
                        className={cn(
                            "text-xs",
                            audience === 'doctor'
                                ? "bg-indigo-600 hover:bg-indigo-700"
                                : "bg-green-600 hover:bg-green-700"
                        )}
                        disabled={generating || selectedModules.length === 0}
                        onClick={() => onGenerate(selectedModules, selectedTones, selectedLength)}
                    >
                        {generating ? (
                            <>
                                <Loader2 size={14} className="animate-spin mr-1" />
                                Analiz oluşturuluyor...
                            </>
                        ) : (
                            <>
                                <Brain size={14} className="mr-1" />
                                {audience === 'doctor' ? 'Klinik Analiz Oluştur' : 'Hasta Raporu Oluştur'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


// ==========================================
// MAIN COMPONENT
// ==========================================

export default function PatientAnalysisPanel({ patientId, weekId }: { patientId: string; weekId?: string | null }) {
    const [generating, setGenerating] = useState(false)
    const [currentReport, setCurrentReport] = useState<ReportContent | null>(null)
    const [currentTitle, setCurrentTitle] = useState('')
    const [reportHistory, setReportHistory] = useState<ReportSummary[]>([])
    const [showHistory, setShowHistory] = useState(false)
    const [showReport, setShowReport] = useState(false)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [loadingPast, setLoadingPast] = useState(false)

    // Config modal state
    const [configModalOpen, setConfigModalOpen] = useState(false)
    const [configAudience, setConfigAudience] = useState<'doctor' | 'patient'>('doctor')

    // Fetch report history
    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true)
        try {
            const res = await fetch(`/api/ai/patient-analysis?patientId=${patientId}`)
            const data = await res.json()
            if (data.reports) setReportHistory(data.reports)
        } catch (e) {
            console.error('Failed to fetch report history:', e)
        }
        setLoadingHistory(false)
    }, [patientId])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    // Open config modal
    const openConfigModal = (audience: 'doctor' | 'patient') => {
        setConfigAudience(audience)
        setConfigModalOpen(true)
    }

    // Generate report (called from config modal)
    const generateReport = async (modules: AnalysisModule[], tones: ToneOption[], length: LengthOption) => {
        setGenerating(true)
        try {
            const res = await fetch('/api/ai/patient-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    audience: configAudience,
                    weekId: weekId || undefined,
                    modules,
                    tones: configAudience === 'patient' ? tones : undefined,
                    length: configAudience === 'patient' ? length : undefined,
                })
            })

            const data = await res.json()

            if (data.error) {
                alert('Rapor oluşturulamadı: ' + data.error)
                return
            }

            setCurrentReport(data.report)
            setCurrentTitle(data.title)
            setConfigModalOpen(false)
            setShowReport(true)

            // Refresh history
            fetchHistory()
        } catch (e: any) {
            alert('Hata: ' + e.message)
        }
        setGenerating(false)
    }

    // Load a specific past report
    const loadPastReport = async (reportId: string) => {
        setLoadingPast(true)
        try {
            const res = await fetch(`/api/ai/patient-analysis/detail?reportId=${reportId}`)
            const data = await res.json()
            if (data.report) {
                setCurrentReport(data.report.content)
                setCurrentTitle(data.report.title)
                setShowReport(true)
                setShowHistory(false)
            }
        } catch (e) {
            console.error('Failed to load report:', e)
        }
        setLoadingPast(false)
    }

    const formatDate = (d: string) => {
        const date = new Date(d)
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Brain size={16} className="text-indigo-600" />
                    Detaylı Hasta Analizi
                </h3>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowHistory(true)}
                    >
                        <History size={12} className="mr-1" />
                        Geçmiş ({reportHistory.length})
                    </Button>
                </div>
            </div>

            {/* Generate Buttons */}
            <div className="grid grid-cols-2 gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 text-left flex items-start gap-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                    onClick={() => openConfigModal('doctor')}
                    disabled={generating}
                >
                    {generating && configAudience === 'doctor' ? <Loader2 size={14} className="animate-spin mt-0.5 shrink-0" /> : <GraduationCap size={14} className="text-indigo-600 mt-0.5 shrink-0" />}
                    <div>
                        <div className="text-xs font-medium">🩺 Klinik Analiz</div>
                        <div className="text-[10px] text-gray-500 font-normal">Doktor/Diyetisyen için teknik rapor</div>
                    </div>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 text-left flex items-start gap-2 border-green-200 hover:bg-green-50 hover:border-green-400 transition-all"
                    onClick={() => openConfigModal('patient')}
                    disabled={generating}
                >
                    {generating && configAudience === 'patient' ? <Loader2 size={14} className="animate-spin mt-0.5 shrink-0" /> : <UserRound size={14} className="text-green-600 mt-0.5 shrink-0" />}
                    <div>
                        <div className="text-xs font-medium">👤 Hasta Bilgilendirme</div>
                        <div className="text-[10px] text-gray-500 font-normal">Hasta için anlaşılır rapor</div>
                    </div>
                </Button>
            </div>

            {generating && (
                <Card className="bg-indigo-50 border-indigo-200">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                        <Loader2 size={16} className="animate-spin text-indigo-600" />
                        <div>
                            <p className="text-xs font-medium text-indigo-800">Analiz oluşturuluyor...</p>
                            <p className="text-[10px] text-indigo-600">Tüm hasta verileri toplanıyor ve yapay zeka ile değerlendiriliyor. Bu işlem 15-30 saniye sürebilir.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recent reports preview */}
            {reportHistory.length > 0 && !generating && (
                <div className="space-y-1">
                    <span className="text-[10px] text-gray-500">Son Raporlar:</span>
                    {reportHistory.slice(0, 3).map(r => (
                        <div
                            key={r.id}
                            className="flex items-center gap-2 p-1.5 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors text-xs"
                            onClick={() => loadPastReport(r.id)}
                        >
                            {r.audience === 'patient'
                                ? <UserRound size={12} className="text-green-600 shrink-0" />
                                : <GraduationCap size={12} className="text-indigo-600 shrink-0" />
                            }
                            <span className="flex-1 truncate">{r.title}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">{formatDate(r.created_at)}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Configuration Modal */}
            <AnalysisConfigModal
                open={configModalOpen}
                onOpenChange={setConfigModalOpen}
                audience={configAudience}
                onGenerate={generateReport}
                generating={generating}
            />

            {/* Report Viewer Dialog */}
            <Dialog open={showReport} onOpenChange={setShowReport}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0">
                    <DialogHeader className="px-4 pt-4 pb-2 border-b">
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <Brain size={18} className="text-indigo-600" />
                            {currentTitle}
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[75vh] px-4 py-3">
                        {currentReport && <ReportViewer report={currentReport} />}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* History Dialog */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <History size={16} className="text-indigo-600" />
                            Rapor Geçmişi
                            <Button variant="ghost" size="sm" className="h-6 ml-auto" onClick={fetchHistory}>
                                <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                        {loadingHistory && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-gray-400" />
                            </div>
                        )}
                        {!loadingHistory && reportHistory.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Henüz rapor oluşturulmamış.
                            </div>
                        )}
                        <div className="space-y-2">
                            {reportHistory.map(r => (
                                <div
                                    key={r.id}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => loadPastReport(r.id)}
                                >
                                    {r.audience === 'patient'
                                        ? <UserRound size={16} className="text-green-600 shrink-0" />
                                        : <GraduationCap size={16} className="text-indigo-600 shrink-0" />
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{r.title}</p>
                                        <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                                            <span>{formatDate(r.created_at)}</span>
                                            <span>•</span>
                                            <span>{r.model_used}</span>
                                            <span>•</span>
                                            <span>{r.audience === 'patient' ? 'Hasta' : 'Doktor'}</span>
                                        </div>
                                    </div>
                                    {loadingPast ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} className="text-gray-400" />}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
