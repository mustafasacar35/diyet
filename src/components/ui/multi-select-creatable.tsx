"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"

export interface Option {
    id: string
    name: string
}

interface MultiSelectCreatableProps {
    options: Option[]
    selected: Option[]
    onChange: (selected: Option[]) => void
    placeholder?: string
    emptyText?: string
    createText?: string
    disabled?: boolean
}

export function MultiSelectCreatable({
    options,
    selected,
    onChange,
    placeholder = "Seçiniz...",
    emptyText = "Bulunamadı.",
    createText = "Ekle",
    disabled = false
}: MultiSelectCreatableProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const handleSelect = (option: Option) => {
        if (!selected.find(s => s.id === option.id)) {
            onChange([...selected, option])
        }
    }

    const handleRemove = (idToRemove: string) => {
        onChange(selected.filter(item => item.id !== idToRemove))
    }

    const handleCreate = () => {
        if (!inputValue.trim()) return
        const newOption = { id: inputValue.trim(), name: inputValue.trim() }
        if (!selected.find(s => s.name.toLowerCase() === newOption.name.toLowerCase())) {
            onChange([...selected, newOption])
        }
        setInputValue("")
        setOpen(false)
    }

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={(val) => { if (!disabled) setOpen(val) }}>
                <PopoverTrigger asChild>
                    <div
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "flex w-full min-h-10 items-center justify-between rounded-md border border-input bg-amber-50/30 px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed cursor-pointer",
                            disabled && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => {
                            if (!disabled) setOpen(true)
                        }}
                    >
                        <div className="flex flex-wrap gap-1 text-left">
                            {selected.length === 0 ? (
                                <span className="text-muted-foreground font-normal">{placeholder}</span>
                            ) : (
                                selected.map((item) => (
                                    <Badge
                                        variant="secondary"
                                        key={item.id}
                                        className="mr-1 mb-1 pr-1 font-normal"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                        }}
                                    >
                                        {item.name}
                                        {!disabled && (
                                            <button
                                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleRemove(item.id)
                                                }}
                                            >
                                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        )}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[300px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder={placeholder}
                            value={inputValue}
                            onValueChange={setInputValue}
                        />
                        <CommandList>
                            {inputValue.length > 0 && !options.some(o => o.name.toLowerCase() === inputValue.toLowerCase()) && (
                                <CommandEmpty className="p-2 text-sm">
                                    <Button onClick={handleCreate} variant="ghost" className="w-full justify-start text-blue-600">
                                        + "{inputValue}" {createText}
                                    </Button>
                                </CommandEmpty>
                            )}
                            {inputValue.length === 0 && options.length === 0 && (
                                <CommandEmpty>{emptyText}</CommandEmpty>
                            )}

                            <CommandGroup className="max-h-64 overflow-auto">
                                {options
                                    .filter(o => o.name.toLowerCase().includes(inputValue.toLowerCase()))
                                    .map((option) => (
                                        <CommandItem
                                            key={option.id}
                                            onSelect={() => {
                                                handleSelect(option)
                                                setInputValue("")
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selected.find(s => s.id === option.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.name}
                                        </CommandItem>
                                    ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
