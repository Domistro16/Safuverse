import { NextRequest, NextResponse } from 'next/server'
import {
  createPublicClient,
  http,
  encodeFunctionData,
  namehash,
  toHex,
} from 'viem'
import { base } from 'viem/chains'
import { constants } from '@/constant'
import { AgentRegistrarControllerV2ABI, ResolverABI } from '@/lib/abi'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

/**
 * POST /api/register/build-userop
 *
 * Builds a UserOperation for the agent to sign.
 * Returns everything needed for the agent's wallet to sign and submit.
 *
 * Request body:
 * {
 *   "name": "my-agent-v1",
 *   "sender": "0x...",        // Agent's AA wallet address
 *   "deployWallet": false,    // Usually false for autonomous agents (already have wallet)
 *   "textRecords": {}
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      sender,
      deployWallet = false,
      walletSalt = 0,
      textRecords = {},
    } = body

    if (!name || !sender) {
      return NextResponse.json(
        { error: 'Missing name or sender' },
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
        { error: 'Name not available' },
        { status: 409 }
      )
    }

    // Get price
    const [priceUSDC, isAgentName] = await publicClient.readContract({
      address: constants.Controller,
      abi: AgentRegistrarControllerV2ABI,
      functionName: 'getPrice',
      args: [name],
    }) as [bigint, boolean]

    // Build resolver data
    const node = namehash(`${name}.safu`)
    const resolverData: `0x${string}`[] = []

    resolverData.push(encodeFunctionData({
      abi: ResolverABI,
      functionName: 'setAddr',
      args: [node, sender as `0x${string}`],
    }))

    for (const [key, value] of Object.entries(textRecords)) {
      if (key && value) {
        resolverData.push(encodeFunctionData({
          abi: ResolverABI,
          functionName: 'setText',
          args: [node, key, value as string],
        }))
      }
    }

    // Build registration calldata
    const registerRequest = {
      name,
      owner: sender as `0x${string}`,
      secret: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
      resolver: constants.PublicResolver,
      data: resolverData,
      reverseRecord: true,
      deployWallet,
      walletSalt: BigInt(walletSalt),
    }

    const registerCallData = encodeFunctionData({
      abi: AgentRegistrarControllerV2ABI,
      functionName: 'register',
      args: [registerRequest],
    })

    // For AA wallet, wrap in execute() call
    const executeCallData = encodeFunctionData({
      abi: [{
        name: 'execute',
        type: 'function',
        inputs: [
          { name: 'dest', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'func', type: 'bytes' },
        ],
        outputs: [],
        stateMutability: 'nonpayable',
      }] as const,
      functionName: 'execute',
      args: [constants.Controller, 0n, registerCallData],
    })

    // Get nonce
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

    // Get gas price
    const gasPrice = await publicClient.getGasPrice()

    // Build UserOp (without signature)
    const userOp = {
      sender,
      nonce: toHex(nonce),
      initCode: '0x',
      callData: executeCallData,
      callGasLimit: toHex(500000n),
      verificationGasLimit: toHex(500000n),
      preVerificationGas: toHex(50000n),
      maxFeePerGas: toHex(gasPrice),
      maxPriorityFeePerGas: toHex(1000000n),
      paymasterAndData: '0x', // Agent fills this with Circle Paymaster
      signature: '0x', // Agent signs this
    }

    return NextResponse.json({
      success: true,
      name,
      fullName: `${name}.safu`,
      priceUSDC: priceUSDC.toString(),
      isAgentName,
      userOp,
      instructions: {
        step1: 'Get paymasterAndData from Circle Paymaster',
        step2: 'Sign the userOpHash with your wallet',
        step3: 'Submit complete UserOp to /api/register/autonomous',
      },
      circlePaymaster: constants.CirclePaymaster,
      entryPoint: constants.EntryPoint,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to build UserOp', details: error.message },
      { status: 500 }
    )
  }
}
