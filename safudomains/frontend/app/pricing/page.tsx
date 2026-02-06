'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="landing-page-container">
      <div className="max-w-5xl mx-auto">
        <button
          className="mb-8 flex items-center gap-2 text-gray-500 hover:text-black transition-colors"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="w-4 h-4" /> Back Home
        </button>

        <h2 className="text-4xl font-extrabold text-center mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Transparent Pricing.
        </h2>
        <p className="text-center text-gray-500 mb-12">
          One-time minting fee. No renewal costs. Lifetime ownership.
        </p>

        <div className="pricing-split-container">
          {/* Agent Pricing */}
          <div className="pricing-card agent">
            <div className="pricing-header">AI Agents</div>
            <div className="pricing-sub">For autonomous on-chain actors.</div>

            <div className="pricing-price-box">
              <div className="pp-val">$0.01 - 0.10</div>
              <div className="pp-label">Variable Gas-Optimized Rate</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              <div className="text-xs font-bold text-gray-400 uppercase mb-2">Example</div>
              <div className="font-mono text-sm text-black">the-defi-agent.safu</div>
            </div>

            <div className="pricing-list">
              <div className="pl-item">
                <span className="pl-name">API Minting Access</span>
                <span className="pl-price"><Check className="w-4 h-4 text-green-500" /></span>
              </div>
              <div className="pl-item">
                <span className="pl-name">x402 Standard</span>
                <span className="pl-price"><Check className="w-4 h-4 text-green-500" /></span>
              </div>
              <div className="pl-item">
                <span className="pl-name">Rate Limit</span>
                <span className="pl-price">100/min</span>
              </div>
              <div className="pl-item">
                <span className="pl-name">Transferable</span>
                <span className="pl-price text-gray-400">Restricted</span>
              </div>
            </div>
          </div>

          {/* Human Pricing */}
          <div className="pricing-card human">
            <div className="pricing-header" style={{ color: '#FFB000' }}>Humans</div>
            <div className="pricing-sub" style={{ color: '#9CA3AF' }}>For personal web3 identity.</div>

            <div className="pricing-list mt-4">
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-gray-300">
                  1 Character <span className="rarity-badge gold">Ultra Rare</span>
                </span>
                <span className="pl-price" style={{ color: '#FFB000' }}>$2,000</span>
              </div>
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-gray-300">
                  2 Characters <span className="rarity-badge purple">Very Rare</span>
                </span>
                <span className="pl-price" style={{ color: '#FFB000' }}>$1,000</span>
              </div>
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-gray-300">
                  3 Characters <span className="rarity-badge blue">Rare</span>
                </span>
                <span className="pl-price text-white">$200</span>
              </div>
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-gray-300">4 Characters</span>
                <span className="pl-price text-white">$40</span>
              </div>
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-gray-300">5 Characters</span>
                <span className="pl-price text-white">$10</span>
              </div>
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-gray-300">6-9 Characters</span>
                <span className="pl-price text-white">$5</span>
              </div>
              <div className="pl-item" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <span className="pl-name text-white font-bold">10+ Characters</span>
                <span className="pl-price text-white">$2</span>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <button
                className="w-full bg-[#FFB000] text-black font-bold py-4 rounded-xl hover:bg-white transition-colors"
                onClick={() => router.push('/')}
              >
                Mint Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
