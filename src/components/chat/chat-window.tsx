"use client"

import { useState, useEffect, useRef } from "react"
import { Message } from "@/types/chat"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { Loader2 } from "lucide-react"

interface ChatWindowProps {
    messages: Message[]
    currentUserId: string
    onSendMessage: (content: string, type: 'text' | 'image' | 'file') => void
    loading?: boolean
    recipientName?: string
    participants?: any[]
    onDeleteMessage?: (id: string) => void
    onEditMessage?: (id: string, newContent: string) => void
}

export function ChatWindow({ messages, currentUserId, onSendMessage, loading, recipientName, participants, onDeleteMessage, onEditMessage }: ChatWindowProps) {
    const bottomRef = useRef<HTMLDivElement>(null)
    const [editingMessage, setEditingMessage] = useState<Message | null>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const getSenderName = (senderId: string) => {
        if (!participants) return recipientName
        const participant = participants.find(p => p.user_id === senderId)
        return participant?.user?.full_name || 'Bilinmeyen'
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#e5ddd5] opacity-50">
                <Loader2 className="animate-spin text-gray-500" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-[#efeae2]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#efeae2] opacity-100" style={{
                backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
                backgroundSize: "20px 20px"
            }}>
                {/* Fallback pattern if image missing: just subtle color */}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <div className="bg-white/50 p-4 rounded-full mb-2">
                            👋
                        </div>
                        <p className="text-sm">Henüz mesaj yok. Sohbeti başlatın!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender_id === currentUserId
                        const showSender = !isOwn && (index === 0 || messages[index - 1].sender_id !== msg.sender_id)
                        const senderName = showSender ? getSenderName(msg.sender_id) : undefined

                        return (
                            <MessageBubble
                                key={msg.id}
                                id={msg.id}
                                content={msg.content}
                                isOwn={isOwn}
                                timestamp={msg.created_at}
                                status={msg.is_read ? 'read' : 'sent'}
                                senderName={senderName}
                                isDeleted={msg.is_deleted}
                                onDelete={onDeleteMessage}
                                onEdit={(id) => {
                                    const msgToEdit = messages.find(m => m.id === id)
                                    if (msgToEdit) setEditingMessage(msgToEdit)
                                }}
                                isEdited={msg.is_edited}
                            />
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <ChatInput
                onSend={onSendMessage}
                onEdit={onEditMessage}
                editingMessage={editingMessage}
                onCancelEdit={() => setEditingMessage(null)}
            />
        </div>
    )
}
