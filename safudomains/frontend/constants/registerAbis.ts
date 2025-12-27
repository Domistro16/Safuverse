export const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

// RegisterRequest struct definition for TypeScript
export interface RegisterRequest {
  name: string
  owner: `0x${string}`
  duration: bigint
  secret: `0x${string}`
  resolver: `0x${string}`
  data: `0x${string}`[]
  reverseRecord: boolean
  ownerControlledFuses: number
  lifetime: boolean
}

// ReferralData struct definition for TypeScript
export interface ReferralData {
  referrer: `0x${string}`
  registrant: `0x${string}`
  nameHash: `0x${string}`
  referrerCodeHash: `0x${string}`
  deadline: bigint
  nonce: `0x${string}`
}

// Empty referral data for when no referral is used
export const EMPTY_REFERRAL_DATA: ReferralData = {
  referrer: '0x0000000000000000000000000000000000000000',
  registrant: '0x0000000000000000000000000000000000000000',
  nameHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  referrerCodeHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
  deadline: 0n,
  nonce: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

export const EMPTY_REFERRAL_SIGNATURE = '0x' as `0x${string}`

export const Controller = [
  // commit function
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'commitment',
        type: 'bytes32',
      },
    ],
    name: 'commit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // makeCommitment function - takes RegisterRequest struct
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint256', name: 'duration', type: 'uint256' },
          { internalType: 'bytes32', name: 'secret', type: 'bytes32' },
          { internalType: 'address', name: 'resolver', type: 'address' },
          { internalType: 'bytes[]', name: 'data', type: 'bytes[]' },
          { internalType: 'bool', name: 'reverseRecord', type: 'bool' },
          { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
          { internalType: 'bool', name: 'lifetime', type: 'bool' },
        ],
        internalType: 'struct IETHRegistrarController.RegisterRequest',
        name: 'req',
        type: 'tuple',
      },
    ],
    name: 'makeCommitment',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  // register function - takes RegisterRequest struct, ReferralData struct, and signature
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint256', name: 'duration', type: 'uint256' },
          { internalType: 'bytes32', name: 'secret', type: 'bytes32' },
          { internalType: 'address', name: 'resolver', type: 'address' },
          { internalType: 'bytes[]', name: 'data', type: 'bytes[]' },
          { internalType: 'bool', name: 'reverseRecord', type: 'bool' },
          { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
          { internalType: 'bool', name: 'lifetime', type: 'bool' },
        ],
        internalType: 'struct IETHRegistrarController.RegisterRequest',
        name: 'req',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'address', name: 'referrer', type: 'address' },
          { internalType: 'address', name: 'registrant', type: 'address' },
          { internalType: 'bytes32', name: 'nameHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'referrerCodeHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'bytes32', name: 'nonce', type: 'bytes32' },
        ],
        internalType: 'struct ReferralVerifier.ReferralData',
        name: 'referralData',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'referralSignature',
        type: 'bytes',
      },
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // registerWithCard function
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint256', name: 'duration', type: 'uint256' },
          { internalType: 'bytes32', name: 'secret', type: 'bytes32' },
          { internalType: 'address', name: 'resolver', type: 'address' },
          { internalType: 'bytes[]', name: 'data', type: 'bytes[]' },
          { internalType: 'bool', name: 'reverseRecord', type: 'bool' },
          { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
          { internalType: 'bool', name: 'lifetime', type: 'bool' },
        ],
        internalType: 'struct IETHRegistrarController.RegisterRequest',
        name: 'req',
        type: 'tuple',
      },
      {
        components: [
          { internalType: 'address', name: 'referrer', type: 'address' },
          { internalType: 'address', name: 'registrant', type: 'address' },
          { internalType: 'bytes32', name: 'nameHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'referrerCodeHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'bytes32', name: 'nonce', type: 'bytes32' },
        ],
        internalType: 'struct ReferralVerifier.ReferralData',
        name: 'referralData',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'referralSignature',
        type: 'bytes',
      },
    ],
    name: 'registerWithCard',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // registerWithToken function
  {
    inputs: [
      {
        components: [
          { internalType: 'string', name: 'name', type: 'string' },
          { internalType: 'address', name: 'owner', type: 'address' },
          { internalType: 'uint256', name: 'duration', type: 'uint256' },
          { internalType: 'bytes32', name: 'secret', type: 'bytes32' },
          { internalType: 'address', name: 'resolver', type: 'address' },
          { internalType: 'bytes[]', name: 'data', type: 'bytes[]' },
          { internalType: 'bool', name: 'reverseRecord', type: 'bool' },
          { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
          { internalType: 'bool', name: 'lifetime', type: 'bool' },
        ],
        internalType: 'struct IETHRegistrarController.RegisterRequest',
        name: 'req',
        type: 'tuple',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        components: [
          { internalType: 'address', name: 'referrer', type: 'address' },
          { internalType: 'address', name: 'registrant', type: 'address' },
          { internalType: 'bytes32', name: 'nameHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'referrerCodeHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'bytes32', name: 'nonce', type: 'bytes32' },
        ],
        internalType: 'struct ReferralVerifier.ReferralData',
        name: 'referralData',
        type: 'tuple',
      },
      {
        internalType: 'bytes',
        name: 'referralSignature',
        type: 'bytes',
      },
    ],
    name: 'registerWithToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // rentPrice function
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'bool', name: 'lifetime', type: 'bool' },
    ],
    name: 'rentPrice',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'base', type: 'uint256' },
          { internalType: 'uint256', name: 'premium', type: 'uint256' },
        ],
        internalType: 'struct IPriceOracle.Price',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // rentPriceToken function
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'string', name: 'token', type: 'string' },
      { internalType: 'bool', name: 'lifetime', type: 'bool' },
    ],
    name: 'rentPriceToken',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'base', type: 'uint256' },
          { internalType: 'uint256', name: 'premium', type: 'uint256' },
        ],
        internalType: 'struct IPriceOracle.Price',
        name: 'price',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // available function
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
    ],
    name: 'available',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // renew function
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'bool', name: 'lifetime', type: 'bool' },
    ],
    name: 'renew',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // renewTokens function
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'address', name: 'tokenAddress', type: 'address' },
      { internalType: 'bool', name: 'lifetime', type: 'bool' },
    ],
    name: 'renewTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

export const PriceAbi = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      {
        internalType: 'uint80',
        name: 'roundId',
        type: 'uint80',
      },
      {
        internalType: 'int256',
        name: 'answer',
        type: 'int256',
      },
      {
        internalType: 'uint256',
        name: 'startedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'updatedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint80',
        name: 'answeredInRound',
        type: 'uint80',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

export const addrResolver = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'a',
        type: 'address',
      },
    ],
    name: 'setAddr',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]
