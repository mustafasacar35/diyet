"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Save, Loader2, ArrowLeft, Edit2, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { FOOD_CATEGORIES } from "@/lib/constants/food-categories"
import { FOOD_ROLES } from "@/lib/constants/food-roles"

type RoleOption = { value: string; label: string }

export default function FoodOptionsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<string[]>([...FOOD_CATEGORIES])
    const [roles, setRoles] = useState<RoleOption[]>([...FOOD_ROLES])
    const [mealTypes, setMealTypes] = useState<string[]>(['KAHVALTI', 'ÖĞLEN', 'AKŞAM', 'ARA ÖĞÜN'])

    const [newCategory, setNewCategory] = useState("")
    const [newRoleValue, setNewRoleValue] = useState("")
    const [newRoleLabel, setNewRoleLabel] = useState("")
    const [newMealType, setNewMealType] = useState("")

    // Editing states
    const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null)
    const [editingCategoryValue, setEditingCategoryValue] = useState("")

    const [editingRoleIndex, setEditingRoleIndex] = useState<number | null>(null)
    const [editingRoleValue, setEditingRoleValue] = useState("")
    const [editingRoleLabel, setEditingRoleLabel] = useState("")

    const [editingMealTypeIndex, setEditingMealTypeIndex] = useState<number | null>(null)
    const [editingMealTypeValue, setEditingMealTypeValue] = useState("")

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'food_management_options')
                .single()

            if (data?.value) {
                const val = data.value
                if (val.categories) setCategories(val.categories)
                if (val.roles) setRoles(val.roles)
                if (val.mealTypes) setMealTypes(val.mealTypes)
            }
        } catch (error) {
            console.error('Error loading food options:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const options = { categories, roles, mealTypes }
            const { error } = await supabase
                .from('app_settings')
                .upsert({
                    key: 'food_management_options',
                    value: options,
                    updated_at: new Date().toISOString()
                })

            if (error) throw error
            alert('Ayarlar başarıyla kaydedildi.')
        } catch (error: any) {
            alert('Kaydetme hatası: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    // Category Handlers
    const addCategory = () => {
        if (!newCategory.trim()) return
        const val = newCategory.trim().toUpperCase()
        if (categories.includes(val)) {
            alert("Bu kategori zaten mevcut.")
            return
        }
        setCategories([...categories, val])
        setNewCategory("")
    }

    const startEditingCategory = (index: number) => {
        setEditingCategoryIndex(index)
        setEditingCategoryValue(categories[index])
    }

    const saveEditingCategory = () => {
        if (!editingCategoryValue.trim() || editingCategoryIndex === null) return
        const newVal = editingCategoryValue.trim().toUpperCase()
        const newCats = [...categories]
        newCats[editingCategoryIndex] = newVal
        setCategories(newCats)
        setEditingCategoryIndex(null)
    }

    const removeCategory = (index: number) => {
        if (confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
            setCategories(categories.filter((_, i) => i !== index))
        }
    }

    // Role Handlers
    const addRole = () => {
        if (!newRoleValue.trim() || !newRoleLabel.trim()) return
        if (roles.some(r => r.value === newRoleValue.trim())) {
            alert("Bu rol değeri zaten mevcut.")
            return
        }
        setRoles([...roles, { value: newRoleValue.trim(), label: newRoleLabel.trim() }])
        setNewRoleValue("")
        setNewRoleLabel("")
    }

    const startEditingRole = (index: number) => {
        setEditingRoleIndex(index)
        setEditingRoleValue(roles[index].value)
        setEditingRoleLabel(roles[index].label)
    }

    const saveEditingRole = () => {
        if (!editingRoleValue.trim() || !editingRoleLabel.trim() || editingRoleIndex === null) return
        const newRoles = [...roles]
        newRoles[editingRoleIndex] = { value: editingRoleValue.trim(), label: editingRoleLabel.trim() }
        setRoles(newRoles)
        setEditingRoleIndex(null)
    }

    const removeRole = (index: number) => {
        if (confirm("Bu rolü silmek istediğinize emin misiniz?")) {
            setRoles(roles.filter((_, i) => i !== index))
        }
    }

    // Meal Type Handlers
    const addMealType = () => {
        if (!newMealType.trim()) return
        const val = newMealType.trim().toUpperCase()
        if (mealTypes.includes(val)) {
            alert("Bu öğün türü zaten mevcut.")
            return
        }
        setMealTypes([...mealTypes, val])
        setNewMealType("")
    }

    const startEditingMealType = (index: number) => {
        setEditingMealTypeIndex(index)
        setEditingMealTypeValue(mealTypes[index])
    }

    const saveEditingMealType = () => {
        if (!editingMealTypeValue.trim() || editingMealTypeIndex === null) return
        const newVal = editingMealTypeValue.trim().toUpperCase()
        const newMeals = [...mealTypes]
        newMeals[editingMealTypeIndex] = newVal
        setMealTypes(newMeals)
        setEditingMealTypeIndex(null)
    }

    const removeMealType = (index: number) => {
        if (confirm("Bu öğün türünü silmek istediğinize emin misiniz?")) {
            setMealTypes(mealTypes.filter((_, i) => i !== index))
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gıda Seçenekleri Yönetimi</h1>
                    <p className="text-sm text-muted-foreground">Yemek kategorileri, rolleri ve öğün türlerini özelleştirin.</p>
                </div>
            </div>

            <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="categories">Kategoriler</TabsTrigger>
                    <TabsTrigger value="roles">Roller</TabsTrigger>
                    <TabsTrigger value="meals">Öğün Türleri</TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yemek Kategorileri</CardTitle>
                            <CardDescription>Yemeklerin hangi kategorilere (KAHVALTI, ÖĞLEN vb.) ayrılabileceğini belirleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Yeni kategori adı (örn: KIŞLIKLAR)"
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addCategory()}
                                    />
                                </div>
                                <Button onClick={addCategory}>
                                    <Plus className="h-4 w-4 mr-1" /> Ekle
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
                                {categories.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                                        {editingCategoryIndex === idx ? (
                                            <div className="flex-1 flex gap-1">
                                                <Input
                                                    className="h-8 text-sm"
                                                    value={editingCategoryValue}
                                                    onChange={e => setEditingCategoryValue(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && saveEditingCategory()}
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEditingCategory}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingCategoryIndex(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-sm font-semibold text-gray-700">{cat}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => startEditingCategory(idx)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => removeCategory(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Roles Tab */}
                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yemek Rolleri</CardTitle>
                            <CardDescription>Yemeklerin planlayıcıdaki fonksiyonlarını (Ana Yemek, Çorba vb.) tanımlayın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Rol Değeri (örn: garnish)"
                                        value={newRoleValue}
                                        onChange={e => setNewRoleValue(e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        placeholder="Rol Etiketi (örn: Garnitür)"
                                        value={newRoleLabel}
                                        onChange={e => setNewRoleLabel(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addRole()}
                                    />
                                </div>
                                <Button onClick={addRole}>
                                    <Plus className="h-4 w-4 mr-1" /> Ekle
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto p-1">
                                {roles.map((role, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                                        {editingRoleIndex === idx ? (
                                            <div className="flex-1 flex gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <Input
                                                        className="h-8 text-xs font-mono"
                                                        value={editingRoleValue}
                                                        onChange={e => setEditingRoleValue(e.target.value)}
                                                        placeholder="Rol Değeri"
                                                    />
                                                    <Input
                                                        className="h-8 text-sm font-bold"
                                                        value={editingRoleLabel}
                                                        onChange={e => setEditingRoleLabel(e.target.value)}
                                                        placeholder="Rol Etiketi"
                                                        autoFocus
                                                        onKeyDown={e => e.key === 'Enter' && saveEditingRole()}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEditingRole}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingRoleIndex(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-700">{role.label}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{role.value}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => startEditingRole(idx)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => removeRole(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Meal Types Tab */}
                <TabsContent value="meals">
                    <Card>
                        <CardHeader>
                            <CardTitle>Öğün Türleri</CardTitle>
                            <CardDescription>Gündeki öğün slotlarını (KAHVALTI, ÖĞLEN vb.) yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Yeni öğün türü (örn: GECE ARA ÖVÜNÜ)"
                                        value={newMealType}
                                        onChange={e => setNewMealType(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addMealType()}
                                    />
                                </div>
                                <Button onClick={addMealType}>
                                    <Plus className="h-4 w-4 mr-1" /> Ekle
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto p-1">
                                {mealTypes.map((meal, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                                        {editingMealTypeIndex === idx ? (
                                            <div className="flex-1 flex gap-1">
                                                <Input
                                                    className="h-8 text-sm"
                                                    value={editingMealTypeValue}
                                                    onChange={e => setEditingMealTypeValue(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && saveEditingMealType()}
                                                />
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEditingMealType}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingMealTypeIndex(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="text-sm font-semibold text-gray-700">{meal}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => startEditingMealType(idx)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => removeMealType(idx)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-12 py-6 text-lg font-bold rounded-xl shadow-lg ring-offset-2 transition-all active:scale-95">
                    {saving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    Tüm Değişiklikleri Kaydet
                </Button>
            </div>
        </div>
    )
}
