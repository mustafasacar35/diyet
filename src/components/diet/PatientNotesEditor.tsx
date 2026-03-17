"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Plus,
    Loader2,
    Save,
    Trash2,
    Pencil,
    X,
    Calendar,
    FileText,
    ChevronDown,
    ChevronUp,
    Bold,
    Italic,
    List,
    ListOrdered,
} from "lucide-react"

type NoteEntry = {
    id: string
    date: string
    title?: string
    content: string
    created_at: string
}

type Props = {
    patientId: string
    type: 'imaging' | 'observations'
    title: string
    icon: React.ReactNode
    showTitle?: boolean
    readOnly?: boolean
}

export default function PatientNotesEditor({ patientId, type, title, icon, showTitle = true, readOnly = false }: Props) {
    const [notes, setNotes] = useState<NoteEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // New/Edit form
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
    const [formTitle, setFormTitle] = useState('')
    const [formContent, setFormContent] = useState('')

    // Expanded notes
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const tableName = type === 'imaging' ? 'patient_imaging' : 'patient_observations'

    useEffect(() => {
        loadNotes()
    }, [patientId, type])

    const loadNotes = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('patient_id', patientId)
            .order('date', { ascending: false })

        if (!error && data) {
            setNotes(data)
        }
        setLoading(false)
    }

    const handleSave = async () => {
        if (!formContent.trim()) return
        setSaving(true)

        const payload: any = {
            patient_id: patientId,
            date: formDate,
            content: formContent
        }
        if (showTitle) {
            payload.title = formTitle
        }

        if (editingId) {
            await supabase.from(tableName).update(payload).eq('id', editingId)
        } else {
            await supabase.from(tableName).insert(payload)
        }

        await loadNotes()
        resetForm()
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return
        await supabase.from(tableName).delete().eq('id', id)
        await loadNotes()
    }

    const startEdit = (note: NoteEntry) => {
        setEditingId(note.id)
        setFormDate(note.date)
        setFormTitle(note.title || '')
        setFormContent(note.content)
        setIsAdding(true)
    }

    const resetForm = () => {
        setIsAdding(false)
        setEditingId(null)
        setFormDate(new Date().toISOString().split('T')[0])
        setFormTitle('')
        setFormContent('')
    }

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setExpandedIds(newSet)
    }

    // Simple text formatting helpers
    const insertFormat = (format: 'bold' | 'italic' | 'ul' | 'ol') => {
        const textarea = document.getElementById('note-editor') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const content = formContent

        if (format === 'bold' || format === 'italic') {
            // For bold/italic, wrap selected text
            const selectedText = content.substring(start, end) || 'metin'
            const wrapper = format === 'bold' ? '**' : '*'
            const newText = `${wrapper}${selectedText}${wrapper}`
            setFormContent(content.substring(0, start) + newText + content.substring(end))
            return
        }

        // For lists, find the current line(s) and add prefix at line start
        // Find the start of the current line
        let lineStart = start
        while (lineStart > 0 && content[lineStart - 1] !== '\n') {
            lineStart--
        }

        // Find the end of the current line (or selection end if multi-line)
        let lineEnd = end
        while (lineEnd < content.length && content[lineEnd] !== '\n') {
            lineEnd++
        }

        // Get the lines to format
        const linesToFormat = content.substring(lineStart, lineEnd)
        const lines = linesToFormat.split('\n')

        let formattedLines: string[]
        if (format === 'ul') {
            formattedLines = lines.map(line => {
                // Remove existing bullet if present
                const trimmed = line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')
                return `• ${trimmed}`
            })
        } else {
            // Numbered list
            formattedLines = lines.map((line, i) => {
                // Remove existing bullet/number if present
                const trimmed = line.replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, '')
                return `${i + 1}. ${trimmed}`
            })
        }

        const newContent = content.substring(0, lineStart) + formattedLines.join('\n') + content.substring(lineEnd)
        setFormContent(newContent)

        // Restore focus
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(lineStart, lineStart + formattedLines.join('\n').length)
        }, 0)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    // Simple markdown rendering for **bold** and *italic*
    const renderMarkdown = (text: string) => {
        // Split by lines first to preserve line breaks
        return text.split('\n').map((line, lineIdx) => {
            // Process bold (**text**)
            let parts: (string | React.ReactNode)[] = [line]

            // Bold: **text**
            parts = parts.flatMap((part, i) => {
                if (typeof part !== 'string') return [part]
                const boldRegex = /\*\*(.+?)\*\*/g
                const result: (string | React.ReactNode)[] = []
                let lastIndex = 0
                let match
                while ((match = boldRegex.exec(part)) !== null) {
                    if (match.index > lastIndex) {
                        result.push(part.substring(lastIndex, match.index))
                    }
                    result.push(<strong key={`b-${lineIdx}-${i}-${match.index}`} className="font-bold">{match[1]}</strong>)
                    lastIndex = match.index + match[0].length
                }
                if (lastIndex < part.length) {
                    result.push(part.substring(lastIndex))
                }
                return result.length > 0 ? result : [part]
            })

            // Italic: *text* (but not **)
            parts = parts.flatMap((part, i) => {
                if (typeof part !== 'string') return [part]
                const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g
                const result: (string | React.ReactNode)[] = []
                let lastIndex = 0
                let match
                while ((match = italicRegex.exec(part)) !== null) {
                    if (match.index > lastIndex) {
                        result.push(part.substring(lastIndex, match.index))
                    }
                    result.push(<em key={`i-${lineIdx}-${i}-${match.index}`} className="italic">{match[1]}</em>)
                    lastIndex = match.index + match[0].length
                }
                if (lastIndex < part.length) {
                    result.push(part.substring(lastIndex))
                }
                return result.length > 0 ? result : [part]
            })

            return (
                <span key={lineIdx}>
                    {parts}
                    {lineIdx < text.split('\n').length - 1 && <br />}
                </span>
            )
        })
    }

    if (loading) {
        return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    {icon} {title}
                </h3>
                {!isAdding && !readOnly && (
                    <Button size="sm" onClick={() => setIsAdding(true)} className="h-8 bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Yeni Not
                    </Button>
                )}
            </div>

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <Input
                                type="date"
                                value={formDate}
                                onChange={e => setFormDate(e.target.value)}
                                className="w-40 h-9"
                            />
                        </div>
                        {showTitle && (
                            <Input
                                placeholder="Başlık (ör: MR Sonucu)"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                className="flex-1 h-9 min-w-[200px]"
                            />
                        )}
                    </div>

                    {/* Toolbar */}
                    <div className="flex gap-1 border-b border-gray-200 pb-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => insertFormat('bold')}
                            title="Kalın"
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => insertFormat('italic')}
                            title="İtalik"
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <div className="w-px bg-gray-300 mx-1" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => insertFormat('ul')}
                            title="Liste"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => insertFormat('ol')}
                            title="Numaralı Liste"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Editor */}
                    <Textarea
                        id="note-editor"
                        placeholder={type === 'imaging'
                            ? "Görüntüleme bulgularını ve raporları buraya yazın..."
                            : "Hasta gözlemlerini ve seyir notlarını buraya yazın..."}
                        value={formContent}
                        onChange={e => setFormContent(e.target.value)}
                        className="min-h-[150px] resize-y font-mono text-sm"
                    />

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={resetForm} className="h-8">
                            <X className="h-3.5 w-3.5 mr-1" /> İptal
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={saving || !formContent.trim()}
                            className="h-8 bg-green-600 hover:bg-green-700"
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                            {editingId ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Notes Timeline */}
            {notes.length === 0 && !isAdding ? (
                <div className="text-center py-8 text-gray-400 italic">
                    Henüz not eklenmemiş. "Yeni Not" butonuna tıklayarak başlayın.
                </div>
            ) : (
                <div className="space-y-2">
                    {notes.map(note => {
                        const isExpanded = expandedIds.has(note.id)
                        const preview = note.content.substring(0, 100) + (note.content.length > 100 ? '...' : '')

                        return (
                            <div
                                key={note.id}
                                className="border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow"
                            >
                                {/* Header */}
                                <div
                                    className="flex items-center justify-between px-4 py-3 cursor-pointer"
                                    onClick={() => toggleExpand(note.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                            {formatDate(note.date)}
                                        </div>
                                        {note.title && (
                                            <span className="font-medium text-gray-800">{note.title}</span>
                                        )}
                                        {!note.title && !isExpanded && (
                                            <span className="text-gray-500 text-sm">{preview}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {!readOnly && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={(e) => { e.stopPropagation(); startEdit(note) }}
                                                >
                                                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(note.id) }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                </Button>
                                            </>
                                        )}
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-100">
                                        <div className="pt-3 text-sm text-gray-700">
                                            {renderMarkdown(note.content)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
