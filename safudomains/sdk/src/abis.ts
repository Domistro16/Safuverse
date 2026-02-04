// ============ AgentPriceOracle ABI ============
export const AgentPriceOracleAbi = [
    {
        inputs: [{ name: 'name', type: 'string' }],
        name: 'getPrice',
        outputs: [
            {
                components: [
                    { name: 'priceWei', type: 'uint256' },
                    { name: 'priceUsd', type: 'uint256' },
                    { name: 'isAgentName', type: 'bool' },
                ],
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'name', type: 'string' }],
        name: 'isAgentName',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'name', type: 'string' }],
        name: 'getPatternMatchCount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'pure',
        type: 'function',
    },
] as const

// ============ AgentRegistrarController ABI ============
export const AgentRegistrarControllerAbi = [
    {
        inputs: [{ name: 'name', type: 'string' }],
        name: 'available',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'name', type: 'string' }],
        name: 'rentPrice',
        outputs: [
            { name: 'priceWei', type: 'uint256' },
            { name: 'priceUsd', type: 'uint256' },
            { name: 'isAgentName', type: 'bool' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    { name: 'name', type: 'string' },
                    { name: 'owner', type: 'address' },
                    { name: 'secret', type: 'bytes32' },
                    { name: 'resolver', type: 'address' },
                    { name: 'data', type: 'bytes[]' },
                    { name: 'reverseRecord', type: 'bool' },
                    { name: 'ownerControlledFuses', type: 'uint16' },
                ],
                name: 'req',
                type: 'tuple',
            },
            {
                components: [
                    { name: 'referrer', type: 'address' },
                    { name: 'registrant', type: 'address' },
                    { name: 'nameHash', type: 'bytes32' },
                    { name: 'referrerCodeHash', type: 'bytes32' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'bytes32' },
                ],
                name: 'referralData',
                type: 'tuple',
            },
            { name: 'referralSignature', type: 'bytes' },
        ],
        name: 'register',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            {
                components: [
                    { name: 'name', type: 'string' },
                    { name: 'owner', type: 'address' },
                    { name: 'secret', type: 'bytes32' },
                    { name: 'resolver', type: 'address' },
                    { name: 'data', type: 'bytes[]' },
                    { name: 'reverseRecord', type: 'bool' },
                    { name: 'ownerControlledFuses', type: 'uint16' },
                ],
                name: 'requests',
                type: 'tuple[]',
            },
        ],
        name: 'batchRegister',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ name: 'commitment', type: 'bytes32' }],
        name: 'commit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { name: 'name', type: 'string' },
            { name: 'owner', type: 'address' },
            { name: 'secret', type: 'bytes32' },
            { name: 'resolver', type: 'address' },
            { name: 'data', type: 'bytes[]' },
            { name: 'reverseRecord', type: 'bool' },
            { name: 'ownerControlledFuses', type: 'uint16' },
        ],
        name: 'makeCommitment',
        outputs: [{ name: '', type: 'bytes32' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [{ name: 'commitment', type: 'bytes32' }],
        name: 'commitments',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// ============ AgentPublicResolver ABI (x402 / ERC-8004) ============
export const AgentPublicResolverAbi = [
    // x402 Protocol
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'x402Endpoint',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'endpoint', type: 'string' },
        ],
        name: 'setX402Endpoint',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // ERC-8004 Payment Address
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
        ],
        name: 'paymentAddress',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
            { name: 'addr', type: 'address' },
        ],
        name: 'setPaymentAddress',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Supported Chains
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'supportedChains',
        outputs: [{ name: '', type: 'uint256[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainIds', type: 'uint256[]' },
        ],
        name: 'setSupportedChains',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Accepted Tokens
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
        ],
        name: 'acceptedTokens',
        outputs: [{ name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
            { name: 'tokens', type: 'address[]' },
        ],
        name: 'setAcceptedTokens',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Agent Metadata
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'agentMetadata',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'uri', type: 'string' },
        ],
        name: 'setAgentMetadata',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Payment Enabled
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'paymentEnabled',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'enabled', type: 'bool' },
        ],
        name: 'setPaymentEnabled',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Payment Limits
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
        ],
        name: 'paymentLimits',
        outputs: [
            { name: 'minAmount', type: 'uint256' },
            { name: 'maxAmount', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'chainId', type: 'uint256' },
            { name: 'minAmount', type: 'uint256' },
            { name: 'maxAmount', type: 'uint256' },
        ],
        name: 'setPaymentLimits',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    // Standard ENS resolver functions
    {
        inputs: [
            { name: 'node', type: 'bytes32' },
            { name: 'coinType', type: 'uint256' },
        ],
        name: 'addr',
        outputs: [{ name: '', type: 'bytes' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'node', type: 'bytes32' }],
        name: 'text',
        outputs: [{ name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

// ============ NameWrapper ABI ============
export const NameWrapperAbi = [
    {
        inputs: [{ name: 'id', type: 'uint256' }],
        name: 'ownerOf',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const
