"use client"

import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/hooks/use-chat"
import { ChatLayout } from "@/components/chat/chat-layout"
import { useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"

function AdminMessagesContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const targetUserId = searchParams.get('targetUserId')

    const {
        conversations,
        messages,
        activeConversationId,
        loadingMessages,
        sendMessage,
        selectConversation,
        createGroupConversation,
        deleteMessage,
        editMessage,
        leaveGroup,
        addMembersToGroup,
        removeMemberFromGroup,
        deleteGroup,
        loadingConversations, // Keep this as it's used in useEffect
        startConversation // Keep this as it's used in useEffect
    } = useChat(user?.id)

    // Handle initial target from URL (e.g. redirected from Patient List)
    useEffect(() => {
        if (targetUserId && !loadingConversations) {
            // Check if conversation exists
            // Since we don't have direct access to check existence easily without iterating,
            // we rely on startConversation which is safe (get_or_create)
            startConversation(targetUserId).then((id) => {
                if (id) selectConversation(id)
            })
        }
    }, [targetUserId, loadingConversations])

    if (!user) return null

    return (
        <div className="h-full p-6">
            <h1 className="text-2xl font-bold mb-4">Mesajlar (Admin)</h1>

            {loadingConversations ? (
                <div className="flex bg-white h-[600px] border rounded-xl items-center justify-center text-gray-400">
                    Sohbetler yükleniyor...
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border">
                    <ChatLayout
                        conversations={conversations}
                        messages={messages}
                        activeConversationId={activeConversationId}
                        currentUserId={user.id}
                        onSelectConversation={selectConversation}
                        onSendMessage={sendMessage}
                        loadingMessages={loadingMessages}
                        className="h-[calc(100vh-12rem)] border-none shadow-none"
                        onStartGroup={createGroupConversation}
                        onDeleteMessage={deleteMessage}
                        onEditMessage={editMessage}
                        onLeaveGroup={leaveGroup}
                        onAddMembers={addMembersToGroup}
                        onRemoveMember={removeMemberFromGroup}
                        onDeleteGroup={deleteGroup}
                    />
                </div>
            )}
        </div>
    )
}

export default function AdminMessagesPage() {
    return (
        <Suspense fallback={<div className="p-6">Yükleniyor...</div>}>
            <AdminMessagesContent />
        </Suspense>
    )
}
