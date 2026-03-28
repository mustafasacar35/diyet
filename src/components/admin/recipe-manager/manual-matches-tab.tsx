import { useState } from "react"
import { useRecipeManager, RecipeCard } from "@/hooks/use-recipe-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FoodSelector } from "./food-selector"
import { RecipeCardDialog } from "@/components/patient/recipe-card-dialog"
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
import { Check, ChevronsUpDown, Trash2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function ManualMatchesTab() {
    const { manualMatches, cards, deleteManualMatch, addManualMatch, updateManualMatch, isLoading } = useRecipeManager()
    const [isOpen, setIsOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    // Form stats
    // We now support multiple foods selection
    const [selectedFoods, setSelectedFoods] = useState<string[]>([])
    // Fallback manual input if smart search isn't enough? user said "tiklemeli işlem", implying selection.
    // But we still might want to allow custom text? 
    // Let's keep a "Custom Pattern" input as fallback or addition?
    // User said "veritabanındaki yemekleri filtreleyebilmeliyiz".

    const [originalText, setOriginalText] = useState("")
    const [selectedCard, setSelectedCard] = useState<string>("")
    const [openCombobox, setOpenCombobox] = useState(false)

    // Preview Modal
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewCard, setPreviewCard] = useState<{ url: string, name: string } | null>(null)

    const resetForm = () => {
        setIsOpen(false)
        setIsEditMode(false)
        setEditId(null)
        setSelectedFoods([])
        setOriginalText("")
        setSelectedCard("")
    }

    const handleSubmit = async () => {
        if (selectedFoods.length === 0 || !selectedCard) return

        let successCount = 0

        if (isEditMode && editId) {
            // Update single match logic
            // If user selected multiple foods in edit mode:
            // - If strict 1-1 edit: We change the ONE record to the FIRST selected food.
            // - If we want to allow splitting: complicate.
            // Let's assume Edit is for ONE match row.
            // So if they select multiple, we might warn or just take the first?
            // Or maybe we treat "Edit" as "Change the params of this match".

            // If user selected multiple items in Edit mode, it's ambiguous.
            // Simple approach: Take the first one.
            await updateManualMatch(editId, selectedFoods[0], selectedCard, originalText)
            successCount = 1
        } else {
            // Create mode: Create a match for EACH selected food
            for (const food of selectedFoods) {
                // Check duplicate locally to avoid error spam?
                // The DB might allow duplicates or not. Assuming we just add.
                const ok = await addManualMatch(food, selectedCard, originalText)
                if (ok) successCount++
            }
        }

        if (successCount > 0) {
            resetForm()
        }
    }

    const handleEdit = (match: any) => {
        setIsEditMode(true)
        setEditId(match.id)
        setSelectedFoods([match.food_pattern])
        // Find card obj if needed, but we store filename
        setSelectedCard(match.card_filename)
        setOriginalText(match.original_text || "")
        setIsOpen(true)
    }

    const openPreview = (cardFilename: string) => {
        const card = cards.find(c => c.filename === cardFilename)
        if (card) {
            setPreviewCard({ url: card.url, name: card.filename })
            setPreviewOpen(true)
        }
    }

    // Filter matches based on search
    const [search, setSearch] = useState("")
    const filteredMatches = manualMatches.filter(m =>
        m.food_pattern.toLowerCase().includes(search.toLowerCase()) ||
        m.card_filename.toLowerCase().includes(search.toLowerCase())
    )

    // Smart Card Filter logic for Combobox
    // search query vs card filename with smart token matching
    const filterCards = (value: string, search: string) => {
        if (!search) return 1
        const terms = search.toLocaleLowerCase('tr').split(/[\s_]+/) // split by space or underscore
        const valLower = value.toLocaleLowerCase('tr')

        // Check if ALL terms match the value (which acts as our text to search against)
        // Note: 'value' passed to CommandItem is card.filename.

        // Special case: ignore underscores in target value for matching
        const normalizedTarget = valLower.replace(/_/g, ' ')

        return terms.every(term => normalizedTarget.includes(term)) ? 1 : 0
    }

    return (
        <div className="space-y-4">
            <RecipeCardDialog
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                cardUrl={previewCard?.url || ''}
                cardName={previewCard?.name || ''}
            />

            <div className="flex justify-between items-center">
                <Input
                    placeholder="Ara..."
                    className="max-w-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => { resetForm(); setIsOpen(true) }}>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Eşleştirme
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => !open && resetForm()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Eşleştirmeyi Düzenle" : "Yeni Manuel Eşleştirme"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Yemek Seçimi {isEditMode && "(Sadece ilk seçim kaydedilir)"}</Label>
                            <FoodSelector
                                selectedValues={selectedFoods}
                                onSelect={setSelectedFoods}
                                multiple={!isEditMode} // Edit mode: maybe force single selection?
                            />
                            <p className="text-xs text-muted-foreground">
                                Veritabanından yemek arayın (örn: "kab bör" &rarr; Kabak Böreği)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Kart Seçimi</Label>
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
                                    <Command filter={filterCards}>
                                        <CommandInput placeholder="Kart ara (örn: zey ekm)..." />
                                        <CommandList>
                                            <CommandEmpty>Kart bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                {cards.map((card) => (
                                                    <CommandItem
                                                        key={card.id}
                                                        value={card.filename}
                                                        onSelect={(currentValue) => {
                                                            setSelectedCard(currentValue) // CommandItem value is often lowercased but we use original filename in value prop? no, standard behavior. 
                                                            // Actually value prop in CommandItem is what is SEARCHED.
                                                            // We need to handle selection carefully. 
                                                            // Let's trust value is filename because we pass filename as value.
                                                            setSelectedCard(card.filename)
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
                            <p className="text-xs text-muted-foreground">
                                Dosya adında _ (alt tire) olsa bile boşluklu arayabilirsiniz ("zey ekm").
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Orijinal Metin (Opsiyonel)</Label>
                            <Input
                                placeholder="Not veya orijinal isim..."
                                value={originalText}
                                onChange={(e) => setOriginalText(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={handleSubmit} disabled={selectedFoods.length === 0 || !selectedCard}>
                                {isEditMode ? "Güncelle" : "Kaydet"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Yemek Deseni</TableHead>
                            <TableHead>Kart Dosyası</TableHead>
                            <TableHead>Orijinal Metin</TableHead>
                            <TableHead className="w-[100px]">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : filteredMatches.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    Eşleştirme bulunamadı.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMatches.map((match) => (
                                <TableRow key={match.id}>
                                    <TableCell className="font-medium">{match.food_pattern}</TableCell>
                                    <TableCell>
                                        <button
                                            className="text-blue-600 hover:underline flex items-center gap-1"
                                            onClick={() => openPreview(match.card_filename)}
                                        >
                                            {match.card_filename}
                                        </button>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{match.original_text || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(match)}
                                            >
                                                <span className="sr-only">Düzenle</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => deleteManualMatch(match.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
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
