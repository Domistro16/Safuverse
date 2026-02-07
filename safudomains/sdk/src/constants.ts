import type { Address } from 'viem'
import type { ChainConfig } from './types'

/**
 * Contract addresses by chain ID
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
        registry: '0x0000000000000000000000000000000000000000' as Address,
        baseRegistrar: '0x0000000000000000000000000000000000000000' as Address,
        referralVerifier: '0x0000000000000000000000000000000000000000' as Address,
        premiumRegistry: '0x0000000000000000000000000000000000000000' as Address,
        auction: '0x0000000000000000000000000000000000000000' as Address,
        bulkRenewal: '0x0000000000000000000000000000000000000000' as Address,
        accountFactory: '0x0000000000000000000000000000000000000000' as Address,
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address,
    },
    // Base Sepolia
    84532: {
        chainId: 84532,
        registrar: '0xC4562C6F436a9aCcb739dc972aF8745e74b97462' as Address, // AgentRegistrarController
        priceOracle: '0x1137b3608a547C1d52bD2fb30644b561Bf374cd6' as Address, // AgentPriceOracle
        resolver: '0x2d35a4158b7f4c2AcAb1B6e200839f6f4b999107' as Address, // AgentPublicResolver
        nameWrapper: '0x1300B1efc8E6D265B2482545379c86815Bc6f0A1' as Address,
        reverseRegistrar: '0x6516d242117CE3Be817aeBF39e7e3A044F62D81C' as Address,
        registry: '0x60b5c974D939C56A0b02EAaC197F57e0B3cf937b' as Address,
        baseRegistrar: '0xA0F3fF5eA4aA93e9C6247A7A09AFde9d0B7353C2' as Address,
        referralVerifier: '0x28bC9c78C16d245B0ccbE91C6Fee1E9b70957049' as Address,
        premiumRegistry: '0x7AFc4332ECd5F15fDF7c6Cd6BD7b6E4F316C10a0' as Address,
        auction: '0x865e0eF8518cC426DF63129Cf9BC3fe575F79454' as Address,
        bulkRenewal: '0x3F9225F77611F32903b92AAA0CF3127e728a3B0C' as Address,
        accountFactory: '0x824a384F5638681D6b2c01621E931BA130DFf5A4' as Address, // AgentAccountFactory
        usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address,
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
