import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { RuleTarget } from "@/types/planner"
import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TargetSelectorProps {
    value: RuleTarget
    onChange: (value: RuleTarget) => void
    disableCategory?: boolean
    disableRole?: boolean
    disableTag?: boolean
    disableFood?: boolean
}

export function TargetSelector({
    value,
    onChange,
    disableCategory,
    disableRole,
    disableTag,
    disableFood
}: TargetSelectorProps) {

    const handleTypeChange = (type: any) => {
        onChange({ type, value: '' })
    }

    const handleValueChange = (val: string) => {
        onChange({ ...value, value: val })
    }

    const [foods, setFoods] = useState<{ id: string, name: string }[]>([])
    const [loadingFoods, setLoadingFoods] = useState(false)
    const [openFoodSelect, setOpenFoodSelect] = useState(false)

    useEffect(() => {
        if (value.type === 'food_id' && foods.length === 0) {
            fetchFoods()
        }
    }, [value.type, foods.length])

    const fetchFoods = async () => {
        setLoadingFoods(true)
        try {
            const { data, error } = await supabase.from('foods').select('id, name').order('name', { ascending: true })
            if (data) setFoods(data)
        } catch (error) {
            console.error("Failed to load foods", error)
        } finally {
            setLoadingFoods(false)
        }
    }

    return (
        <div className="flex gap-2">
            <Select value={value.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tür seçin" />
                </SelectTrigger>
                <SelectContent>
                    {!disableCategory && <SelectItem value="category">Kategori</SelectItem>}
                    {!disableRole && <SelectItem value="role">Rol</SelectItem>}
                    {!disableTag && <SelectItem value="tag">Etiket</SelectItem>}
                    {!disableFood && <SelectItem value="food_id">Spesifik Yemek</SelectItem>}
                </SelectContent>
            </Select>

            {value.type === 'category' && (
                <Select value={value.value} onValueChange={handleValueChange}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="KAHVALTI">Kahvaltı</SelectItem>
                        <SelectItem value="ÖĞLEN">Öğle Yemeği</SelectItem>
                        <SelectItem value="AKŞAM">Akşam Yemeği</SelectItem>
                        <SelectItem value="ARA ÖĞÜN">Ara Öğün</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {value.type === 'role' && (
                <Select value={value.value} onValueChange={handleValueChange}>
                    <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Rol seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mainDish">Ana Yemek</SelectItem>
                        <SelectItem value="sideDish">Yan Yemek</SelectItem>
                        <SelectItem value="salad">Salata</SelectItem>
                        <SelectItem value="soup">Çorba</SelectItem>
                        <SelectItem value="bread">Ekmek</SelectItem>
                        <SelectItem value="snack">Atıştırmalık/Kuruyemiş</SelectItem>
                        <SelectItem value="dessert">Tatlı</SelectItem>
                        <SelectItem value="drink">İçecek</SelectItem>
                        <SelectItem value="fruit">Meyve</SelectItem>
                        <SelectItem value="supplement">Takviye</SelectItem>
                    </SelectContent>
                </Select>
            )}

            {(value.type === 'tag') && (
                <Input
                    placeholder="Etiket adını yazın..."
                    value={value.value}
                    onChange={(e: any) => handleValueChange(e.target.value)}
                    className="flex-1"
                />
            )}

            {value.type === 'food_id' && (
                <Popover open={openFoodSelect} onOpenChange={setOpenFoodSelect}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openFoodSelect}
                            className="flex-1 justify-between text-left font-normal"
                        >
                            {value.value
                                ? foods.find((food) => food.id === value.value)?.name || "Bilinmeyen Yemek"
                                : "Yemek ara ve seç..."}
                            {loadingFoods ? <Loader2 className="ml-2 h-4 w-4 shrink-0 opacity-50 animate-spin" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Yemek ara..." />
                            <CommandList>
                                <CommandEmpty>Yemek bulunamadı.</CommandEmpty>
                                <CommandGroup>
                                    {foods.map((food) => (
                                        <CommandItem
                                            key={food.id}
                                            value={food.name}
                                            onSelect={() => {
                                                handleValueChange(food.id)
                                                setOpenFoodSelect(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value.value === food.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {food.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}
