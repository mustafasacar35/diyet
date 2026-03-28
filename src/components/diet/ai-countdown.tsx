import React, { useState, useEffect } from 'react'

interface AiCountdownProps {
    endDate: Date
    onComplete?: () => void
}

export function AiCountdown({ endDate, onComplete }: AiCountdownProps) {
    const [timeLeft, setTimeLeft] = useState<string>('')

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = endDate.getTime() - new Date().getTime()
            if (difference <= 0) {
                if (onComplete) onComplete()
                return '0 saniye'
            }

            const hours = Math.floor(difference / (1000 * 60 * 60))
            const minutes = Math.floor((difference / (1000 * 60)) % 60)
            const seconds = Math.floor((difference / 1000) % 60)

            const parts = []
            if (hours > 0) parts.push(`${hours} saat`)
            if (minutes > 0) parts.push(`${minutes} dakika`)
            if (seconds > 0 || (hours === 0 && minutes === 0)) parts.push(`${seconds} saniye`)

            return parts.join(' ')
        }

        setTimeLeft(calculateTimeLeft())
        const timer = setInterval(() => {
            const val = calculateTimeLeft()
            setTimeLeft(val)
            if (val === '0 saniye') clearInterval(timer)
        }, 1000)

        return () => clearInterval(timer)
    }, [endDate, onComplete])

    return <span className="font-medium">{timeLeft}</span>
}
