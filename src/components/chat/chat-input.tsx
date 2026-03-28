"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Paperclip, Smile, Image as ImageIcon, Check } from "lucide-react"

import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Message } from "@/types/chat"

interface ChatInputProps {
    onSend: (content: string, type: 'text' | 'image' | 'file') => void
    onEdit?: (id: string, newContent: string) => void
    editingMessage?: Message | null
    onCancelEdit?: () => void
    disabled?: boolean
}

export function ChatInput({ onSend, onEdit, editingMessage, onCancelEdit, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("")
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Effect to populate input when editing
    useEffect(() => {
        if (editingMessage) {
            setMessage(editingMessage.content)
            textareaRef.current?.focus()
        }
    }, [editingMessage])

    const handleSend = () => {
        if (!message.trim()) return

        if (editingMessage && onEdit) {
            onEdit(editingMessage.id, message)
            if (onCancelEdit) onCancelEdit()
        } else {
            onSend(message, 'text')
        }

        setMessage("")
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setMessage(prev => prev + emojiData.emoji)
    }

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }

    useEffect(() => {
        adjustHeight()
    }, [message])

    return (
        <div className="flex items-end gap-2 p-2 bg-gray-50 border-t relative">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500 rounded-full shrink-0" disabled={disabled}>
                        <Smile size={24} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="p-0 border-none shadow-none w-auto bg-transparent">
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="text-gray-500 rounded-full shrink-0" disabled={disabled}>
                <Paperclip size={20} />
            </Button>

            <div className="flex-1 bg-white rounded-2xl border px-3 py-2 shadow-sm focus-within:ring-1 focus-within:ring-green-500 focus-within:border-green-500 relative">
                {editingMessage && (
                    <div className="absolute -top-8 left-0 text-xs bg-gray-100 px-2 py-1 rounded-t flex items-center gap-2 text-gray-500">
                        <span>Düzenleniyor...</span>
                        <button onClick={() => {
                            setMessage("")
                            if (onCancelEdit) onCancelEdit()
                        }} className="hover:text-red-500">✕</button>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={editingMessage ? "Mesajı düzenleyin..." : "Bir mesaj yazın..."}
                    className="w-full resize-none bg-transparent outline-none text-sm max-h-[120px] overflow-y-auto block leading-relaxed"
                    rows={1}
                    disabled={disabled}
                />
            </div>

            <Button
                onClick={handleSend}
                disabled={!message.trim() || disabled}
                size="icon"
                className={`rounded-full shadow-sm shrink-0 h-10 w-10 ${editingMessage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
                {editingMessage ? <Check className="ml-0.5" size={18} /> : <Send size={18} className="ml-0.5" />}
            </Button>
        </div>
    )
}
