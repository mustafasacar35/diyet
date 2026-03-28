
"use client"

import { useState } from "react"
import { useRecipeManager } from "@/hooks/use-recipe-manager"
import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"

export function RecipeCardsTab() {
    const { cards, isLoading } = useRecipeManager()
    const [search, setSearch] = useState("")

    const filteredCards = cards.filter(c =>
        c.filename.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <Input
                placeholder="Kart ara..."
                className="max-w-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            {isLoading ? (
                <div className="text-center py-8">Kartlar yükleniyor...</div>
            ) : (
                <div className="border rounded-md p-4 bg-muted/10">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
                        {filteredCards.length === 0 ? (
                            <div className="col-span-full text-center text-muted-foreground py-8">
                                Kart bulunamadı.
                            </div>
                        ) : (
                            filteredCards.map((card) => (
                                <div key={card.id} className="border rounded-md overflow-hidden bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-[4/5] relative bg-muted flex items-center justify-center overflow-hidden">
                                        <img
                                            src={card.url}
                                            alt={card.filename}
                                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs font-medium truncate" title={card.filename}>
                                            {card.filename}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
