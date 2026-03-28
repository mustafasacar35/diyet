export type MessageType = 'text' | 'image' | 'file'

export interface Message {
    id: string
    conversation_id: string
    sender_id: string
    content: string
    type: MessageType
    created_at: string
    is_read: boolean
    is_deleted?: boolean
    is_edited?: boolean
    metadata?: any
}

export interface Conversation {
    id: string
    created_at: string
    updated_at: string
    last_message_preview: string | null
    last_message_at: string
    type: 'direct' | 'group'
    participants?: Participant[]
    unread_count?: number
    title?: string | null
}

export interface Participant {
    conversation_id: string
    user_id: string
    created_at: string
    last_read_at: string
    user?: {
        full_name: string
        avatar_url?: string
    }
}
