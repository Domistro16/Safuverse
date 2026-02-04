import type { Address, Hash, Hex } from 'viem'

// ============ Chain Configuration ============

export interface ChainConfig {
    chainId: number
    registrar: Address
    priceOracle: Address
    resolver: Address
    nameWrapper: Address
    reverseRegistrar: Address
}

// ============ Pricing Types ============

export interface PriceResult {
    /** Price in wei (for ETH payment) */
    priceWei: bigint
    /** Price in USD (18 decimals) */
    priceUsd: bigint
    /** Whether the name qualifies as an agent name */
    isAgentName: boolean
}

// ============ Registration Types ============

export interface RegisterRequest {
    /** Name to register (without .safu suffix) */
    name: string
    /** Owner address for the registered name */
    owner: Address
    /** Secret for commit-reveal (zeroHash for agent names) */
    secret: Hash
    /** Resolver address to set */
    resolver: Address
    /** Resolver data to set during registration */
    data: Hex[]
    /** Whether to set reverse record */
    reverseRecord: boolean
    /** Fuses to set on the wrapped name */
    ownerControlledFuses: number
}

export interface RegisterOptions {
    /** Resolver address (defaults to AgentPublicResolver) */
    resolver?: Address
    /** Extra data to set on resolver */
    data?: Hex[]
    /** Set reverse record */
    reverseRecord?: boolean
    /** Owner controlled fuses */
    ownerControlledFuses?: number
    /** Referral data */
    referral?: ReferralData
}

export interface ReferralData {
    referrer: Address
    registrant: Address
    nameHash: Hash
    referrerCodeHash: Hash
    deadline: bigint
    nonce: Hash
}

// ============ x402 / ERC-8004 Types ============

export interface PaymentConfig {
    /** x402 payment endpoint URL */
    x402Endpoint?: string
    /** Payment address for the primary chain */
    paymentAddress?: Address
    /** Supported chain IDs */
    supportedChains?: number[]
    /** Agent metadata URI (IPFS or HTTPS) */
    agentMetadataURI?: string
    /** Whether payments are enabled */
    enabled?: boolean
}

export interface PaymentLimits {
    minAmount: bigint
    maxAmount: bigint
}

export interface FullPaymentProfile {
    x402Endpoint: string
    paymentAddress: Address
    supportedChains: number[]
    acceptedTokens: Address[]
    agentMetadata: string
    paymentEnabled: boolean
    paymentLimits: PaymentLimits
}

// ============ SDK Configuration ============

export interface SafuDomainsConfig {
    /** Chain ID (8453 for Base, 84532 for Base Sepolia) */
    chainId: number
    /** Wallet client for write operations (optional) */
    walletClient?: any
    /** Public client for read operations (optional, created automatically) */
    publicClient?: any
    /** Custom contract addresses (optional) */
    contracts?: Partial<ChainConfig>
}
