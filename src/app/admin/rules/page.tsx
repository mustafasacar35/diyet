"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Plus, Settings, ChevronUp, ChevronDown } from "lucide-react"
import { RuleList } from "@/components/planner/rule-list"
import { PlanningRule } from "@/types/planner"
import { RuleDialog } from "@/components/planner/rule-dialog"
import { SettingsDialog } from "@/components/planner/settings-dialog"
import { DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"

export default function RulesPage() {
    const [rules, setRules] = useState<PlanningRule[]>([])
    const [suggestions, setSuggestions] = useState<PlanningRule[]>([])
    const [showSuggestions, setShowSuggestions] = useState(true)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<PlanningRule | null>(null)
    const [isAcceptingSuggestion, setIsAcceptingSuggestion] = useState<string | null>(null)

    useEffect(() => {
        fetchRules()
    }, [])

    async function fetchRules() {
        setLoading(true)
        // Fetch active global rules
        const { data: globalData, error: globalError } = await supabase
            .from('planning_rules')
            .select('*')
            .or('scope.is.null,scope.eq.global')
            .order('sort_order', { ascending: true })
            .order('priority', { ascending: false })

        if (globalError) {
            console.error('Error fetching rules:', globalError)
        } else {
            setRules(globalData as unknown as PlanningRule[])
        }

        // Fetch suggested rules (pending approval) WITHOUT inner join first to avoid caching issues
        const { data: suggestionData, error: suggestionError } = await supabase
            .from('planning_rules')
            .select('*')
            .eq('pending_global_approval', true)
            .order('created_at', { ascending: false })

        if (!suggestionError && suggestionData && suggestionData.length > 0) {
            // Manually fetch patient details
            const patientIds = Array.from(new Set(suggestionData.map((r: any) => r.patient_id).filter(Boolean)))

            let patientsMap: Record<string, any> = {}
            if (patientIds.length > 0) {
                const { data: patients } = await supabase
                    .from('patients')
                    .select('id, first_name, last_name')
                    .in('id', patientIds)

                if (patients) {
                    patients.forEach(p => {
                        patientsMap[p.id] = p
                    })
                }
            }

            // Combine data
            const suggestionsWithPatient = suggestionData.map((r: any) => ({
                ...r,
                patients: patientsMap[r.patient_id] || { first_name: 'Bilinmeyen', last_name: 'Hasta' }
            }))

            setSuggestions(suggestionsWithPatient as unknown as PlanningRule[])
        } else {
            setSuggestions([])
        }

        setLoading(false)
    }

    const handleEdit = (rule: PlanningRule) => {
        setEditingRule(rule)
        setDialogOpen(true)
        setIsAcceptingSuggestion(null)
    }

    const handleCreate = () => {
        setEditingRule(null)
        setDialogOpen(true)
        setIsAcceptingSuggestion(null)
    }

    // Accept Suggestion: Open dialog as "New Rule" but pre-filled
    const handleAcceptSuggestion = (rule: PlanningRule) => {
        // Create a copy of the rule but tailored for Global creation
        const newGlobalRule: any = {
            ...rule,
            id: undefined, // Clear ID to create new
            scope: 'global',
            patient_id: null,
            source_rule_id: null,
            pending_global_approval: false,
            // Keep name, definition, type etc.
        }
        setEditingRule(newGlobalRule)
        setIsAcceptingSuggestion(rule.id) // Track which suggestion we are accepting
        setDialogOpen(true)
    }

    // Reject Suggestion: Just clear the flag
    const handleRejectSuggestion = async (ruleId: string) => {
        if (!confirm("Öneriyi reddetmek istediğinize emin misiniz? Kural hastada kalmaya devam edecek ancak listeden kalkacak.")) return

        const { error } = await supabase
            .from('planning_rules')
            .update({ pending_global_approval: false })
            .eq('id', ruleId)

        if (error) {
            alert("Hata: " + error.message)
        } else {
            fetchRules()
        }
    }

    // Called when RuleDialog saves successfully
    const handleSuccess = async () => {
        // If we were accepting a suggestion, we need to clear its pending flag now
        if (isAcceptingSuggestion) {
            await supabase
                .from('planning_rules')
                .update({ pending_global_approval: false })
                .eq('id', isAcceptingSuggestion)
            setIsAcceptingSuggestion(null)
        }
        fetchRules()
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = rules.findIndex(r => r.id === active.id);
        const newIndex = rules.findIndex(r => r.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Optimistic UI Update
        const newRules = arrayMove(rules, oldIndex, newIndex);

        // Ensure new sort orders are strict sequence
        const sortedRules = newRules.map((r, i) => ({ ...r, sort_order: i }));
        setRules(sortedRules);

        // Update DB
        try {
            const minIndex = Math.min(oldIndex, newIndex);
            const maxIndex = Math.max(oldIndex, newIndex);

            for (let i = minIndex; i <= maxIndex; i++) {
                const sr = sortedRules[i];
                await supabase.from('planning_rules').update({ sort_order: sr.sort_order }).eq('id', sr.id);
            }
        } catch (e: any) {
            console.error("Error moving rule:", e);
            alert("Sıralama değiştirilemedi: " + e.message);
            fetchRules();
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Planlama Kuralları</h2>
                    <p className="text-muted-foreground">Otomatik planlayıcı için davranış kuralları tanımlayın.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => setSettingsOpen(true)}>
                        <Settings size={16} />
                        Planlayıcı Ayarları
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                            // Export rules as JSON
                            if (rules.length === 0) {
                                alert("Dışa aktarılacak kural yok!");
                                return;
                            }
                            const json = JSON.stringify(rules, null, 2);
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'planning_rules_export.json';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        📥 Kuralları Dışa Aktar
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={async () => {
                            // Export foods as JSON
                            const { data: foods, error } = await supabase
                                .from('foods')
                                .select('id, name, category, role, meal_types, tags, calories')
                                .order('category');

                            if (error) {
                                alert("Yiyecekler alınamadı: " + error.message);
                                return;
                            }
                            if (!foods || foods.length === 0) {
                                alert("Dışa aktarılacak yiyecek yok!");
                                return;
                            }
                            const json = JSON.stringify(foods, null, 2);
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'foods_export.json';
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                    >
                        🍽️ Yiyecekleri Dışa Aktar
                    </Button>
                    <Button onClick={handleCreate} className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <Plus size={18} />
                        Yeni Kural
                    </Button>
                </div>
            </div>

            {/* Suggestions Section */}
            {suggestions.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
                    <div
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 transition-colors"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                    >
                        <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                            <span>🔔 Onay Bekleyen Öneriler</span>
                            <span className="bg-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-full">{suggestions.length}</span>
                        </h3>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-amber-800">
                            {showSuggestions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </Button>
                    </div>

                    {showSuggestions && (
                        <div className="p-4 pt-0 space-y-2 border-t border-amber-200/50 mt-2">
                            {suggestions.map((suggestion: any) => (
                                <div key={suggestion.id} className="bg-white border border-amber-100 rounded-lg p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-800">{suggestion.name}</span>
                                            <div className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                                {suggestion.rule_type}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{suggestion.description}</p>
                                        <div className="text-[10px] text-amber-600 mt-1 font-medium">
                                            Öneren: {suggestion.patients?.first_name} {suggestion.patients?.last_name}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-8 text-xs" onClick={() => handleRejectSuggestion(suggestion.id)}>
                                            Reddet
                                        </Button>
                                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs" onClick={() => handleAcceptSuggestion(suggestion)}>
                                            Kabul Et & Ekle
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <RuleList
                rules={rules}
                loading={loading}
                onEdit={handleEdit}
                onDragEnd={handleDragEnd}
                onDelete={async (id) => {
                    if (!confirm("Kuralı silmek istediğinize emin misiniz?")) return;
                    await supabase.from('planning_rules').delete().eq('id', id);
                    fetchRules();
                }}
            />

            <RuleDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initialData={editingRule}
                onSuccess={handleSuccess}
            />

            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </div>
    )
}
