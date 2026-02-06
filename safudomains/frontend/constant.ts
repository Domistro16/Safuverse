// SafuDomains v2 Constants - Base Chain
// Contract addresses (placeholders - update after deployment)

export interface ContractAddresses {
  Controller: `0x${string}`
  PriceOracle: `0x${string}`
  Registry: `0x${string}`
  ReverseRegistrar: `0x${string}`
  BaseRegistrar: `0x${string}`
  NameWrapper: `0x${string}`
  PublicResolver: `0x${string}`
  Referral: `0x${string}`
  PremiumRegistry: `0x${string}`
  Auction: `0x${string}`
  USDC: `0x${string}`
  BulkRenewal: `0x${string}`
  Course: `0x${string}`
}

export const CONSTANTS_MAINNET: ContractAddresses = {
  // AgentRegistrarController - main registration entry point
  Controller: '0x0000000000000000000000000000000000000000',

  // AgentPriceOracle - pricing with agent name detection
  PriceOracle: '0x0000000000000000000000000000000000000000',

  // ENS Registry
  Registry: '0x0000000000000000000000000000000000000000',

  // Reverse Registrar
  ReverseRegistrar: '0x0000000000000000000000000000000000000000',

  // Base Registrar
  BaseRegistrar: '0x0000000000000000000000000000000000000000',

  // Name Wrapper
  NameWrapper: '0x0000000000000000000000000000000000000000',

  // AgentPublicResolver - with x402/ERC-8004 support
  PublicResolver: '0x0000000000000000000000000000000000000000',

  // Referral Verifier
  Referral: '0x0000000000000000000000000000000000000000',

  // v2 Premium Auctions
  // PremiumNameRegistry - tracks premium/reserved names
  PremiumRegistry: '0x0000000000000000000000000000000000000000',

  // SafuDomainAuction - English auction system for premium names
  Auction: '0x0000000000000000000000000000000000000000',

  // USDC on Base
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',

  // Backward compatibility - BulkRenewal (not used in v2 but referenced)
  BulkRenewal: '0x0000000000000000000000000000000000000000',

  // Backward compatibility - Course contract
  Course: '0x0000000000000000000000000000000000000000',
}

export const CONSTANTS_TESTNET: ContractAddresses = {
  // Base Sepolia Addresses (Placeholders - update with real testnet deployments)
  Controller: '0x0000000000000000000000000000000000000000',
  PriceOracle: '0x0000000000000000000000000000000000000000',
  Registry: '0x0000000000000000000000000000000000000000',
  ReverseRegistrar: '0x0000000000000000000000000000000000000000',
  BaseRegistrar: '0x0000000000000000000000000000000000000000',
  NameWrapper: '0x0000000000000000000000000000000000000000',
  PublicResolver: '0x0000000000000000000000000000000000000000',
  Referral: '0x0000000000000000000000000000000000000000',
  PremiumRegistry: '0x0000000000000000000000000000000000000000',
  Auction: '0x0000000000000000000000000000000000000000',
  // USDC on Base Sepolia
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  BulkRenewal: '0x0000000000000000000000000000000000000000',
  Course: '0x0000000000000000000000000000000000000000',
}

export const ADDRESSES: Record<number, ContractAddresses> = {
  8453: CONSTANTS_MAINNET,
  84532: CONSTANTS_TESTNET,
}

// Default to Mainnet for backward compatibility
export const constants = CONSTANTS_MAINNET

// Chain Configuration
export const CHAIN_ID = 8453 // Default / Fallback
export const TESTNET_CHAIN_ID = 84532

export const getConstants = (chainId?: number): ContractAddresses => {
  return ADDRESSES[chainId || CHAIN_ID] || CONSTANTS_MAINNET
}

// Top-level domain
export const TLD = 'safu'

// Registration is always lifetime in v2
export interface RegisterParams {
  /** The name to register (without TLD) */
  name: string

  /** Owner address */
  owner: `0x${string}`

  /** Resolver contract address */
  resolver: `0x${string}`

  /** Array of ABI-encoded data blobs for text records */
  data: `0x${string}`[]

  /** Whether to set up a reverse record */
  reverseRecord: boolean

  /** Owner-controlled fuses bitmap */
  ownerControlledFuses: number
}
