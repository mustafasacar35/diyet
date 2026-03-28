
"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"

interface FoodSelectorProps {
    selectedValues: string[] // List of selected food NAMES (or patterns)
    onSelect: (values: string[]) => void
    multiple?: boolean
}

export function FoodSelector({ selectedValues, onSelect, multiple = true }: FoodSelectorProps) {
    const [open, setOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [foods, setFoods] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(false)

    // Debounce search term to avoid hitting DB on every keystroke
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        if (!open) return
        searchFoods(debouncedSearch)
    }, [debouncedSearch, open])

    async function searchFoods(query: string) {
        setLoading(true)
        try {
            let queryBuilder = supabase
                .from('foods')
                .select('id, name')
                .limit(20)

            if (query) {
                // Smart search: "kab bör" -> name ilike %kab% AND name ilike %bör%
                const terms = query.trim().split(/\s+/)
                terms.forEach(term => {
                    queryBuilder = queryBuilder.ilike('name', `%${term}%`)
                })
            } else {
                // If empty, maybe show nothing or recently added? showing nothing is safer for heavy DB
                setFoods([])
                setLoading(false)
                return
            }

            const { data, error } = await queryBuilder

            if (error) throw error
            setFoods(data || [])
        } catch (error) {
            console.error("Error searching foods:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (foodName: string) => {
        if (multiple) {
            if (selectedValues.includes(foodName)) {
                onSelect(selectedValues.filter(v => v !== foodName))
            } else {
                onSelect([...selectedValues, foodName])
            }
        } else {
            onSelect([foodName])
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between min-h-[40px] h-auto"
                >
                    <div className="flex flex-wrap gap-1 text-left">
                        {selectedValues.length > 0 ? (
                            selectedValues.map((val, i) => (
                                <span key={i} className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm text-xs">
                                    {val}
                                </span>
                            ))
                        ) : (
                            <span className="text-muted-foreground">Yemek seçiniz...</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    {/* Disable local filtering because we do it server-side */}
                    <CommandInput
                        placeholder="Yemek ara (örn: kab bör)..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Aranıyor...</div>}
                        {!loading && foods.length === 0 && <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>}
                        <CommandGroup>
                            {foods.map((food) => (
                                <CommandItem
                                    key={food.id}
                                    value={food.name}
                                    onSelect={(currentValue) => {
                                        // CommandItem lowercases the value by default sometimes, 
                                        // but we passed food.name as value.
                                        // Use the original food.name from the object to be safe/casing preserved
                                        handleSelect(food.name)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.includes(food.name) ? "opacity-100" : "opacity-0"
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
    )
}
