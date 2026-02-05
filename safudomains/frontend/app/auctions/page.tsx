'use client'

import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import Link from 'next/link'

interface Auction {
    id: number
    name: string
    reservePrice: string
    startTime: number
    endTime: number
    highestBid: string
    highestBidder: string
    settled: boolean
    isUSDC: boolean
    status: 'active' | 'ended' | 'settled'
}

export default function AuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([])
    const [filter, setFilter] = useState<'active' | 'ended' | 'all'>('active')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAuctions = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/auctions?status=${filter}`)
                const data = await res.json()
                setAuctions(data.auctions || [])
            } catch (error) {
                console.error('Failed to fetch auctions:', error)
            }
            setLoading(false)
        }
        fetchAuctions()
    }, [filter])

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Premium Name Auctions
                </h1>
                <p className="text-gray-400">
                    Bid on exclusive .safu domain names
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-8">
                {(['active', 'ended', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2.5 rounded-xl font-medium transition-all ${filter === f
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
            )}

            {/* Auction grid */}
            {!loading && auctions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {auctions.map((auction) => (
                        <AuctionCard key={auction.id} auction={auction} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && auctions.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-bold mb-2">No Auctions Found</h3>
                    <p className="text-gray-400">
                        {filter === 'active'
                            ? 'No active auctions right now. Check back soon!'
                            : 'No auctions match this filter.'}
                    </p>
                </div>
            )}
        </div>
    )
}

function AuctionCard({ auction }: { auction: Auction }) {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
        const updateTime = () => {
            const now = Math.floor(Date.now() / 1000)
            const remaining = auction.endTime - now

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
    }, [auction.endTime])

    const isEnded = Date.now() / 1000 >= auction.endTime
    const hasNoBids = auction.highestBid === '0'
    const currency = auction.isUSDC ? 'USDC' : 'ETH'

    return (
        <Link href={`/auctions/${auction.id}`}>
            <div className="group p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">
                            {auction.name}.safu
                        </h3>
                        <span className="inline-flex items-center gap-1 text-sm text-yellow-400 mt-1">
                            <span>🏆</span> Premium
                        </span>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Time Left</div>
                        <div className={`text-lg font-mono font-bold ${isEnded ? 'text-red-400' : 'text-green-400'
                            }`}>
                            {timeLeft}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-gray-900/50 rounded-xl">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Reserve</div>
                        <div className="text-lg font-bold">
                            {formatEther(BigInt(auction.reservePrice))} {currency}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-900/50 rounded-xl">
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Current Bid</div>
                        <div className={`text-lg font-bold ${hasNoBids ? 'text-gray-500' : 'text-green-400'}`}>
                            {hasNoBids ? '—' : `${formatEther(BigInt(auction.highestBid))} ${currency}`}
                        </div>
                    </div>
                </div>

                {!isEnded && (
                    <button className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl group-hover:from-yellow-400 group-hover:to-orange-400 transition-all">
                        Place Bid
                    </button>
                )}

                {isEnded && !auction.settled && (
                    <button className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-500 transition-all">
                        Settle Auction
                    </button>
                )}

                {auction.settled && (
                    <div className="w-full py-3 bg-gray-700 text-gray-400 font-bold rounded-xl text-center">
                        Settled
                    </div>
                )}
            </div>
        </Link>
    )
}
