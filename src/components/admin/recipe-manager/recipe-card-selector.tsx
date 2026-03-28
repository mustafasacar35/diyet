
"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import { RecipeCard } from "@/hooks/use-recipe-manager"

interface RecipeCardSelectorProps {
    cards: RecipeCard[]
    selectedFilename?: string | null
    selectedFilenames?: string[]
    onSelect: (value: string | string[]) => void
    placeholder?: string
    multiple?: boolean
    showTags?: boolean
    closeOnSelect?: boolean
}

export function RecipeCardSelector({
    cards,
    selectedFilename,
    selectedFilenames = [],
    onSelect,
    placeholder = "Kart seçin...",
    multiple = false,
    showTags = true,
    closeOnSelect = false
}: RecipeCardSelectorProps) {
    const [open, setOpen] = useState(false)

    // Smart Card Filter logic for Combobox
    const filterCards = (value: string, search: string) => {
        if (!search) return 1
        const terms = search.toLocaleLowerCase('tr').split(/[\s_]+/)
        const valLower = value.toLocaleLowerCase('tr')
        const normalizedTarget = valLower.replace(/_/g, ' ')

        return terms.every(term => normalizedTarget.includes(term)) ? 1 : 0
    }

    const handleSelect = (filename: string) => {
        if (multiple) {
            const current = selectedFilenames || []
            if (current.includes(filename)) {
                onSelect(current.filter(f => f !== filename))
            } else {
                onSelect([...current, filename])
            }
        } else {
            if (selectedFilename === filename) {
                onSelect("") // Toggle off
            } else {
                onSelect(filename)
                setOpen(false)
            }
        }
    }

    const hasSelection = multiple ? (selectedFilenames && selectedFilenames.length > 0) : !!selectedFilename

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-[36px] px-3 py-2"
                >
                    {hasSelection && showTags ? (
                        multiple ? (
                            <div className="flex flex-wrap gap-1">
                                {selectedFilenames.map(fname => (
                                    <span key={fname} className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                                        {fname}
                                        <span
                                            className="cursor-pointer hover:text-red-500 font-bold px-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleSelect(fname)
                                            }}
                                        >×</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            cards.find((card) => card.filename === selectedFilename)?.filename || selectedFilename
                        )
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command filter={filterCards}>
                    <CommandInput placeholder="Kart ara (örn: zey ekm)..." />
                    <CommandList>
                        <CommandEmpty>Kart bulunamadı.</CommandEmpty>
                        <CommandGroup>
                            {cards
                                .sort((a, b) => {
                                    const isASel = multiple ? selectedFilenames?.includes(a.filename) : selectedFilename === a.filename
                                    const isBSel = multiple ? selectedFilenames?.includes(b.filename) : selectedFilename === b.filename
                                    if (isASel && !isBSel) return -1
                                    if (!isASel && isBSel) return 1
                                    return 0
                                })
                                .map((card) => {
                                    const isSelected = multiple
                                        ? selectedFilenames?.includes(card.filename)
                                        : selectedFilename === card.filename

                                    return (
                                        <CommandItem
                                            key={card.id}
                                            value={card.filename}
                                            onSelect={() => {
                                                handleSelect(card.filename)
                                                // Force close if requested (even for multiple)
                                                // Note: handleSelect already attempts to close if !multiple || closeOnSelect
                                                // But let's make sure the behavior matches user request "her bir seçim yapınca da liste kapanmalı"
                                                if (multiple) setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    isSelected ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {card.filename}
                                        </CommandItem>
                                    )
                                })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
