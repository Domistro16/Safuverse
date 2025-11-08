import { BigNumberish } from 'ethers'

export const constants = {
  Controller: '0x48511b6c15fe1F89bAf6b30dBFA35bF0eAaEB751' as `0x${string}`,
  Registry: '0x6aEFc7ac590096c08187a9052030dA59dEd7E996' as `0x${string}`,
  ReverseRegistrar:
    '0xc070aAcE207ad5eb2A460D059785ffC9D4D2C536' as `0x${string}`,
  BaseRegistrar: '0xc85f95FCe09b582D546606f591CEEC88D88714f5' as `0x${string}`,
  NameWrapper: '0x86a930d1931C11e3Ec46b3A050E27F29bF94B612' as `0x${string}`,
  BulkRenewal: '0x32f3f7D65282d8941FE12b00b63a708e9333fC06' as `0x${string}`,
  PublicResolver: '0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357' as `0x${string}`,
  Referral: '0x182690bD985ef02Ae44A6F8a2e71666bDe1196E2' as `0x${string}`,
  Course: '0x2967A3EDA537630Fb4eb144Fa02f5081457506BE' as `0x${string}`,
}

export interface Params {
  /** The name to register */
  name: string

  /** Owner address (20-byte hex) */
  owner: `0x${string}`

  /** Registration duration in seconds (uint256) */
  duration: BigNumberish

  /** Secret commitment (32-byte hex) */
  secret: string

  /** Resolver contract address */
  resolver: string

  /** Array of ABI-encoded data blobs */
  data: string[]

  /** Whether to set up a reverse record */
  reverseRecord: boolean

  /** Owner-controlled fuses bitmap (fits in uint16) */
  ownerControlledFuses: number
}

export interface TokenParams {
  /** Token symbol or identifier */
  token: string

  /** Token contract address */
  tokenAddress: string
}
