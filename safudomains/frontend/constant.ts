// SafuDomains v2 Constants - Base Chain
// Contract addresses (placeholders - update after deployment)

export const constants = {
  // AgentRegistrarController - main registration entry point
  Controller: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // AgentPriceOracle - pricing with agent name detection
  PriceOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // ENS Registry
  Registry: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Reverse Registrar
  ReverseRegistrar: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Base Registrar
  BaseRegistrar: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Name Wrapper
  NameWrapper: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // AgentPublicResolver - with x402/ERC-8004 support
  PublicResolver: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Referral Verifier
  Referral: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Backward compatibility - BulkRenewal (not used in v2 but referenced)
  BulkRenewal: '0x0000000000000000000000000000000000000000' as `0x${string}`,

  // Backward compatibility - Course contract
  Course: '0x0000000000000000000000000000000000000000' as `0x${string}`,
}

// Chain Configuration
export const CHAIN_ID = 8453 // Base Mainnet (use 84532 for Base Sepolia)

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
