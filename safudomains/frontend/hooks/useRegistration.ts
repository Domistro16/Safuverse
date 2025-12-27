import { useState } from 'react'
import { useWriteContract } from 'wagmi'
import {
  bytesToHex,
  encodeFunctionData,
  namehash,
  parseEther,
  keccak256,
  toBytes,
  encodeAbiParameters,
} from 'viem'
import { buildTextRecords } from './setText'
import {
  Controller,
  ERC20_ABI,
  addrResolver,
  RegisterRequest,
  ReferralData,
  EMPTY_REFERRAL_DATA,
  EMPTY_REFERRAL_SIGNATURE,
} from '../constants/registerAbis'
import { constants } from '../constant'
import { normalize } from 'viem/ens'

export const useRegistration = () => {
  const [secret, setSecret] = useState<`0x${string}`>('0x')
  const [commitData, setCommitData] = useState<`0x${string}`[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { data: commithash, writeContractAsync } = useWriteContract()
  const { writeContractAsync: approve } = useWriteContract()
  const {
    data: registerhash,
    error: registerError,
    isPending: registerPending,
    writeContractAsync: registerContract,
  } = useWriteContract()

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
  }

  // Helper to compute commitment hash (matches contract's makeCommitment)
  const computeCommitment = (req: RegisterRequest): `0x${string}` => {
    const labelHash = keccak256(toBytes(req.name))
    const encoded = encodeAbiParameters(
      [
        { type: 'bytes32' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'address' },
        { type: 'bytes[]' },
        { type: 'bool' },
        { type: 'uint16' },
        { type: 'bool' },
      ],
      [
        labelHash,
        req.owner,
        req.duration,
        req.secret,
        req.resolver,
        req.data,
        req.reverseRecord,
        req.ownerControlledFuses,
        req.lifetime,
      ],
    )
    return keccak256(encoded)
  }

  // Fetch referral data from API
  const fetchReferralData = async (
    referralCode: string,
    registrantAddress: string,
    name: string,
  ): Promise<{ referralData: ReferralData; signature: `0x${string}` }> => {
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

    // Return empty referral if error or no valid referral
    return {
      referralData: EMPTY_REFERRAL_DATA,
      signature: EMPTY_REFERRAL_SIGNATURE,
    }
  }

  const commit = async (
    label: string,
    address: `0x${string}`,
    seconds: number,
    isPrimary: boolean,
    lifetime: boolean,
  ) => {
    const secretBytes = crypto.getRandomValues(new Uint8Array(32))
    const secretGenerated = bytesToHex(secretBytes) as `0x${string}`
    setSecret(secretGenerated)
    const resolver = constants.PublicResolver

    try {
      // Build the RegisterRequest struct for makeCommitment
      const registerRequest: RegisterRequest = {
        name: normalize(label),
        owner: address,
        duration: BigInt(seconds),
        secret: secretGenerated,
        resolver: resolver as `0x${string}`,
        data: commitData,
        reverseRecord: isPrimary,
        ownerControlledFuses: 0,
        lifetime: lifetime,
      }

      // Compute commitment hash matching the contract
      const commitment = computeCommitment(registerRequest)

      await writeContractAsync({
        address: constants.Controller,
        account: address,
        abi: Controller,
        functionName: 'commit',
        args: [commitment],
      })
    } catch (error) {
      console.error('Error during Commit', error)
      setIsLoading(false)
      throw error
    }
  }

  const register = async (
    label: string,
    address: `0x${string}`,
    seconds: number,
    isPrimary: boolean,
    lifetime: boolean,
    referrer: string,
    useToken: boolean,
    token: `0x${string}`,
    usd1TokenData: any,
    cakeTokenData: any,
    priceData: any,
  ) => {
    setIsLoading(true)
    const resolver = constants.PublicResolver

    try {
      // Build the RegisterRequest struct
      const registerRequest: RegisterRequest = {
        name: normalize(label),
        owner: address,
        duration: BigInt(seconds),
        secret: secret,
        resolver: resolver as `0x${string}`,
        data: commitData,
        reverseRecord: isPrimary,
        ownerControlledFuses: 0,
        lifetime: lifetime,
      }

      // Fetch referral data from the API
      const { referralData, signature } = await fetchReferralData(
        referrer,
        address,
        normalize(label),
      )

      if (!useToken) {
        // BNB payment
        const { base, premium } = (priceData as any) || {
          base: 0n,
          premium: 0n,
        }
        const value = base + premium

        await registerContract({
          address: constants.Controller,
          abi: Controller,
          functionName: 'register',
          args: [registerRequest, referralData, signature],
          value: value,
        })
      } else {
        // Token payment
        let value = 0n

        if (token == '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82') {
          const { base, premium } = (cakeTokenData as any) || {
            base: 0n,
            premium: 0n,
          }
          value = base + premium
        } else {
          const { base, premium } = (usd1TokenData as any) || {
            base: 0n,
            premium: 0n,
          }
          value = base + premium
        }

        const totalAmount = value

        // Approve token spending
        await approve({
          address: token,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [constants.Controller, totalAmount + parseEther('1')],
        })

        // Wait for approval to be mined
        await new Promise((r) => setTimeout(r, 2000))

        // Register with token
        await registerContract({
          address: constants.Controller,
          abi: Controller,
          functionName: 'registerWithToken',
          args: [registerRequest, token, referralData, signature],
        })
      }
    } catch (error) {
      console.error('Error during Registration', error)
      setIsLoading(false)
      throw error
    }
  }

  return {
    secret,
    commitData,
    isLoading,
    commithash,
    registerhash,
    registerError,
    registerPending,
    setIsLoading,
    buildCommitDataFn,
    commit,
    register,
  }
}
