import { cn } from "@/lib/utils"
import { Check, CheckCheck, Trash2, Pencil } from "lucide-react"

interface MessageBubbleProps {
    id: string
    content: string
    isOwn: boolean
    timestamp: string
    status?: 'sent' | 'delivered' | 'read'
    senderName?: string
    isDeleted?: boolean
    onDelete?: (id: string) => void
    onEdit?: (id: string) => void
    isEdited?: boolean
}

export function MessageBubble({ id, content, isOwn, timestamp, status = 'sent', senderName, isDeleted, onDelete, onEdit, isEdited }: MessageBubbleProps) {
    if (isDeleted) {
        return (
            <div className={cn("flex w-full mb-2", isOwn ? "justify-end" : "justify-start")}>
                <div className={cn(
                    "max-w-[80%] md:max-w-[60%] rounded-lg px-3 py-2 shadow-sm text-sm italic text-gray-400 bg-gray-50 border",
                    isOwn ? "rounded-tr-none" : "rounded-tl-none"
                )}>
                    🚫 Bu mesaj silindi
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex w-full mb-2 group", isOwn ? "justify-end" : "justify-start")}>
            <div className={cn(
                "max-w-[80%] md:max-w-[60%] rounded-lg px-3 py-2 shadow-sm relative text-sm group",
                isOwn ? "bg-[#d9fdd3] text-gray-900 rounded-tr-none" : "bg-white text-gray-900 rounded-tl-none"
            )}>
                {/* Delete Button (Only for own messages) */}
                {isOwn && onDelete && (
                    <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <div className="bg-white hover:bg-gray-100 text-gray-400 hover:text-blue-500 p-1 rounded-full shadow-sm cursor-pointer border"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (onEdit) onEdit(id)
                            }}
                            title="Düzenle"
                        >
                            <Pencil size={12} />
                        </div>
                        <div className="bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 p-1 rounded-full shadow-sm cursor-pointer border"
                            onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Mesajı silmek istediğinize emin misiniz?')) onDelete(id)
                            }}
                            title="Sil"
                        >
                            <Trash2 size={12} />
                        </div>
                    </div>
                )}

                {!isOwn && senderName && (
                    <div className="text-[10px] font-bold text-orange-600 mb-0.5">
                        {senderName}
                    </div>
                )}

                <p className="whitespace-pre-wrap break-words leading-relaxed mr-14">
                    {content}
                </p>

                <div className="flex items-center justify-end gap-1 absolute bottom-1 right-2">
                    <span className="text-[10px] text-gray-500 min-w-fit flex items-center gap-1">
                        {isEdited && <span className="italic text-[9px]">(düzenlendi)</span>}
                        {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isOwn && (
                        <span className={cn(
                            "text-[10px]",
                            status === 'read' ? "text-blue-500" : "text-gray-400"
                        )}>
                            {status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
