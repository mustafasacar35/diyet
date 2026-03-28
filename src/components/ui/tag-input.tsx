
import React, { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TagInputProps {
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    className?: string
}

export function TagInput({ value = [], onChange, placeholder, className }: TagInputProps) {
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        if (val.includes(',')) {
            const parts = val.split(',').map(s => s.trim()).filter(Boolean)
            // Function to add new tags
            const newTags = [...value]
            let changed = false
            parts.forEach(part => {
                const lowerPart = part.toLowerCase()
                // Case-insensitive check
                if (!newTags.some(t => t.toLowerCase() === lowerPart)) {
                    newTags.push(part)
                    changed = true
                }
            })
            if (changed) {
                onChange(newTags)
            }
            setInputValue('')
        } else {
            setInputValue(val)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag()
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value.length - 1)
        }
    }

    const addTag = () => {
        const trimmed = inputValue.trim()
        if (trimmed) {
            // Handle if user somehow pasted multiple things without commas triggering or just typed one thing
            const parts = trimmed.split(',').map(s => s.trim()).filter(Boolean)
            const newTags = [...value]
            let changed = false
            parts.forEach(part => {
                const lowerPart = part.toLowerCase()
                if (!newTags.some(t => t.toLowerCase() === lowerPart)) {
                    newTags.push(part)
                    changed = true
                }
            })
            if (changed) {
                onChange(newTags)
            }
            setInputValue('')
        }
    }

    const removeTag = (index: number) => {
        const newValue = [...value]
        newValue.splice(index, 1)
        onChange(newValue)
    }

    const handleBlur = () => {
        if (inputValue.trim()) {
            addTag()
        }
    }

    return (
        <div className={`p-2 bg-white border rounded-md focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-black ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="w-full outline-none text-sm bg-transparent mb-2"
                placeholder={value.length === 0 ? placeholder : (placeholder || 'Ekle...')}
            />
            <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                {value.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="pl-2 pr-1 h-6 flex items-center gap-1 text-xs whitespace-normal break-all">
                        {tag}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeTag(index); }}
                            className="hover:bg-gray-200 rounded-full p-0.5 transition-colors shrink-0"
                        >
                            <X size={10} />
                        </button>
                    </Badge>
                ))}
            </div>
        </div>
    )
}
