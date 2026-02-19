'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

interface UseENSNameOptions {
    owner?: `0x${string}`;
}

const REVERSE_REGISTRAR = '0x38171C9Dc51c5F9b2Be96b8fde3D0CA8C6050eAA' as const;
const REVERSE_REGISTRAR_ABI = [{
    inputs: [{ name: 'addr', type: 'address' }],
    name: 'getName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
}] as const;

/**
 * Hook to get the user's primary .id name from the SafuDomains ReverseRegistrar.
 */
export function useENSName(options?: UseENSNameOptions) {
    const { address, isConnected } = useAccount();
    const resolveAddress = options?.owner || address;
    const [name, setName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!resolveAddress) {
            setName(null);
            return;
        }
        setIsLoading(true);
        const client = createPublicClient({ chain: base, transport: http() });
        client.readContract({
            address: REVERSE_REGISTRAR,
            abi: REVERSE_REGISTRAR_ABI,
            functionName: 'getName',
            args: [resolveAddress],
        }).then((result) => {
            setName(result || null);
        }).catch(() => {
            setName(null);
        }).finally(() => {
            setIsLoading(false);
        });
    }, [resolveAddress]);

    return {
        name,
        loading: isLoading,
        isLoading,
        address: resolveAddress,
        isConnected,
    };
}
