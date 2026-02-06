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
        registrar: '0x8329F9d40647C460714Ab216136ABFa0F6229167' as Address, // AgentRegistrarController
        priceOracle: '0x873e1dA6B21dFfe3bb584CC96F33f23BF622Af85' as Address, // AgentPriceOracle
        resolver: '0x523a40261D90A2f81c70cFddEA507C744F0544E0' as Address, // AgentPublicResolver
        nameWrapper: '0x3c761Aab45d876abfD643d5DA60b7930DAc28eA1' as Address,
        reverseRegistrar: '0xE0E1970F3b7a71fa9df52A464F933AcC54d8742c' as Address,
    }
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
