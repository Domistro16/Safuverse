'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { ApolloClient, HttpLink, InMemoryCache, ApolloProvider } from '@apollo/client';
import { ReactNode, useState, useEffect } from 'react';
import NextTopLoader from 'nextjs-toploader';

const config = createConfig({
    chains: [bsc],
    transports: {
        [bsc.id]: http(),
    },
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
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id'}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#FF7000',
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                loginMethods: ['wallet', 'email', 'google', 'twitter'],
                supportedChains: [bsc],
            }}
        >
            <QueryClientProvider client={queryClient}>
                <NextTopLoader
                    color="#f59e0b"
                    height={3}
                    showSpinner={false}
                    speed={200}
                    shadow="0 0 10px #f59e0b, 0 0 5px #fbbf24"
                />
                <WagmiProvider config={config}>
                    <ApolloProvider client={apolloClient}>
                        {children}
                    </ApolloProvider>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}
