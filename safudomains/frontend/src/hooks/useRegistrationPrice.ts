import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { Controller, PriceAbi } from '../constants/registerAbis'
import { constants } from '../constant'

interface UseRegistrationPriceProps {
  label: string
  seconds: number
  lifetime: boolean
}

export const useRegistrationPrice = ({
  label,
  seconds,
  lifetime,
}: UseRegistrationPriceProps) => {
  // Fetch base rent price in native currency (BNB)
  const { data: latest, isPending: loading } = useReadContract({
    address: constants.Controller,
    abi: Controller as any,
    functionName: 'rentPrice',
    args: [label, seconds, lifetime],
  })

  // Fetch price in USD1 token
  const { data: usd1TokenData, isPending: tokenLoading } = useReadContract({
    address: constants.Controller,
    abi: Controller as any,
    functionName: 'rentPriceToken',
    args: [label, seconds, 'usd1', lifetime],
  })

  // Fetch price in CAKE token
  const { data: cakeTokenData, isPending: caketokenLoading } = useReadContract({
    address: constants.Controller,
    abi: Controller as any,
    functionName: 'rentPriceToken',
    args: [label, seconds, 'cake', lifetime],
  })

  // Fetch BNB/USD price from Chainlink oracle
  const { data: priceData } = useReadContract({
    address: '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
    abi: PriceAbi as any,
    functionName: 'latestRoundData',
  })

  // Calculate prices in different formats
  const price = useMemo(() => {
    let usd1priceInBNB = 0
    let cakepriceInBNB = 0

    if (!tokenLoading) {
      const { base, premium } = (usd1TokenData as any) || {
        base: 0,
        premium: 0,
      }
      usd1priceInBNB = (Number(base) + Number(premium)) / 1e18
    }

    if (!caketokenLoading) {
      const { base, premium } = (cakeTokenData as any) || {
        base: 0,
        premium: 0,
      }
      cakepriceInBNB = (Number(base) + Number(premium)) / 1e18
    }

    const { base } = (latest as any) || { base: 0 }
    const [, answer, , ,] = (priceData as any) || [0, 0, 0, 0, 0]
    const bnbPrice = Number(answer) / 1e8 // Chainlink ETH/USD has 8 decimals
    const costInEth = Number(base) / 1e18 // base is in wei
    const usdCost = costInEth * bnbPrice
    const usd1cost = usd1priceInBNB
    const cakecost = cakepriceInBNB

    return {
      bnb: costInEth.toFixed(4),
      usd: usdCost.toFixed(2),
      usd1: usd1cost.toFixed(2),
      cake: cakecost.toFixed(2),
    }
  }, [
    latest,
    priceData,
    usd1TokenData,
    cakeTokenData,
    tokenLoading,
    caketokenLoading,
  ])

  return {
    price,
    loading,
    tokenLoading,
    caketokenLoading,
    latest,
    usd1TokenData,
    cakeTokenData,
    priceData,
  }
}
