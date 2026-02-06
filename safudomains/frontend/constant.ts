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
  // Base Sepolia Addresses
  Controller: '0x8329F9d40647C460714Ab216136ABFa0F6229167', // AgentRegistrarController
  PriceOracle: '0x873e1dA6B21dFfe3bb584CC96F33f23BF622Af85', // AgentPriceOracle
  Registry: '0x4DA7b74079f26B91B4b89bE8e3f7001b705Fea04', // ENSRegistry
  ReverseRegistrar: '0xE0E1970F3b7a71fa9df52A464F933AcC54d8742c',
  BaseRegistrar: '0x6432e8743D8d3930AFda27c3d0220CDD6f881ddd', // BaseRegistrarImplementation
  NameWrapper: '0x3c761Aab45d876abfD643d5DA60b7930DAc28eA1',
  PublicResolver: '0x523a40261D90A2f81c70cFddEA507C744F0544E0', // AgentPublicResolver
  Referral: '0xf799417734fB6B02AC37FbeD019A72266F37E6a8', // ReferralVerifier
  PremiumRegistry: '0x51D743dC9040621066004B41568F99Dc1C61f292', // PremiumNameRegistry
  Auction: '0x70ed4CdeA920f67fF4C3f2f0628A7dDA4957c026', // SafuDomainAuction
  // USDC on Base Sepolia
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  BulkRenewal: '0x0000000000000000000000000000000000000000', // TODO: Deploy if needed
  Course: '0x0000000000000000000000000000000000000000',
}

export const ADDRESSES: Record<number, ContractAddresses> = {
  8453: CONSTANTS_MAINNET,
  84532: CONSTANTS_TESTNET,
}

// Default to Mainnet for backward compatibility
// Default to Testnet for development
export const constants = CONSTANTS_TESTNET

// Chain Configuration
export const CHAIN_ID = 84532 // Default / Fallback
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
