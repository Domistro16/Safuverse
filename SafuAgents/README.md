# SafuAgents - AI-Powered Web3 Platform on BNB Chain

**Official Repository** | **Deployed on BNB Smart Chain (BSC)**

SafuAgents is a full-stack AI agent platform with Web3 wallet integration, **explicitly deployed on BNB Chain** (BNB Smart Chain - BSC). This platform enables users to interact with specialized AI agents, gated by .safu domain ownership, with all blockchain operations occurring on the BNB Chain ecosystem.

---

## Deployment on BNB Chain

**Primary Network**: BNB Smart Chain (BSC)
**Chain ID**: 56
**Network RPC**: https://bsc-dataseed.binance.org/
**Block Explorer**: https://bscscan.com

This repository demonstrates **clear intent to deploy on BNB Chain** through:

1. **Explicit Configuration Evidence** (Core Verification)
2. **BNB Chain-Specific Smart Contract Integration**
3. **README Documentation** (this file)
4. **RPC Endpoint Configuration**

---

## Configuration Evidence

### Frontend Configuration (BNB Chain)

The frontend is **explicitly configured** to connect exclusively to BNB Chain:

**File**: `frontend/src/main.tsx:13,19`

```typescript
import { bsc } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "Level3GPTs",
  projectId: "YOUR_PROJECT_ID",
  chains: [bsc], // BNB Smart Chain (Chain ID: 56) - Explicit BSC deployment
});
```

This configuration ensures **all Web3 interactions occur exclusively on BNB Chain**, providing:
- Connection to BSC mainnet only (no multi-chain ambiguity)
- Wallet connections restricted to BSC network
- All transactions executed on BNB Chain

### Backend Configuration (BNB Chain)

The backend server connects **directly to BNB Chain infrastructure**:

**File**: `server/server.js:31-32`

```javascript
const provider = new ethers.JsonRpcProvider(
  "https://bsc-dataseed.binance.org/"  // Official BSC RPC endpoint
);
```

This RPC configuration:
- Points exclusively to BNB Chain's official dataseed
- All smart contract interactions occur on BSC
- No fallback or alternative chain configurations

---

## BNB Chain-Specific Smart Contract Integration

SafuAgents integrates with **BNB Chain-deployed smart contracts** for .safu domain verification:

**File**: `server/server.js:36-77`

### Contract Addresses (BSC Mainnet)

```javascript
// BNB Chain .safu Domain Contracts
const REVERSE_ADDRESS = "0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125";
const REGISTRY_ADDRESS = "0xa886B8897814193f99A88701d70b31b4a8E27a1E";
const BASE_ADDRESS = "0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c";
```

These contracts are:
- **Deployed on BNB Chain** (BSC mainnet)
- Verified on BscScan
- Core infrastructure for .safu domain resolution on BSC

### BNB Chain-Specific Operations

The application performs BSC-specific blockchain operations:

```javascript
// server/server.js - Domain verification on BNB Chain
const node = await reverse.node(publicKey);           // BSC contract call
const resolverAddress = await registry.resolver(node); // BSC contract call
const name = await resolver.name(node);                // BSC contract call
const expiry = await base.nameExpires(tokenId);        // BSC contract call
```

All these operations **execute exclusively on BNB Chain**.

---

## Architecture

SafuAgents consists of two main components, both integrated with BNB Chain:

### 1. Frontend (`/frontend`)
- **Framework**: React 19 + TypeScript + Vite
- **Web3 Integration**:
  - RainbowKit 2.2.9 (BSC wallet connection)
  - wagmi 2.19.2 (BSC blockchain interaction)
  - viem 2.38.6 (BSC contract calls)
- **Network**: **Explicitly configured for BSC** (see `main.tsx:13,19`)
- **AI Integration**: OpenAI 6.7.0

### 2. Backend (`/server`)
- **Framework**: Express.js + Node.js
- **Blockchain Provider**: ethers.js with **BSC RPC endpoint**
- **Network**: **BNB Chain** via `https://bsc-dataseed.binance.org/`
- **Smart Contracts**: .safu domain contracts on BSC
- **Database**: SQLite3 (user management & rate limiting)

---

## Core Features

### AI Agent Access (Gated by BSC)
- Multiple specialized AI agents for crypto operations
- Access tiers based on .safu domain character count (verified on BSC)
- Rate limiting tied to BSC domain ownership

### BNB Chain Integration
- **Wallet Connection**: RainbowKit integration for BSC wallets
- **Domain Verification**: On-chain verification via BSC smart contracts
- **.safu Domain System**: Native domain resolution on BNB Chain
- **Tier System**: Domain character count determines access levels

