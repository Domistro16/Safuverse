// Chain-specific contract addresses for SafuDomains resolution
interface ChainConstants {
    ReverseRegistrar: `0x${string}`;
    Registry: `0x${string}`;
}

const BASE_MAINNET: ChainConstants = {
    ReverseRegistrar: '0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125',
    Registry: '0xa886B8897814193f99A88701d70b31b4a8E27a1E',
};

export function getConstants(chainId: number): ChainConstants {
    // Default to Base mainnet addresses for any chain
    return BASE_MAINNET;
}
