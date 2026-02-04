import { useState, useMemo } from 'react'
import { useWalletClient } from 'wagmi'
import { namehash, encodeFunctionData } from 'viem'
import { SafuDomainsClient } from '@safuverse/safudomains-sdk'
import { buildTextRecords } from './setText'
import { addrResolver, ReferralData, EMPTY_REFERRAL_DATA, EMPTY_REFERRAL_SIGNATURE } from '../constants/registerAbis'
import { constants, CHAIN_ID } from '../constant'
import { normalize } from 'viem/ens'

export const useRegistration = () => {
  const [commitData, setCommitData] = useState<`0x${string}`[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const { data: walletClient } = useWalletClient()

  // Create SDK client with wallet
  const sdk = useMemo(() => {
    if (!walletClient) return null
    return new SafuDomainsClient({
      chainId: CHAIN_ID,
      walletClient: walletClient as any,
    })
  }, [walletClient])

  // Build resolver data for text records and address
  const buildCommitDataFn = (
    textRecords: { key: string; value: string }[],
    newRecords: { key: string; value: string }[],
    label: string,
    owner: `0x${string}`,
  ) => {
    const complete = [...textRecords, ...newRecords]
    const validTextRecords = complete.filter(
      (r) => r.key.trim() !== '' && r.value.trim() !== '',
    )

    const builtData = buildTextRecords(
      validTextRecords,
      namehash(`${label}.safu`),
    )
    const addrEncoded = encodeFunctionData({
      abi: addrResolver,
      functionName: 'setAddr',
      args: [namehash(`${label}.safu`), owner],
    })
    const fullData = [...builtData, addrEncoded]
    setCommitData(fullData)
    return fullData
  }

  // Fetch referral data from API
  const fetchReferralData = async (
    referralCode: string,
    registrantAddress: string,
    name: string,
  ): Promise<{ referralData: ReferralData; signature: `0x${string}` }> => {
    if (!referralCode) {
      return {
        referralData: EMPTY_REFERRAL_DATA,
        signature: EMPTY_REFERRAL_SIGNATURE,
      }
    }

    try {
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode,
          registrantAddress,
          name,
        }),
      })

      const data = await response.json()

      if (data.success && data.referralData) {
        return {
          referralData: {
            referrer: data.referralData.referrer as `0x${string}`,
            registrant: data.referralData.registrant as `0x${string}`,
            nameHash: data.referralData.nameHash as `0x${string}`,
            referrerCodeHash: data.referralData.referrerCodeHash as `0x${string}`,
            deadline: BigInt(data.referralData.deadline),
            nonce: data.referralData.nonce as `0x${string}`,
          },
          signature: (data.signature || '0x') as `0x${string}`,
        }
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    }

    return {
      referralData: EMPTY_REFERRAL_DATA,
      signature: EMPTY_REFERRAL_SIGNATURE,
    }
  }

  // Register a domain name (v2 - always lifetime, ETH only)
  const register = async (
    label: string,
    address: `0x${string}`,
    isPrimary: boolean,
    referrer: string = '',
  ) => {
    if (!sdk) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      const normalizedLabel = normalize(label)

      // Build data for resolver if not already built
      const data = commitData.length > 0 ? commitData : buildCommitDataFn([], [], label, address)

      // Fetch referral data if provided
      const { referralData } = await fetchReferralData(
        referrer,
        address,
        normalizedLabel,
      )

      // Register using SDK
      const hash = await sdk.register(normalizedLabel, {
        reverseRecord: isPrimary,
        resolver: constants.PublicResolver,
        data,
        referral: referralData,
      })

      setTxHash(hash)
      return hash
    } catch (err) {
      console.error('Error during registration:', err)
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Batch register multiple names
  const batchRegister = async (
    names: string[],
    address: `0x${string}`,
    isPrimary: boolean,
  ) => {
    if (!sdk) {
      throw new Error('Wallet not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const normalizedNames = names.map(normalize)

      const hash = await sdk.batchRegister(normalizedNames, {
        reverseRecord: isPrimary,
        resolver: constants.PublicResolver,
      })

      setTxHash(hash)
      return hash
    } catch (err) {
      console.error('Error during batch registration:', err)
      setError(err as Error)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // Check if name is available
  const checkAvailable = async (name: string): Promise<boolean> => {
    if (!sdk) return false
    try {
      return await sdk.available(normalize(name))
    } catch {
      return false
    }
  }

  return {
    // Backward compatibility
    secret: '0x' as `0x${string}`,
    commitData,
    isLoading,
    commithash: txHash,
    registerhash: txHash,
    registerError: error,
    registerPending: isLoading,
    setIsLoading,
    buildCommitDataFn,
    // Backward compatible commit (no-op in v2 - agent mode skips commit-reveal)
    commit: async (
      _label: string,
      _address: `0x${string}`,
      _seconds: number,
      _isPrimary: boolean,
      _lifetime: boolean,
    ) => {
      // v2 agent mode doesn't require commit-reveal, so this is a no-op
      return
    },
    // Backward compatible register with old signature
    register: async (
      label: string,
      address: `0x${string}`,
      seconds: number,
      isPrimary: boolean,
      lifetime: boolean,
      referrer: string = '',
      useToken: boolean = false,
      token: `0x${string}` = '0x0000000000000000000000000000000000000000',
      usd1TokenData: any = null,
      cakeTokenData: any = null,
      priceData: any = null,
    ) => {
      // v2 ignores seconds, lifetime, useToken, token, usd1TokenData, cakeTokenData
      if (!sdk) {
        throw new Error('Wallet not connected')
      }

      setIsLoading(true)
      setError(null)
      setTxHash(null)

      try {
        const normalizedLabel = normalize(label)
        const data = commitData.length > 0 ? commitData : buildCommitDataFn([], [], label, address)
        const { referralData } = await fetchReferralData(referrer, address, normalizedLabel)

        const hash = await sdk.register(normalizedLabel, {
          reverseRecord: isPrimary,
          resolver: constants.PublicResolver,
          data,
          referral: referralData,
        })

        setTxHash(hash)
        return hash
      } catch (err) {
        console.error('Error during registration:', err)
        setError(err as Error)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    // v2 additions
    txHash,
    error,
    sdk,
    batchRegister,
    checkAvailable,
  }
}