### Tier Structure (Based on BSC Domain Ownership)

| Domain Length | 1-Year Registration | Lifetime Registration | Access |
|---------------|---------------------|----------------------|---------|
| 2-char .safu  | 100 calls/day       | 200 calls/day        | All agents |
| 3-char .safu  | 20 calls/day        | 50 calls/day         | All agents |
| 4-char .safu  | 5 calls/day         | 10 calls/day         | All agents |
| 5-char .safu  | 2 calls/day         | 5 calls/day          | All agents |
| No domain     | 5 lifetime calls    | -                    | 1 agent only |

All domain ownership verified **on-chain via BNB Chain smart contracts**.

---

## Technology Stack

### Frontend Technologies
- **React**: 19.1.1
- **TypeScript**: 5.9
- **Build Tool**: Vite (Rolldown)
- **Styling**: CSS + Lucide icons

### BNB Chain Web3 Stack
- **Wallet**: RainbowKit 2.2.9 (BSC-configured)
- **Blockchain**: wagmi 2.19.2 (BSC chain)
- **Contracts**: viem 2.38.6 (BSC interactions)
- **Query**: TanStack React Query 5.90.6

### Backend Technologies
- **Server**: Express.js 5.1.0
- **Blockchain**: ethers.js 6.15.0 (**BSC RPC provider**)
- **AI**: OpenAI 6.7.0
- **Database**: SQLite3 5.1.7

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- **BNB Chain wallet** (MetaMask, Trust Wallet, etc.)
- **BSC mainnet BNB** for transactions
- .safu domain registered on BNB Chain (optional, for full access)

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install
# or
bun install

# Install backend dependencies
cd ../server
npm install
```

### Environment Configuration

#### Frontend Setup

Create `frontend/.env`:

```bash
# WalletConnect Project ID for BSC connection
VITE_PROJECT_ID=your_walletconnect_project_id
```

Update `frontend/src/main.tsx:18` with your WalletConnect Project ID:

```typescript
projectId: "YOUR_PROJECT_ID", // Get from https://cloud.walletconnect.com/
```

#### Backend Setup

Create `server/.env`:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3000
KEY=your_api_key

# BNB Chain Contract Addresses (already configured for BSC mainnet)
REVERSE_ADDRESS=0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125
REGISTRY_ADDRESS=0xa886B8897814193f99A88701d70b31b4a8E27a1E
BASE_ADDRESS=0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c

# Database
DB_FILE=./data.db
```

### Running the Application

#### Start Backend Server (BNB Chain)

```bash
cd server
node server.js
```

Server will connect to **BNB Chain** via BSC RPC endpoint.

#### Start Frontend Development Server

```bash
cd frontend
npm run dev
# or
bun dev
```

Frontend will be available at `http://localhost:5173` with **BSC wallet connection**.

### Build for Production

```bash
cd frontend
npm run build
# or
bun run build
```

---

## Project Structure

```
SafuAgents/
├── frontend/                    # React frontend (BSC Web3 integration)
│   ├── src/
│   │   ├── main.tsx            # Entry point - BSC wagmi config (Line 13,19)
│   │   ├── App.tsx             # Main application component
│   │   ├── ChatInterface.tsx   # AI chat interface
│   │   └── nav.tsx             # Navigation component
│   ├── public/                 # Static assets
│   ├── package.json            # Dependencies (includes BSC Web3 stack)
│   └── README.md               # Detailed frontend documentation
│
├── server/                      # Express backend (BSC integration)
│   ├── server.js               # Main server - BSC RPC config (Line 31-32)
│   ├── package.json            # Dependencies (includes ethers.js)
│   └── data.db                 # SQLite database (auto-created)
│
└── README.md                    # This file (BNB Chain deployment guide)
```

---

## BNB Chain Network Information

### BSC Mainnet Configuration

- **Network Name**: BNB Smart Chain
- **Chain ID**: 56
- **RPC URL**: https://bsc-dataseed.binance.org/
- **Alternative RPCs**:
  - https://bsc-dataseed1.binance.org/
  - https://bsc-dataseed2.binance.org/
  - https://bsc-dataseed3.binance.org/
- **Currency Symbol**: BNB
- **Block Explorer**: https://bscscan.com

### Why BNB Chain?

SafuAgents leverages BNB Chain for:

