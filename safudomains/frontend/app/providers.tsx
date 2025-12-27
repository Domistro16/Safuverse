'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import {
    connectorsForWallets,
    darkTheme,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import {
    rainbowWallet,
    walletConnectWallet,
    metaMaskWallet,
    coinbaseWallet,
    binanceWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { ApolloClient, HttpLink, InMemoryCache, ApolloProvider } from '@apollo/client';
import { ReactNode, useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';

import '@rainbow-me/rainbowkit/styles.css';

const connectors = connectorsForWallets(
    [
        {
            groupName: 'Recommended',
            wallets: [
                rainbowWallet,
                binanceWallet,
                metaMaskWallet,
                coinbaseWallet,
                walletConnectWallet,
            ],
        },
    ],
    {
        appName: 'safuDomains',
        projectId: 'YOUR_PROJECT_ID',
    }
);

const config = createConfig({
    connectors,
    transports: {
        [bsc.id]: http(),
    },
    chains: [bsc],
});

function createApolloClient() {
    return new ApolloClient({
        link: new HttpLink({
            uri: 'https://api.studio.thegraph.com/query/112443/safunames/v0.9.2',
        }),
        cache: new InMemoryCache(),
    });
}

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [apolloClient, setApolloClient] = useState<ApolloClient<any> | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setApolloClient(createApolloClient());
    }, []);

    if (!mounted || !apolloClient) {
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <NextTopLoader
                color="#f59e0b"
                height={3}
                showSpinner={false}
                speed={200}
                shadow="0 0 10px #f59e0b, 0 0 5px #fbbf24"
            />
            <WagmiProvider config={config}>
                <RainbowKitProvider
                    theme={darkTheme({
                        accentColor: '#FF7000',
                        accentColorForeground: 'white',
                        borderRadius: 'large',
                        fontStack: 'system',
                        overlayBlur: 'small',
                    })}
                >
                    <ApolloProvider client={apolloClient}>
                        {children}
                    </ApolloProvider>
                </RainbowKitProvider>
            </WagmiProvider>
        </QueryClientProvider>
    );
}

