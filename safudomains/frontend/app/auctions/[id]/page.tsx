'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { formatEther, parseEther } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import Link from 'next/link'
import { AuctionCountdown } from '@/components/auction/AuctionCountdown'
import { BidForm } from '@/components/auction/BidForm'

interface AuctionDetail {
    id: number
    name: string
    reservePrice: bigint
    startTime: number
    endTime: number
    highestBid: bigint
    highestBidder: string
    settled: boolean
    isUSDC: boolean
}

export default function AuctionDetailPage() {
    const { id } = useParams()
    const { address } = useAccount()
    const [auction, setAuction] = useState<AuctionDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAuction = async () => {
            try {
                const res = await fetch(`/api/auctions?id=${id}`)
                const data = await res.json()
                if (data.auction) {
                    setAuction({
                        ...data.auction,
                        reservePrice: BigInt(data.auction.reservePrice),
                        highestBid: BigInt(data.auction.highestBid),
                    })
                }
            } catch (error) {
                console.error('Failed to fetch auction:', error)
            }
            setLoading(false)
        }
        if (id) fetchAuction()
    }, [id])

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto"></div>
            </div>
        )
    }

    if (!auction) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold mb-2">Auction Not Found</h2>
                <Link href="/auctions" className="text-yellow-400 hover:underline">
                    ← Back to Auctions
                </Link>
            </div>
        )
    }

    const isEnded = Date.now() / 1000 >= auction.endTime
    const isLeading = address && auction.highestBidder.toLowerCase() === address.toLowerCase()
    const currency = auction.isUSDC ? 'USDC' : 'ETH'

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <div className="mb-6">
                <Link href="/auctions" className="text-gray-400 hover:text-white transition-colors">
                    ← Back to Auctions
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Auction info */}
                <div>
                    <div className="mb-6">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                            <span>🏆</span> Premium Auction
                        </span>
                    </div>

                    <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {auction.name}.safu
                    </h1>

                    <div className="mt-8 p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50">
                        {/* Countdown */}
                        <div className="mb-6 p-4 bg-gray-900/50 rounded-xl">
                            <div className="text-sm text-gray-400 mb-1">
                                {isEnded ? 'Auction Ended' : 'Time Remaining'}
                            </div>
                            <AuctionCountdown endTime={auction.endTime} />
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-900/50 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reserve Price</div>
                                <div className="text-2xl font-bold">
                                    {formatEther(auction.reservePrice)} {currency}
                                </div>
                            </div>
                            <div className="p-4 bg-gray-900/50 rounded-xl">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Bid</div>
                                <div className={`text-2xl font-bold ${auction.highestBid === 0n ? 'text-gray-500' : 'text-green-400'}`}>
                                    {auction.highestBid === 0n
                                        ? 'No bids yet'
                                        : `${formatEther(auction.highestBid)} ${currency}`}
                                </div>
                            </div>
                        </div>

                        {/* Leading bidder */}
                        {auction.highestBidder !== '0x0000000000000000000000000000000000000000' && (
                            <div className="p-4 bg-gray-900/50 rounded-xl mb-6">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Leading Bidder</div>
                                <div className={`font-mono text-lg ${isLeading ? 'text-green-400' : ''}`}>
                                    {isLeading ? (
                                        <span className="flex items-center gap-2">
                                            <span>👑</span> You are winning!
                                        </span>
                                    ) : (
                                        `${auction.highestBidder.slice(0, 6)}...${auction.highestBidder.slice(-4)}`
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bid form */}
                        {!isEnded && !auction.settled && (
                            <BidForm
                                auctionId={auction.id}
                                minBid={auction.highestBid === 0n
                                    ? auction.reservePrice
                                    : auction.highestBid + (auction.highestBid * 5n / 100n)}
                                isUSDC={auction.isUSDC}
                            />
                        )}

                        {/* Settle button */}
                        {isEnded && !auction.settled && auction.highestBid > 0n && (
                            <SettleButton auctionId={auction.id} />
                        )}

                        {/* Settled state */}
                        {auction.settled && (
                            <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-center">
                                <div className="text-green-400 font-bold text-lg">✅ Auction Settled</div>
                                <div className="text-gray-400 text-sm mt-1">
                                    Winner: {auction.highestBidder.slice(0, 6)}...{auction.highestBidder.slice(-4)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Info panel */}
                <div className="space-y-6">
                    {/* Auction info */}
                    <div className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50">
                        <h3 className="text-lg font-bold mb-4">Auction Details</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Auction ID</span>
                                <span className="font-mono">#{auction.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Started</span>
                                <span>{new Date(auction.startTime * 1000).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Ends</span>
                                <span>{new Date(auction.endTime * 1000).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Currency</span>
                                <span>{currency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Min Increment</span>
                                <span>5%</span>
                            </div>
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="p-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl border border-gray-700/50">
                        <h3 className="text-lg font-bold mb-4">How It Works</h3>
                        <div className="space-y-3 text-sm text-gray-400">
                            <div className="flex gap-3">
                                <span className="text-yellow-400">1.</span>
                                <span>Place a bid at or above the minimum amount</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400">2.</span>
                                <span>Outbid others or get refunded automatically</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400">3.</span>
                                <span>Last 10 min bids extend the auction (anti-sniping)</span>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-yellow-400">4.</span>
                                <span>Winner claims the domain after settlement</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SettleButton({ auctionId }: { auctionId: number }) {
    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    const handleSettle = () => {
        // TODO: Add actual contract call
        console.log('Settling auction:', auctionId)
    }

    return (
        <button
            onClick={handleSettle}
            disabled={isPending || isConfirming}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold rounded-xl hover:from-green-400 hover:to-emerald-400 transition-all disabled:opacity-50"
        >
            {isPending || isConfirming ? 'Settling...' : 'Settle Auction'}
        </button>
    )
}