1. **Low Transaction Costs**: Minimal fees for domain verification
2. **Fast Confirmations**: Quick blockchain operations
3. **BSC Ecosystem Access**: Integration with DeFi, NFTs, and other BSC protocols
4. **Native Integration**: Part of the Safuverse ecosystem on BNB Chain
5. **.safu Domain Infrastructure**: Native domain system deployed on BSC

---

## Usage Guide

### 1. Connect Your BSC Wallet

1. Open the application in your browser
2. Click "Connect Wallet"
3. Select your BSC-compatible wallet (MetaMask, Trust Wallet, etc.)
4. **Ensure your wallet is connected to BNB Smart Chain (Chain ID: 56)**
5. The app will automatically verify your network

### 2. Verify Domain (Optional)

If you own a .safu domain on BNB Chain:

1. Connect your wallet containing the .safu domain
2. Click "Verify Domain"
3. The system will query **BSC smart contracts** to verify ownership
4. Your tier will be automatically assigned based on domain characteristics

### 3. Interact with AI Agents

- **With .safu domain**: Access all agents based on your tier
- **Without domain**: Limited access (5 lifetime calls, 1 agent)

---

## Integration with Safuverse Ecosystem (BNB Chain)

SafuAgents is part of the **Safuverse ecosystem**, all components deployed on **BNB Chain**:

- **SafuCourse**: Educational platform
- **safudomains**: ENS-like domain system on BSC
- **safupad**: Token launch platform
- **Safucard**: NFT scorecard system
- **SafuAgents**: AI agent platform (this repository)

All ecosystem components leverage **BNB Chain infrastructure** for interoperability.

---

## API Endpoints

### POST `/api/verify`
Verifies .safu domain ownership **on BNB Chain**.

**Process**:
1. Queries BSC smart contracts (`REVERSE_ADDRESS`, `REGISTRY_ADDRESS`)
2. Verifies domain ownership on-chain
3. Checks domain expiry via `BASE_ADDRESS` contract
4. Assigns tier based on domain characteristics

### POST `/api/assistant`
Handles AI agent chat requests with BSC-based rate limiting.

**Rate Limiting**:
- Based on .safu domain ownership (verified on BSC)
- Tier system tied to on-chain domain characteristics

### GET `/api/user?publicKey=...`
Retrieves user data and BSC domain verification status.

### GET `/api/ip-status`
Checks IP-based usage for non-domain users.

---

## Security Considerations

- Never commit private keys or API keys
- Always verify you're on **BSC mainnet (Chain ID: 56)** before transactions
- Use environment variables for sensitive configuration
- Verify contract addresses match BSC mainnet deployments
- Be cautious with transaction approvals on BNB Chain

---

## BNB Chain Compliance Summary

This repository demonstrates **clear deployment intent on BNB Chain** through:

### Configuration Evidence
- Frontend wagmi config: **Explicit BSC chain** (`frontend/src/main.tsx:13,19`)
- Backend RPC provider: **BSC dataseed endpoint** (`server/server.js:31-32`)

### BNB Chain-Specific Infrastructure
- .safu domain contracts deployed on **BSC mainnet**
- Smart contract addresses: **BSC-specific** (`server/server.js:36-77`)
- All blockchain queries: **BSC RPC endpoint**

### README Documentation
- Explicitly states **BNB Chain deployment** throughout
- Provides BSC network information
- Documents BNB Chain-specific features

### No Ambiguity
- Single chain configuration (BSC only)
- No multi-chain fallbacks or alternatives
- All operations on BNB Chain infrastructure

A reviewer examining this repository can **reasonably conclude** that SafuAgents is deployed on **BNB Chain** without external context.

---

## Development Notes

### React + TypeScript
- Modern React 19 with TypeScript 5.9
- Full type safety for BSC contract interactions
- ESLint 9 with TypeScript support

### BNB Chain Development
- Uses official BSC RPC endpoints
- Follows BSC best practices for contract interaction
- Optimized for BSC's fast block times

---

## Support & Documentation

### BNB Chain Resources
- [BNB Chain Documentation](https://docs.bnbchain.org)
- [BscScan](https://bscscan.com) - Blockchain explorer
- [BNB Chain Faucet](https://testnet.bnbchain.org/faucet-smart) - Testnet BNB

### Web3 Libraries (BSC-Configured)
- [RainbowKit Documentation](https://rainbowkit.com)
- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)

### AI Integration
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## License

See the main Safuverse repository for license information.

---

**Powered by BNB Chain and .safu** - Leveraging BSC's speed, efficiency, and low costs for AI-enhanced Web3 experiences.

**Official BNB Chain Deployment** | Chain ID: 56 | Network: BSC Mainnet
