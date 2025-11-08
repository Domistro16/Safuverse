import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import "@rainbow-me/rainbowkit/styles.css";
import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
  type Theme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { bsc } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import merge from "lodash.merge";
const config = getDefaultConfig({
  appName: "Level3GPTs",
  projectId: "YOUR_PROJECT_ID",
  chains: [bsc],
});

const myTheme = merge(darkTheme(), {
  colors: {
    connectButtonBackground: "#FFB000",
    connectButtonText: "#000000",
  },
  radii: {
    connectButton: "9999px",
  },
} as Theme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={new QueryClient()}>
        <RainbowKitProvider modalSize="compact" theme={myTheme}>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
