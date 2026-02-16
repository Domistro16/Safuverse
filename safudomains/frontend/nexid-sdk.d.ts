declare module '@nexid/sdk' {
  export class NexDomains {
    constructor(config: { chainId: number; walletClient?: any })
    publicClient: any
    available(name: string): Promise<boolean>
    getPrice(name: string): Promise<{
      priceWei: bigint
      priceUsd: bigint
      isAgentName: boolean
    }>
    getX402Endpoint(name: string): Promise<string>
    isPaymentEnabled(name: string): Promise<boolean>
    setX402Endpoint(name: string, endpoint: string): Promise<void>
    setPaymentEnabled(name: string, enabled: boolean): Promise<void>
    getPaymentProfile(
      name: string,
      chainId: number,
    ): Promise<{
      paymentAddress: `0x${string}`
      supportedChains: number[]
      acceptedTokens: `0x${string}`[]
      agentMetadata: string
      paymentEnabled: boolean
      paymentLimits: {
        minAmount: bigint
        maxAmount: bigint
      }
      x402Endpoint: string
    }>
  }

  export const AgentRegistrarControllerAbi: readonly Record<string, unknown>[]
  export const AgentPriceOracleAbi: readonly Record<string, unknown>[]
  export const AgentPublicResolverAbi: readonly Record<string, unknown>[]
  export const NameWrapperAbi: readonly Record<string, unknown>[]
}
