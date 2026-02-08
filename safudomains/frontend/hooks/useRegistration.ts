import { useState, useCallback, useMemo } from 'react'
import { useChainId, usePublicClient, useConfig } from 'wagmi'
import { getWalletClient } from '@wagmi/core'
import { namehash, encodeFunctionData, createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { buildTextRecords } from './setText'
import { addrResolver, ReferralData, EMPTY_REFERRAL_DATA, EMPTY_REFERRAL_SIGNATURE, ERC20_ABI } from '../constants/registerAbis'
import { getConstants, CHAIN_ID } from '../constant'
import { AgentRegistrarControllerABI } from '../lib/abi'
import { normalize } from 'viem/ens'
import { AgentRegistrarControllerAbi } from '@safuverse/safudomains-sdk'

export type RegistrationStep = 'idle' | 'committing' | 'waiting' | 'approving' | 'registering' | 'done' | 'error'

export const useRegistration = () => {
  const [commitData, setCommitData] = useState<`0x${string}`[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<RegistrationStep>('idle')
  const [commitHash, setCommitHash] = useState<`0x${string}` | null>(null)
  const [registerHash, setRegisterHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [secret, setSecret] = useState<`0x${string}`>('0x0000000000000000000000000000000000000000000000000000000000000000')

  const config = useConfig()
  const wagmiPublicClient = usePublicClient()
  const chainId = useChainId()
  const constants = getConstants(chainId)

  // Create a fallback public client in case wagmi's usePublicClient returns undefined
  const fallbackPublicClient = useMemo(() => {
    const chain = (chainId || CHAIN_ID) === 8453 ? base : baseSepolia
    return createPublicClient({ chain, transport: http() })
  }, [chainId])

  const publicClient = wagmiPublicClient ?? fallbackPublicClient

  // Build resolver data for text records and address
  const buildCommitDataFn = useCallback((
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
  }, [])

  // Generate a random secret for commit-reveal
  const generateSecret = useCallback((): `0x${string}` => {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    const newSecret = `0x${Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`
    setSecret(newSecret)
    return newSecret
  }, [])

  // Fetch referral data from API
  const fetchReferralData = useCallback(async (
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
  }, [])

  // Step 1: Commit transaction
  const commit = useCallback(async (
    label: string,
    owner: `0x${string}`,
    isPrimary: boolean,
    data: `0x${string}`[],
  ) => {
    setIsLoading(true)
    setError(null)
    setStep('committing')

    try {
      // Get wallet client at call time (reliable with Privy + wagmi)
      const wc = await getWalletClient(config)

      const normalizedLabel = normalize(label)
      const commitSecret = generateSecret()

      // Generate commitment hash using makeCommitment on contract
      const commitment = await publicClient.readContract({
        address: constants.Controller,
        abi: AgentRegistrarControllerAbi,
        functionName: 'makeCommitment',
        args: [
          normalizedLabel,
          owner,
          commitSecret,
          constants.PublicResolver,
          data,
          isPrimary,
          0, // ownerControlledFuses
        ],
      })

      // Send commit transaction
      const [account] = await wc.getAddresses()
      const hash = await wc.writeContract({
        address: constants.Controller,
        abi: AgentRegistrarControllerAbi,
        functionName: 'commit',
        args: [commitment],
        account,
      })

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      setCommitHash(hash)
      setStep('waiting')

      // Start 60 second countdown
      let remaining = 60
      setCountdown(remaining)
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          remaining--
          setCountdown(remaining)
          if (remaining <= 0) {
            clearInterval(interval)
            resolve()
          }
        }, 1000)
      })

      setStep('idle')
      setIsLoading(false)
      return hash
    } catch (err) {
      console.error('Error during commit:', err)
      setError(err as Error)
      setStep('error')
      setIsLoading(false)
      throw err
    }
  }, [config, publicClient, constants, generateSecret])

  // Step 2: Approve USDC + Register with USDC
  const registerWithUSDC = useCallback(async (
    label: string,
    owner: `0x${string}`,
    isPrimary: boolean,
    referrer: string = '',
    data?: `0x${string}`[],
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      // Get wallet client at call time (reliable with Privy + wagmi)
      const wc = await getWalletClient(config)

      const normalizedLabel = normalize(label)
      const resolverData = data || commitData

      // Get price in USDC
      const priceResult = await publicClient.readContract({
        address: constants.Controller,
        abi: AgentRegistrarControllerABI,
        functionName: 'getPrice',
        args: [normalizedLabel],
      }) as [bigint, boolean]
      const priceUSDC = priceResult[0]

      const [account] = await wc.getAddresses()

      // Check and approve USDC allowance
      setStep('approving')
      const currentAllowance = await publicClient.readContract({
        address: constants.USDC,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [account, constants.Controller],
      }) as bigint

      if (currentAllowance < priceUSDC) {
        const approveHash = await wc.writeContract({
          address: constants.USDC,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [constants.Controller, priceUSDC],
          account,
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      // Build registration request
      const request = {
        name: normalizedLabel,
        owner,
        secret,
        resolver: constants.PublicResolver,
        data: resolverData,
        reverseRecord: isPrimary,
        ownerControlledFuses: 0,
        deployWallet: false,
        walletSalt: 0n,
      }

      // Register with USDC
      setStep('registering')
      const hash = await wc.writeContract({
        address: constants.Controller,
        abi: AgentRegistrarControllerABI,
        functionName: 'registerWithUSDC',
        args: [request],
        account,
      })

      await publicClient.waitForTransactionReceipt({ hash })
      setRegisterHash(hash)
      setStep('done')
      return hash
    } catch (err) {
      console.error('Error during USDC registration:', err)
      setError(err as Error)
      setStep('error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [config, publicClient, constants, commitData, secret, fetchReferralData])

  return {
    // State
    step,
    commitData,
    isLoading,
    commitHash,
    registerHash,
    error,
    countdown,
    secret,
    // Backward compat aliases
    commithash: commitHash,
    registerhash: registerHash,
    registerError: error,
    registerPending: isLoading,
    setIsLoading,
    // Functions
    buildCommitDataFn,
    commit,
    registerWithUSDC,
    // Backward compat wrapper
    register: async (
      label: string,
      address: `0x${string}`,
      _seconds: number,
      isPrimary: boolean,
      _lifetime: boolean,
      referrer: string = '',
      _useToken: boolean = false,
      _token: `0x${string}` = '0x0000000000000000000000000000000000000000',
      _usd1TokenData: any = null,
      _cakeTokenData: any = null,
      _priceData: any = null,
    ) => {
      return registerWithUSDC(label, address, isPrimary, referrer)
    },
  }
}
