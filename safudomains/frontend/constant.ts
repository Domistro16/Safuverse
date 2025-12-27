import { BigNumberish } from 'ethers'

export const constants = {
  Controller: '0xC902396A4E49914d1266cc80e22Aa182dcF23138' as `0x${string}`,
  Registry: '0xa886B8897814193f99A88701d70b31b4a8E27a1E' as `0x${string}`,
  ReverseRegistrar:
    '0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125' as `0x${string}`,
  BaseRegistrar: '0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c' as `0x${string}`,
  NameWrapper: '0xbf4B53F867dfE5A78Cf268AfBfC1f334044e61ae' as `0x${string}`,
  BulkRenewal: '0x2156C655d4668E7DB7584CA9B2a8Bc18A9125254' as `0x${string}`,
  PublicResolver: '0x50143d9f7e496fF58049dE0db6FaDfB43FfE18e7' as `0x${string}`,
  Referral: '0x92149696fDDC858A76253F71268D34147e662410' as `0x${string}`,
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

  /** Whether this is a lifetime registration */
  lifetime: boolean
}

export interface TokenParams {
  /** Token symbol or identifier */
  token: string

  /** Token contract address */
  tokenAddress: string
}
