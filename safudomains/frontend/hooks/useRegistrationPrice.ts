import { useState, useEffect, useMemo } from 'react'
import { SafuDomainsClient } from '@safuverse/safudomains-sdk'
import { useChainId } from 'wagmi'
import { CHAIN_ID } from '../constant'

interface UseRegistrationPriceProps {
  label: string
  // Backward compatibility - these are ignored in v2 (always lifetime)
  seconds?: number
  lifetime?: boolean
}

interface PriceResult {
  priceWei: bigint
  priceUsd: bigint
  isAgentName: boolean
}

export const useRegistrationPrice = ({
  label,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seconds,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lifetime,
}: UseRegistrationPriceProps) => {
  const [priceResult, setPriceResult] = useState<PriceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const chainId = useChainId()

  // Create SDK client
  const sdk = useMemo(() => {
    return new SafuDomainsClient({ chainId: chainId || CHAIN_ID })
  }, [chainId])

  // Fetch price when label changes
  useEffect(() => {
    if (!label || label.length === 0) {
      setPriceResult(null)
      return
    }

    const fetchPrice = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await sdk.getPrice(label)
        setPriceResult(result)
      } catch (err) {
        console.error('Error fetching price:', err)
        setError(err as Error)
        setPriceResult(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()
  }, [label, sdk])

  // Format price for display (bnb -> eth for Base chain)
  const price = useMemo(() => {
    if (!priceResult) {
      return {
        bnb: '0.0000',
        usd: '0.00',
        usd1: '0.00',
        cake: '0.00',
      }
    }

    const ethValue = Number(priceResult.priceWei) / 1e18
    const usdValue = Number(priceResult.priceUsd) / 1e18

    return {
      bnb: ethValue.toFixed(4), // Using 'bnb' key for backward compat
      usd: usdValue < 1 ? usdValue.toFixed(2) : usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      usd1: usdValue.toFixed(2), // Backward compat
      cake: '0.00', // Not available on Base
    }
  }, [priceResult])

  // Backward compatible 'latest' format (simulates old rentPrice return)
  const latest = useMemo(() => {
    if (!priceResult) return null
    return {
      base: priceResult.priceWei,
      premium: 0n,
    }
  }, [priceResult])

  // Backward compatibility - empty token data (not used on Base)
  const usd1TokenData = useMemo(() => ({
    base: 0n,
    premium: 0n,
  }), [])

  const cakeTokenData = useMemo(() => ({
    base: 0n,
    premium: 0n,
  }), [])

  // priceData for backward compat
  const priceData = latest

  return {
    price,
    loading,
    tokenLoading: false,
    caketokenLoading: false,
    latest,
    usd1TokenData,
    cakeTokenData,
    priceData,
    // v2 additions
    priceResult,
    isAgentName: priceResult?.isAgentName ?? false,
    error,
    sdk,
  }
}
