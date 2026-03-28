
"use client"

import { useState } from "react"
import { useRecipeManager } from "@/hooks/use-recipe-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { Check, ChevronsUpDown, Trash2, Ban } from "lucide-react"
import { cn } from "@/lib/utils"

export function BansTab() {
    const { bans, cards, deleteBan, addBan, isLoading } = useRecipeManager()
    const [isOpen, setIsOpen] = useState(false)

    // Form stats
    const [foodPattern, setFoodPattern] = useState("")
    const [originalText, setOriginalText] = useState("")
    const [selectedCard, setSelectedCard] = useState<string>("")
    const [openCombobox, setOpenCombobox] = useState(false)

    const handleSubmit = async () => {
        if (!foodPattern || !selectedCard) return

        const success = await addBan(foodPattern, selectedCard, originalText)
        if (success) {
            setIsOpen(false)
            setFoodPattern("")
            setOriginalText("")
            setSelectedCard("")
        }
    }

    // Filter based on search
    const [search, setSearch] = useState("")
    const filteredBans = bans.filter(b =>
        b.food_pattern.toLowerCase().includes(search.toLowerCase()) ||
        b.card_filename.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Input
                    placeholder="Ara..."
                    className="max-w-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="destructive"><Ban className="mr-2 h-4 w-4" /> Yeni Yasak</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Eşleşme Yasağı</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Yemek Adı (Desen)</Label>
                                <Input
                                    placeholder="örn: köfte"
                                    value={foodPattern}
                                    onChange={(e) => setFoodPattern(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Orijinal Metin (Opsiyonel)</Label>
                                <Input
                                    placeholder="örn: Izgara köfte"
                                    value={originalText}
                                    onChange={(e) => setOriginalText(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Yasaklı Kart</Label>
                                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openCombobox}
                                            className="w-full justify-between"
                                        >
                                            {selectedCard
                                                ? cards.find((card) => card.filename === selectedCard)?.filename
                                                : "Kart seçin..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Kart ara..." />
                                            <CommandList>
                                                <CommandEmpty>Kart bulunamadı.</CommandEmpty>
                                                <CommandGroup>
                                                    {cards.map((card) => (
                                                        <CommandItem
                                                            key={card.id}
                                                            value={card.filename}
                                                            onSelect={(currentValue) => {
                                                                setSelectedCard(currentValue === selectedCard ? "" : currentValue)
                                                                setOpenCombobox(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedCard === card.filename ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {card.filename}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSubmit} disabled={!foodPattern || !selectedCard} variant="destructive">
                                    Yasağı Kaydet
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Yemek Deseni</TableHead>
                            <TableHead>Yasaklı Kart</TableHead>
                            <TableHead>Orijinal Metin</TableHead>
                            <TableHead className="w-[100px]">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : filteredBans.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Yasak bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBans.map((ban) => (
                                <TableRow key={ban.id}>
                                    <TableCell className="font-medium">{ban.food_pattern}</TableCell>
                                    <TableCell>{ban.card_filename}</TableCell>
                                    <TableCell className="text-muted-foreground">{ban.original_text || "-"}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => deleteBan(ban.id)}
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
    )
}
