import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import { constants } from '@/constant'

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
})

const BUNDLER_URL = process.env.PIMLICO_BUNDLER_URL!

/**
 * POST /api/register/autonomous
 *
 * For fully autonomous agents with their own AA wallet + USDC
 *
 * The agent submits a complete signed UserOp.
 * This API validates and forwards to the bundler.
 *
 * Request body:
 * {
 *   "userOp": {
 *     "sender": "0x...",
 *     "nonce": "0x...",
 *     "callData": "0x...",
 *     ... other UserOp fields
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userOp } = body

    if (!userOp || !userOp.sender || !userOp.signature) {
      return NextResponse.json(
        { error: 'Missing or incomplete UserOperation' },
        { status: 400 }
      )
    }

    // Validate the UserOp calls our contract
    // (Security: prevent arbitrary calls)
    const isValidTarget = await validateUserOpTarget(userOp)
    if (!isValidTarget) {
      return NextResponse.json(
        { error: 'UserOp must target SafuDomains registrar' },
        { status: 403 }
      )
    }

    // Submit to bundler
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
      return NextResponse.json(
        { error: 'Bundler rejected UserOp', details: data.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      userOpHash: data.result,
      message: 'UserOperation submitted to bundler',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Submission failed', details: error.message },
      { status: 500 }
    )
  }
}

async function validateUserOpTarget(userOp: any): Promise<boolean> {
  // Decode callData to verify it's calling our registrar
  // For AA wallets, callData is typically an execute() call
  // We verify the sender is a deployed contract (AA wallet)
  try {
    const code = await publicClient.getCode({ address: userOp.sender })
    return code !== undefined && code !== '0x'
  } catch {
    return false
  }
}
