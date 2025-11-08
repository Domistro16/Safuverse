# SafuAgents - AI-Powered Web3 Interface

AI agents interface with Web3 wallet integration, **deployed on BNB Chain** (BNB Smart Chain - BSC). Connect your wallet, interact with AI agents, and leverage blockchain functionality in a seamless user experience.

## Deployment Information

**Primary Network**: BNB Smart Chain (BSC)

- Wagmi configuration: Explicitly set to BSC mainnet (chain ID: 56)
- See configuration: `src/main.tsx:13,19`

This frontend application is specifically configured to interact with smart contracts and services deployed on BNB Chain through the wagmi library and RainbowKit wallet connector.

## Features

- **AI Agent Integration**: OpenAI-powered conversational agents
- **BNB Chain Wallet Connection**: RainbowKit integration configured for BSC
- **Multi-Chain Support**: Primary support for BNB Chain, with Solana wallet adapters for cross-chain features
- **Modern UI**: React 19 with TypeScript and Vite build system
- **Web3 Ready**: Full wagmi/viem integration for BNB Chain interactions

## Technology Stack

### Frontend

- **Framework**: React 19.1.1
- **Language**: TypeScript 5.9
- **Build Tool**: Vite (Rolldown)
- **Styling**: CSS with Lucide icons

### Web3 Integration (BNB Chain)

- **Wallet Connection**: RainbowKit 2.2.9
- **Blockchain Interaction**: wagmi 2.19.2, viem 2.38.6
- **Network**: BNB Smart Chain (BSC) - explicitly configured in `src/main.tsx`
- **Query**: TanStack React Query 5.90.6

### AI Integration

- **AI SDK**: OpenAI 6.7.0
- **HTTP Client**: Axios 1.13.1

### Additional Chain Support

- **Solana**: Wallet adapters and SPL token support for multi-chain features

## BNB Chain Configuration

The application is explicitly configured to connect to BNB Chain:

```typescript
// src/main.tsx
import { bsc } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "Level3GPTs",
  projectId: "YOUR_PROJECT_ID",
  chains: [bsc], // BSC Mainnet (Chain ID: 56)
});
```

This configuration ensures all Web3 interactions occur on BNB Chain, providing users with:

- Low transaction costs
- Fast confirmation times
- Access to BSC ecosystem (PancakeSwap, CAKE, etc.)
- Integration with other Safuverse components on BNB Chain

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- BNB Chain wallet (MetaMask, Trust Wallet, etc.)
- BSC mainnet BNB for transactions

### Installation

```bash
npm install
# or
bun install
```

### Environment Setup

1. Create a `.env` file in the root directory
2. Add your configuration:

```bash
# WalletConnect Project ID (for RainbowKit)
VITE_PROJECT_ID=your_walletconnect_project_id

# Optional: OpenAI API Key (if using AI features)
VITE_OPENAI_API_KEY=your_openai_api_key
```

Update `src/main.tsx` line 18 with your WalletConnect Project ID:

```typescript
projectId: "YOUR_PROJECT_ID", // Replace with your actual project ID
```

Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/)

### Development

Run the development server:

```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
bun run build
```

### Preview Production Build

```bash
npm run preview
# or
bun preview
```

## Project Structure

```
SafuAgents/
├── src/
│   ├── main.tsx              # Entry point with BNB Chain wagmi config
│   ├── App.tsx               # Main application component
│   ├── ChatInterface.tsx     # AI chat interface
│   ├── index.css             # Global styles
│   └── ...                   # Additional components
├── public/                   # Static assets
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite build configuration
```

## Key Components

### Wallet Integration

The app uses RainbowKit for wallet connection, configured specifically for BNB Chain:

- Supports MetaMask, Trust Wallet, and other WalletConnect-compatible wallets
- Custom theme with branded colors
- Compact modal size for better UX
- BSC network selection enforced

### AI Agents

- OpenAI-powered conversational interface
- Integration with Web3 wallet state
- Context-aware responses based on blockchain data

### Multi-Chain Features

While primarily deployed for BNB Chain:

- Solana wallet adapters available for cross-chain token operations
- SPL token support for multi-chain asset management

## Usage

1. **Connect Wallet**: Click the connect button and select your BSC-compatible wallet
2. **Ensure BSC Network**: The app is configured for BNB Smart Chain - make sure your wallet is on BSC
3. **Interact with Agents**: Use the chat interface to interact with AI agents
4. **Web3 Operations**: Perform blockchain operations on BNB Chain through the interface

## Network Information

### BNB Smart Chain (BSC) Mainnet

- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **Native Token**: BNB
- **Configured in**: `src/main.tsx:13,19`

## Integration with Safuverse Ecosystem

SafuAgents is part of the larger Safuverse ecosystem on BNB Chain:

- **SafuCourse**: Educational platform integration
- **safudomains**: Domain name resolution
- **safupad**: Token launch platform interaction
- **Safucard**: NFT scorecard display

All ecosystem components are deployed on BNB Chain for seamless interoperability.

## Development Notes

### ESLint Configuration

The project uses modern ESLint 9 with TypeScript support. To enable type-aware linting:

```js
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
```

### React Compiler

React Compiler is not enabled by default. See [React Compiler documentation](https://react.dev/learn/react-compiler/installation) to add it.

## Security Considerations

- Never commit private keys or sensitive credentials
- Use environment variables for API keys
- Always verify you're connected to BSC mainnet before transactions
- Be cautious with transaction approvals

## Support

For issues specific to SafuAgents, please check:

- [RainbowKit Documentation](https://rainbowkit.com)
- [wagmi Documentation](https://wagmi.sh)
- [BNB Chain Documentation](https://docs.bnbchain.org)

## License

See the main Safuverse repository for license information.

---

**Powered by BNB Chain and .safu** - Leveraging BSC's speed and efficiency for AI-enhanced Web3 experiences.
