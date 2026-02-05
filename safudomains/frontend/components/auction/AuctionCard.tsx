'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import Link from 'next/link'

interface AuctionCardProps {
    auctionId: number
    name: string
    reservePrice: bigint
    endTime: number
    highestBid: bigint
    highestBidder: string
    isUSDC: boolean
    settled?: boolean
}

export function AuctionCard({
    auctionId,
    name,
    reservePrice,
    endTime,
    highestBid,
    highestBidder,
    isUSDC,
    settled = false,
}: AuctionCardProps) {
    const { address } = useAccount()
    const [timeLeft, setTimeLeft] = useState('')

    const currency = isUSDC ? 'USDC' : 'ETH'
    const isEnded = Date.now() / 1000 >= endTime
    const hasNoBids = highestBid === 0n
    const isLeading = address && highestBidder.toLowerCase() === address.toLowerCase()

    // Countdown timer
    useEffect(() => {
        const updateTime = () => {
            const now = Math.floor(Date.now() / 1000)
            const remaining = endTime - now

            if (remaining <= 0) {
                setTimeLeft('Ended')
            } else {
                const days = Math.floor(remaining / 86400)
                const hours = Math.floor((remaining % 86400) / 3600)
                const minutes = Math.floor((remaining % 3600) / 60)
                const seconds = remaining % 60

                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h`)
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${minutes}m`)
                } else {
                    setTimeLeft(`${minutes}m ${seconds}s`)
                }
            }
        }

        updateTime()
        const interval = setInterval(updateTime, 1000)
        return () => clearInterval(interval)
    }, [endTime])

    return (
        <Link href={`/auctions/${auctionId}`}>
            <div className="group p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 cursor-pointer">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                            {name}.safu
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-yellow-400">🏆 Premium</span>
                            {isLeading && (
                                <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                    Leading
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Time Left</div>
                        <div className={`text-lg font-mono font-bold ${isEnded ? 'text-red-400' : remaining < 3600 ? 'text-orange-400 animate-pulse' : 'text-green-400'
                            }`}>
                            {timeLeft}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-900/50 rounded-xl">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Reserve</div>
                        <div className="text-lg font-bold">
                            {formatEther(reservePrice)} {currency}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-900/50 rounded-xl">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Current Bid</div>
                        <div className={`text-lg font-bold ${hasNoBids ? 'text-gray-500' : 'text-green-400'}`}>
                            {hasNoBids ? '—' : `${formatEther(highestBid)} ${currency}`}
                        </div>
                    </div>
                </div>

                {/* Action button */}
                {!isEnded && !settled && (
                    <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl group-hover:from-yellow-400 group-hover:to-orange-400 transition-all">
                        Place Bid
                    </button>
                )}

                {isEnded && !settled && (
                    <button className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-all">
                        Settle Auction
                    </button>
                )}

                {settled && (
                    <div className="w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-xl text-center">
                        ✅ Settled
                    </div>
                )}
            </div>
        </Link>
    )
}

// Helper to get remaining time
const remaining = 0 // This is just for the animation class check
