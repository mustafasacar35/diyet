"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUser } from "@/actions/auth-actions" // Server Action

interface CreateUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (userId?: string, role?: string) => void
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [role, setRole] = useState("dietitian")

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)

        try {
            // Use Server Action with Supabase Admin API
            const result = await createUser(formData)

            if (result.error) {
                throw new Error(result.error)
            }

            if (result.success) {
                const selectedRole = formData.get('role') as string
                onSuccess(result.userId, selectedRole)
                onOpenChange(false)

                // Only show alert if NOT patient role (PatientProfileDialog will handle patient case)
                if (selectedRole !== 'patient') {
                    alert("Kullanıcı başarıyla oluşturuldu!")
                }
            }

        } catch (err: any) {
            console.error("User creation error:", err)
            setError(err.message || "Beklenmeyen bir hata oluştu.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                    <DialogDescription>
                        Sisteme yeni bir kullanıcı ekleyin. (Admin API)
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-2 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" name="email" type="email" required placeholder="ornek@diyetplan.com" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Şifre</Label>
                        <Input id="password" name="password" type="text" required minLength={6} placeholder="En az 6 karakter" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Ad Soyad</Label>
                        <Input id="fullName" name="fullName" type="text" required placeholder="Ad Soyad" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select name="role" required value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue placeholder="Rol seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Yönetici (Admin)</SelectItem>
                                <SelectItem value="doctor">Doktor / Yönetici</SelectItem>
                                <SelectItem value="dietitian">Diyetisyen</SelectItem>
                                <SelectItem value="patient">Hasta (Manuel)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {role === 'patient' && (
                        <div className="grid gap-2">
                            <Label htmlFor="validUntil">Erişim Bitiş Tarihi</Label>
                            <Input 
                                id="validUntil" 
                                name="validUntil" 
                                type="date" 
                                defaultValue={new Date(new Date().setDate(new Date().getDate() + 365)).toISOString().split('T')[0]} 
                            />
                            <p className="text-xs text-muted-foreground">Hastanın sisteme giriş yapabileceği son tarih. Varsayılan (+365 gün) değiştirilebilir.</p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="title">Ünvan (Opsiyonel)</Label>
                        <Input id="title" name="title" type="text" placeholder="Örn: Uzman Diyetisyen" />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Oluşturuluyor..." : "Oluştur"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
