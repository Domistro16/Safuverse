import { useState } from 'react'
import { useWriteContract } from 'wagmi'
import {
  bytesToHex,
  encodeFunctionData,
  namehash,
  encodeAbiParameters,
  keccak256,
  toBytes,
  parseEther,
} from 'viem'
import { ethers } from 'ethers'
import { buildTextRecords } from './setText'
import { Controller, ERC20_ABI, addrResolver } from '../constants/registerAbis'
import { constants, Params } from '../constant'
import { useEthersSigner } from './gasEstimation'
import { normalize } from 'viem/ens'

export const useRegistration = () => {
  const [secret, setSecret] = useState<`0x${string}`>('0x')
  const [commitData, setCommitData] = useState<`0x${string}`[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const signer = useEthersSigner()
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
      const labelHash = keccak256(toBytes(label))
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
          address,
          BigInt(seconds),
          secretGenerated,
          resolver,
          commitData,
          isPrimary,
          0,
          lifetime,
        ],
      )
      const commitment = keccak256(encoded)
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
    priceData: any
  ) => {
    setIsLoading(true)
    const resolver = constants.PublicResolver

    try {
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
      const controller = new ethers.Contract(
        constants.Controller,
        Controller,
        signer,
      )

      if (!useToken) {
        const { base, premium } = (priceData as any) || {
          base: 0n,
          premium: 0n,
        }
        try {
          await controller.callStatic.register(
            normalize(label as string),
            address,
            BigInt(seconds),
            secret,
            resolver,
            commitData,
            isPrimary,
            0,
            lifetime,
            normalize(referrer) || '',
            { value: base + premium },
          )
        } catch (e: any) {
          console.error('Revert error name:', e.errorName)
          console.error('Revert reason   :', e.data)
        }

        await registerContract({
          address: constants.Controller,
          abi: Controller,
          functionName: 'register',
          args: [
            normalize(label as string),
            address,
            BigInt(seconds),
            secret,
            resolver,
            commitData,
            isPrimary,
            0,
            lifetime,
            normalize(referrer) || '',
          ],
          value: base + premium,
        })
      } else {
        await approve({
          address: token,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [constants.Controller, totalAmount + parseEther('1')],
        })

        await new Promise((r) => setTimeout(r, 2000))

        const params: Params = {
          name: label,
          owner: address,
          duration: BigInt(seconds),
          secret,
          resolver,
          data: commitData,
          reverseRecord: isPrimary,
          ownerControlledFuses: 0,
        }

        try {
          await controller.callStatic.registerWithToken(
            params,
            token,
            lifetime,
            referrer || '',
          )
        } catch (e: any) {
          console.error('Revert error name:', e.errorName)
          console.error('Revert reason   :', e.data)
        }

        await registerContract({
          address: constants.Controller,
          abi: Controller,
          functionName: 'registerWithToken',
          args: [params, token, lifetime, referrer || ''],
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
