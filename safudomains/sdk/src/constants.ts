import type { Address } from 'viem'
import type { ChainConfig } from './types'

/**
 * Contract addresses by chain ID
 * These will be updated after deployment
 */
export const CHAIN_CONFIGS: Record<number, ChainConfig> = {
    // Base Mainnet
    8453: {
        chainId: 8453,
        registrar: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
        priceOracle: '0x0000000000000000000000000000000000000000' as Address,
        resolver: '0x0000000000000000000000000000000000000000' as Address,
        nameWrapper: '0x0000000000000000000000000000000000000000' as Address,
        reverseRegistrar: '0x0000000000000000000000000000000000000000' as Address,
    },
    // Base Sepolia
    84532: {
        chainId: 84532,
        registrar: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after deployment
        priceOracle: '0x0000000000000000000000000000000000000000' as Address,
        resolver: '0x0000000000000000000000000000000000000000' as Address,
        nameWrapper: '0x0000000000000000000000000000000000000000' as Address,
        reverseRegistrar: '0x0000000000000000000000000000000000000000' as Address,
    },
}

/**
 * Top-level domain for SafuDomains
 */
export const TLD = 'safu'

/**
 * Lifetime duration in seconds (100 years)
 */
export const LIFETIME_DURATION = 100n * 365n * 24n * 60n * 60n

/**
 * Default empty referral data
 */
export const EMPTY_REFERRAL_DATA = {
    referrer: '0x0000000000000000000000000000000000000000' as Address,
    registrant: '0x0000000000000000000000000000000000000000' as Address,
    nameHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
    referrerCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
    deadline: 0n,
    nonce: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
}

/**
 * Empty referral signature
 */
export const EMPTY_REFERRAL_SIGNATURE = '0x' as `0x${string}`
