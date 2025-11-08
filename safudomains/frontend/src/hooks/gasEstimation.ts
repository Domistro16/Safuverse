import { BigNumber, ethers } from 'ethers'
import { keccak256, encodeAbiParameters, bytesToHex } from 'viem'
import { providers } from 'ethers'
import { useMemo, useCallback, useState, useEffect } from 'react'
import type { Account, Chain, Client, Transport } from 'viem'
import { Config, useConnectorClient } from 'wagmi'
import { constants } from '../constant'

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new providers.Web3Provider(transport, network)
  const signer = provider.getSigner(account.address)
  return signer
}

/** Hook to convert a Viem Client to an ethers.js Signer. */
export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: client } = useConnectorClient<Config>({ chainId })
  return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
}

// 1) Connect to your RPC provider

// 2️⃣ Ask user to connect (if you haven’t already
// 2) Instantiate your controller contract interface
const controllerAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'lifetime',
        type: 'bool',
      },
    ],
    name: 'rentPrice',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'base',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'premium',
            type: 'uint256',
          },
        ],
        internalType: 'struct IPriceOracle.Price',
        name: 'price',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
    ],
    name: 'available',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'secret',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'resolver',
        type: 'address',
      },
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
      {
        internalType: 'bool',
        name: 'reverseRecord',
        type: 'bool',
      },
      {
        internalType: 'uint16',
        name: 'ownerControlledFuses',
        type: 'uint16',
      },
      {
        internalType: 'bool',
        name: 'lifetime',
        type: 'bool',
      },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'commitment',
        type: 'bytes32',
      },
    ],
    name: 'commit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

// 3) Prepare the calldata & arguments for both calls
export function useEstimateENSFees({
  name,
  owner,
  duration,
}: {
  name: string
  owner: `0x${string}`
  duration: number
}) {
  const signer = useEthersSigner()
  const [fees, setFees] = useState<{
    gasUnits: { commit: string; register: string }
    fee: { perGas: string; totalWei: string; totalEth: string }
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const estimate = useCallback(async () => {
    if (!signer || !name || !owner || !duration) return
    setLoading(true)
    setError(null)

    try {
      const controller = new ethers.Contract(
        constants.Controller,
        controllerAbi,
        signer,
      )

      // 1️⃣ commitment

      const labelHash = keccak256(ethers.utils.toUtf8Bytes(name))
      const secretBytes = crypto.getRandomValues(new Uint8Array(32))
      const secret = bytesToHex(secretBytes) as `0x${string}`
      const dummyData: `0x${string}`[] = []
      const encoded = encodeAbiParameters(
        [
          { type: 'bytes32' }, // label
          { type: 'address' }, // owner
          { type: 'uint256' }, // duration
          { type: 'bytes32' }, // secret
          { type: 'address' }, // resolver
          { type: 'bytes[]' }, // data
          { type: 'bool' }, // reverseRecord
          { type: 'uint16' }, // fuses
          { type: 'bool' }, // lifetime
        ],
        [
          labelHash,
          owner,
          BigInt(duration),
          secret,
          '0xF90F11ddD972e661170836e9E3970BBE398988D8',
          dummyData,
          false,
          0,
          true
        ],
      )
      const commitment = keccak256(encoded)

      // 2️⃣ estimate commit gas
      const gasCommit: BigNumber = await controller.estimateGas.commit(
        commitment,
      )
      // 3️⃣ get price and total value
      const { base, premium } = await controller.rentPrice(name, duration, true)
      const totalValue: BigNumber = base.add(premium)
      // 4️⃣ estimate register gas
      let gasRegister: BigNumber
      try {
        gasRegister = await controller.estimateGas.register(
          name,
          owner,
          duration,
          secret,
          '0xF90F11ddD972e661170836e9E3970BBE398988D8',
          dummyData,
          false,
          0,
          true,
          { value: totalValue },
        )
      } catch (error: any) {
        console.log(error)
        if (error) {
          // fallback to a fixed limit
          gasRegister = BigNumber.from(338_568)
        } else {
          throw error
        }
      }
      // 5️⃣ fetch current fee data (EIP-1559)
      const feeData = await signer.provider.getFeeData()
      const maxFee = feeData.maxFeePerGas ?? feeData.gasPrice!
      // combine
      const feeCommit = gasCommit.mul(maxFee)
      const feeRegister = gasRegister.mul(maxFee)
      const totalFee = feeCommit.add(feeRegister)
      setFees({
        gasUnits: {
          commit: gasCommit.toString(),
          register: gasRegister.toString(),
        },
        fee: {
          perGas: maxFee.toString(),
          totalWei: totalFee.toString(),
          totalEth: ethers.utils.formatEther(totalFee),
        },
      })
    } catch (e: any) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [signer, name, owner, duration])

   useEffect(() => {
     estimate()
   }, [estimate])

   return { fees, loading, error, refetch: estimate }
}
