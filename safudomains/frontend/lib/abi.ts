export const registrarAbi = [
    {
        name: 'register',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            { name: 'name', type: 'string' },
            { name: 'owner', type: 'address' },
            { name: 'duration', type: 'uint256' },
            { name: 'secret', type: 'bytes32' },
            { name: 'resolver', type: 'address' },
            { name: 'data', type: 'bytes[]' },
            { name: 'reverseRecord', type: 'bool' },
            { name: 'ownerControlledFuses', type: 'uint16' },
            { name: 'lifetime', type: 'bool' },
            {
                name: 'referralData',
                type: 'tuple',
                components: [
                    { name: 'referrer', type: 'address' },
                    { name: 'registrant', type: 'address' },
                    { name: 'nameHash', type: 'bytes32' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'bytes32' }
                ]
            },
            { name: 'referralSignature', type: 'bytes' }
        ],
        outputs: []
    },
    {
        name: 'rentPrice',
        type: 'function',
        stateMutability: 'view',
        inputs: [
            { name: 'name', type: 'string' },
            { name: 'duration', type: 'uint256' },
            { name: 'lifetime', type: 'bool' }
        ],
        outputs: [
            {
                type: 'tuple',
                components: [
                    { name: 'base', type: 'uint256' },
                    { name: 'premium', type: 'uint256' }
                ]
            }
        ]
    },
    {
        name: 'available',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'name', type: 'string' }],
        outputs: [{ type: 'bool' }]
    },
    {
        name: 'commit',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [{ name: 'commitment', type: 'bytes32' }],
        outputs: []
    }
] as const;
