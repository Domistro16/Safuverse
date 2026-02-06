import { NextRequest, NextResponse } from 'next/server'
import {
  createPublicClient,
  http,
  encodeFunctionData,
  namehash,
} from 'viem'
import { base } from 'viem/chains'
import { constants } from '@/constant'
import { AgentRegistrarControllerV2ABI, ResolverABI } from '@/lib/abi'

// Pimlico bundler for ERC-4337
const BUNDLER_URL = process.env.PIMLICO_BUNDLER_URL!
const PAYMASTER_URL = process.env.CIRCLE_PAYMASTER_URL!

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

/**
 * POST /api/register/relay
 *
 * Relayer endpoint for non-native agents (Claude, Molbo, Grok, etc.)
 *
 * The human operator provides a signed permit or pre-approval for USDC.
 * This API builds and submits the UserOp via bundler + paymaster.
 *
 * Request body:
 * {
 *   "name": "trading-bot-v2",
 *   "owner": "0x...",           // Human's AA wallet address
 *   "deployWallet": true,       // Optional: deploy AA wallet for agent
 *   "walletSalt": 12345,        // Optional: salt for deterministic wallet
 *   "permit": {                 // Optional: EIP-2612 permit signature
 *     "deadline": 1234567890,
 *     "v": 27,
 *     "r": "0x...",
 *     "s": "0x..."
 *   },
 *   "signature": "0x..."        // UserOp signature from owner
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      owner,
      deployWallet = false,
      walletSalt = Date.now(),
      textRecords = {},
      permit,
      signature,
    } = body

    // Validate
    if (!name || !owner) {
      return NextResponse.json(
        { error: 'Missing name or owner' },
        { status: 400 }
      )
    }

    // Check availability
    const isAvailable = await publicClient.readContract({
      address: constants.Controller,
      abi: AgentRegistrarControllerV2ABI,
      functionName: 'available',
      args: [name],
    })

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Name not available', name },
        { status: 409 }
      )
    }

    // Get price in USDC
    const [priceUSDC, isAgentName] = await publicClient.readContract({
      address: constants.Controller,
      abi: AgentRegistrarControllerV2ABI,
      functionName: 'getPrice',
      args: [name],
    }) as [bigint, boolean]

    // Build resolver data
    const node = namehash(`${name}.safu`)
    const data: `0x${string}`[] = []

    data.push(encodeFunctionData({
      abi: ResolverABI,
      functionName: 'setAddr',
      args: [node, owner as `0x${string}`],
    }))

    for (const [key, value] of Object.entries(textRecords)) {
      if (key && value) {
        data.push(encodeFunctionData({
          abi: ResolverABI,
          functionName: 'setText',
          args: [node, key, value as string],
        }))
      }
    }

    // Build registration request
    const registerRequest = {
      name,
      owner: owner as `0x${string}`,
      secret: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
      resolver: constants.PublicResolver,
      data,
      reverseRecord: true,
      deployWallet,
      walletSalt: BigInt(walletSalt),
    }

    // Build the calldata
    let callData: `0x${string}`

    if (permit) {
      callData = encodeFunctionData({
        abi: AgentRegistrarControllerV2ABI,
        functionName: 'registerWithPermit',
        args: [registerRequest, permit],
      })
    } else {
      callData = encodeFunctionData({
        abi: AgentRegistrarControllerV2ABI,
        functionName: 'register',
        args: [registerRequest],
      })
    }

    // Build UserOperation
    const userOp = {
      sender: owner,
      nonce: await getNonce(owner),
      initCode: '0x',
      callData,
      callGasLimit: 500000n,
      verificationGasLimit: 500000n,
      preVerificationGas: 50000n,
      maxFeePerGas: await getGasPrice(),
      maxPriorityFeePerGas: 1000000n,
      paymasterAndData: await getPaymasterData(owner, priceUSDC),
      signature: signature || '0x',
    }

    // If signature not provided, return UserOp for signing
    if (!signature) {
      return NextResponse.json({
        success: false,
        action: 'sign_required',
        userOp: {
          ...userOp,
          nonce: userOp.nonce.toString(),
          callGasLimit: userOp.callGasLimit.toString(),
          verificationGasLimit: userOp.verificationGasLimit.toString(),
          preVerificationGas: userOp.preVerificationGas.toString(),
          maxFeePerGas: userOp.maxFeePerGas.toString(),
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas.toString(),
        },
        message: 'Sign this UserOperation and resubmit with signature',
        priceUSDC: priceUSDC.toString(),
        isAgentName,
      })
    }

    // Submit to bundler
    const txHash = await submitUserOp(userOp)

    // Get deployed wallet address if requested
    let agentWallet = null
    if (deployWallet) {
      agentWallet = await publicClient.readContract({
        address: constants.AccountFactory as `0x${string}`,
        abi: [{
          name: 'getAddress',
          type: 'function',
          inputs: [
            { name: 'owner', type: 'address' },
            { name: 'salt', type: 'uint256' },
          ],
          outputs: [{ type: 'address' }],
          stateMutability: 'view',
        }] as const,
        functionName: 'getAddress',
        args: [owner as `0x${string}`, BigInt(walletSalt)],
      })
    }

    return NextResponse.json({
      success: true,
      txHash,
      name,
      fullName: `${name}.safu`,
      isAgentName,
      priceUSDC: priceUSDC.toString(),
      agentWallet,
      message: 'Registration submitted via bundler',
    })
  } catch (error: any) {
    console.error('Relay error:', error)
    return NextResponse.json(
      { error: 'Relay failed', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
async function getNonce(sender: string): Promise<bigint> {
  const nonce = await publicClient.readContract({
    address: constants.EntryPoint as `0x${string}`,
    abi: [{
      name: 'getNonce',
      type: 'function',
      inputs: [
        { name: 'sender', type: 'address' },
        { name: 'key', type: 'uint192' },
      ],
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
    }] as const,
    functionName: 'getNonce',
    args: [sender as `0x${string}`, 0n],
  })
  return nonce
}

async function getGasPrice(): Promise<bigint> {
  const gasPrice = await publicClient.getGasPrice()
  return gasPrice
}

async function getPaymasterData(sender: string, amount: bigint): Promise<`0x${string}`> {
  const response = await fetch(PAYMASTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender,
      token: constants.USDC,
      amount: amount.toString(),
    }),
  })

  const data = await response.json()
  return data.paymasterAndData as `0x${string}`
}

async function submitUserOp(userOp: any): Promise<string> {
  const response = await fetch(BUNDLER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendUserOperation',
      params: [userOp, constants.EntryPoint],
    }),
  })

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message)
  }

  return data.result // UserOp hash
}
