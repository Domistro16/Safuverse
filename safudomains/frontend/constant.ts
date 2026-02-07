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
  // V2 Account Abstraction
  AccountFactory: `0x${string}`
  EntryPoint: `0x${string}`
  CirclePaymaster: `0x${string}`
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

  // V2 Account Abstraction
  AccountFactory: '0x0000000000000000000000000000000000000000',
  EntryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  CirclePaymaster: '0x0000000000000000000000000000000000000000',
}

export const CONSTANTS_TESTNET: ContractAddresses = {
  // Base Sepolia Addresses (from deployments/baseSepolia)
  Controller: '0xC4562C6F436a9aCcb739dc972aF8745e74b97462', // AgentRegistrarController
  PriceOracle: '0x1137b3608a547C1d52bD2fb30644b561Bf374cd6', // AgentPriceOracle
  Registry: '0x60b5c974D939C56A0b02EAaC197F57e0B3cf937b', // ENSRegistry
  ReverseRegistrar: '0x6516d242117CE3Be817aeBF39e7e3A044F62D81C',
  BaseRegistrar: '0xA0F3fF5eA4aA93e9C6247A7A09AFde9d0B7353C2', // BaseRegistrarImplementation
  NameWrapper: '0x1300B1efc8E6D265B2482545379c86815Bc6f0A1',
  PublicResolver: '0x2d35a4158b7f4c2AcAb1B6e200839f6f4b999107', // AgentPublicResolver
  Referral: '0x28bC9c78C16d245B0ccbE91C6Fee1E9b70957049', // ReferralVerifier
  PremiumRegistry: '0x7AFc4332ECd5F15fDF7c6Cd6BD7b6E4F316C10a0', // PremiumNameRegistry
  Auction: '0x865e0eF8518cC426DF63129Cf9BC3fe575F79454', // SafuDomainAuction
  // USDC on Base Sepolia
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  BulkRenewal: '0x3F9225F77611F32903b92AAA0CF3127e728a3B0C', // StaticBulkRenewal
  Course: '0x0000000000000000000000000000000000000000',

  // V2 Account Abstraction
  AccountFactory: '0x824a384F5638681D6b2c01621E931BA130DFf5A4', // AgentAccountFactory
  EntryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  CirclePaymaster: '0x0000000000000000000000000000000000000000', // TODO: Configure
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
