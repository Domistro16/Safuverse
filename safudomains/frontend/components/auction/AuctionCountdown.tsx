'use client'

import { useState, useEffect } from 'react'

interface AuctionCountdownProps {
    endTime: number
}

export function AuctionCountdown({ endTime }: AuctionCountdownProps) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isEnded: false,
    })

    useEffect(() => {
        const updateTime = () => {
            const now = Math.floor(Date.now() / 1000)
            const remaining = endTime - now

            if (remaining <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true })
            } else {
                setTimeLeft({
                    days: Math.floor(remaining / 86400),
                    hours: Math.floor((remaining % 86400) / 3600),
                    minutes: Math.floor((remaining % 3600) / 60),
                    seconds: remaining % 60,
                    isEnded: false,
                })
            }
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [endTime])

    if (timeLeft.isEnded) {
        return (
            <div className="text-3xl font-bold text-red-400 font-mono">
                Auction Ended
            </div>
        )
    }

    return (
        <div className="flex gap-3">
            <TimeUnit value={timeLeft.days} label="Days" />
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <TimeUnit value={timeLeft.minutes} label="Mins" />
            <TimeUnit value={timeLeft.seconds} label="Secs" highlight />
        </div>
    )
}

function TimeUnit({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
    return (
        <div className="text-center">
            <div className={`text-3xl font-bold font-mono px-3 py-2 rounded-lg ${highlight ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-white'
                }`}>
                {value.toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{label}</div>
        </div>
    )
}
