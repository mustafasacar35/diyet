"use client"

import { RecipeManager } from "@/components/admin/recipe-manager/recipe-manager"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RecipesPage() {
    const router = useRouter()

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={() => router.push('/admin')}>
                    <ArrowLeft size={16} className="mr-1" />
                    Panele Dön
                </Button>
            </div>

            <RecipeManager />
        </div>
    )
}
