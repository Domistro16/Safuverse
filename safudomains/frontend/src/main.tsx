import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import {
  connectorsForWallets,
  darkTheme,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'
import type { ApolloClient } from '@apollo/client'
import {
  rainbowWallet,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
  binanceWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http } from 'wagmi'

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
  },
)
// Initialize Apollo Client

const ApolloProvider = React.lazy(() =>
  import('@apollo/client').then((mod) => ({
    default: mod.ApolloProvider,
  })),
)

const WagmiProvider = React.lazy(() =>
  import('wagmi').then((mod) => ({
    default: mod.WagmiProvider,
  })),
)

async function createApolloClient() {
  const { ApolloClient, HttpLink, InMemoryCache } = await import(
    '@apollo/client'
  )

  return new ApolloClient({
    link: new HttpLink({
      uri: 'https://api.studio.thegraph.com/query/112443/safunames/version/latest',
    }),
    cache: new InMemoryCache(),
  })
}
function BootStrap() {
  const queryClient = new QueryClient()

  const config = createConfig({
    connectors,
    transports: {
      [bsc.id]: http(),
    },
    chains: [bsc],
  })
  const [client, setClient] = useState<ApolloClient<any> | null>(null)

  useEffect(() => {
    createApolloClient().then(setClient)
  }, [])

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config as any}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#FF7000',
              accentColorForeground: 'white',
              borderRadius: 'large',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
          >
            <BrowserRouter>
              {client && (
                <ApolloProvider client={client}>
                  <App />
                </ApolloProvider>
              )}
            </BrowserRouter>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BootStrap />
  </React.StrictMode>,
)
