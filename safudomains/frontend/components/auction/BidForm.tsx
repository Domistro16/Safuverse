'use client'

import { useState } from 'react'
import { parseEther, formatEther } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

interface BidFormProps {
    auctionId: number
    minBid: bigint
    isUSDC: boolean
}

export function BidForm({ auctionId, minBid, isUSDC }: BidFormProps) {
    const { address, isConnected } = useAccount()
    const [bidAmount, setBidAmount] = useState('')

    const { writeContract, data: hash, isPending } = useWriteContract()
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

    const currency = isUSDC ? 'USDC' : 'ETH'
    const minBidFormatted = formatEther(minBid)

    // Quick bid multipliers
    const quickBids = [1, 1.1, 1.25, 1.5].map((m) => ({
        multiplier: m,
        amount: (minBid * BigInt(Math.floor(m * 100))) / 100n,
        label: m === 1 ? 'Min' : `+${((m - 1) * 100).toFixed(0)}%`,
    }))

    const handleBid = () => {
        if (!bidAmount || !isConnected) return

        const amount = parseEther(bidAmount)

        // TODO: Add actual contract call
        console.log('Placing bid:', { auctionId, amount: amount.toString(), isUSDC })
    }

    const isValidBid = bidAmount && parseEther(bidAmount || '0') >= minBid

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm text-gray-400 mb-2">
                    Your Bid (Min: {minBidFormatted} {currency})
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={minBidFormatted}
                            className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-lg focus:border-yellow-500 focus:outline-none transition-colors"
                            step="0.01"
                            min={Number(minBidFormatted)}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                            {currency}
                        </span>
                    </div>
                    <button
                        onClick={handleBid}
                        disabled={!isConnected || isPending || isConfirming || !isValidBid}
                        className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPending || isConfirming ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin">⏳</span> Bidding...
                            </span>
                        ) : (
                            'Place Bid'
                        )}
                    </button>
                </div>
            </div>

            {/* Quick bid buttons */}
            <div className="grid grid-cols-4 gap-2">
                {quickBids.map(({ multiplier, amount, label }) => (
                    <button
                        key={multiplier}
                        onClick={() => setBidAmount(formatEther(amount))}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${bidAmount === formatEther(amount)
                                ? 'bg-yellow-500/30 border border-yellow-500 text-yellow-400'
                                : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                            }`}
                    >
                        <div className="text-xs text-gray-500">{label}</div>
                        <div>{formatEther(amount).slice(0, 6)}</div>
                    </button>
                ))}
            </div>

            {/* Wallet connection warning */}
            {!isConnected && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-center text-sm text-yellow-400">
                    Connect your wallet to place a bid
                </div>
            )}

            {/* Success message */}
            {isSuccess && (
                <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-center text-sm text-green-400">
                    ✅ Bid placed successfully!
                </div>
            )}
        </div>
    )
}
