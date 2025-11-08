# Safucard - NFT Scorecard System

Dynamic NFT scorecard system **deployed on BNB Chain** that analyzes wallet memecoin activity and mints personalized scorecard NFTs with USD-pegged pricing.

## Overview

Safucard is a comprehensive NFT scorecard platform on BNB Smart Chain consisting of three main components:
1. **Smart Contracts** (SafucardNFT): ERC721 NFT with Chainlink-powered dynamic pricing
2. **Backend API** (Safucardserver): Wallet analysis and memecoin scoring engine
3. **Frontend**: User interface for minting and viewing scorecards

All components integrate with **BNB Chain** infrastructure for minting, pricing, and display.

## Deployment Information

**Primary Network**: BNB Chain (BNB Smart Chain)
- **Chain ID**: 56 (BSC Mainnet)
- **Testnet Chain ID**: 97 (BSC Testnet)

The NFT contracts are deployed on BNB Chain, leveraging Chainlink price oracles on BSC for accurate BNB/USD conversion to maintain a stable $5 USD mint price.

## System Architecture

### 1. SafucardNFT (Smart Contracts)
ERC721 NFT contract with dynamic BNB pricing based on USD value.

**Key Features**:
- $5 USD mint fee (converted to BNB via Chainlink oracle on BSC)
- URI freezing after mint for permanence
- Owner withdrawal functionality
- Chainlink integration for price feeds on BNB Chain

**Directory**: `SafucardNFT/`

### 2. Safucardserver (Backend API)
Node.js/Express API that calculates wallet memecoin scores.

**Key Features**:
- Wallet activity analysis
- Memecoin portfolio scoring
- Integration with BSC blockchain data
- RESTful API for frontend consumption

**Directory**: `Safucardserver/`

### 3. Frontend (User Interface)
React application for users to check scores and mint NFTs.

**Key Features**:
- Wallet connection (BNB Chain)
- Score visualization
- NFT minting interface
- BSC transaction handling

**Directory**: `frontend/`

## Getting Started

### Prerequisites

- Node.js 18+
- BNB Chain wallet (MetaMask)
- BNB tokens for minting and deployment
- Hardhat (for smart contract development)

### Quick Start

Each component has its own setup. Navigate to the respective directory:

```bash
# Smart Contracts
cd SafucardNFT
npm install
npx hardhat compile

# Backend API
cd Safucardserver
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Component Details

### SafucardNFT Smart Contract

**Features**:
- Chainlink BNB/USD price oracle integration on BSC
- Dynamic minting fee calculation
- ERC721 standard compliance
- Secure ownership and withdrawal

**Deployment**:
```bash
cd SafucardNFT
npx hardhat run scripts/deploy.js --network bsc
```

See `SafucardNFT/README.md` for detailed documentation.

### Safucardserver Backend

**Features**:
- Memecoin score calculation algorithm
- BSC blockchain data integration
- RESTful API endpoints
- Wallet analysis engine

**Running**:
```bash
cd Safucardserver
npm run dev
```

See `Safucardserver/README.md` for API documentation.

### Frontend Application

**Features**:
- Web3 wallet connection (BSC)
- Score checking interface
- NFT minting UI
- Transaction status tracking

**Running**:
```bash
cd frontend
npm run dev
```

See `frontend/README.md` for setup details.

## How It Works

### User Flow

1. **Connect Wallet**: User connects BNB Chain wallet (MetaMask, Trust Wallet)
2. **Check Score**: Frontend calls backend API to calculate wallet memecoin score
3. **View Results**: Score and analysis displayed to user
4. **Mint NFT**: User initiates mint transaction on BNB Chain
5. **Price Calculation**: Smart contract fetches BNB/USD price from Chainlink oracle on BSC
6. **Mint**: NFT minted for $5 USD equivalent in BNB
7. **Permanent Record**: Scorecard URI frozen on-chain

### Technical Flow

```
User Wallet (BSC)
    ↓
Frontend (React)
    ↓
Safucardserver API → Analyzes BSC wallet activity
    ↓
Frontend displays score
    ↓
User approves mint transaction
    ↓
SafucardNFT Contract on BSC
    ↓
Chainlink Oracle (BSC) → BNB/USD price
    ↓
NFT Minted on BNB Chain
```

## BNB Chain Integration

### Smart Contract Integration
- Deployed on BSC Mainnet/Testnet
- Uses Chainlink price feeds available on BNB Chain
- Verified on BSCScan
- ERC721 standard on BSC

### Backend Integration
- Fetches wallet data from BSC RPC nodes
- Analyzes memecoin transactions on BNB Chain
- Tracks portfolio values in BNB

### Frontend Integration
- wagmi/viem configured for BSC
- RPC endpoints pointing to BNB Chain
- Transaction signing through BSC network
- MetaMask BSC network selection

## Environment Variables

Each component requires BNB Chain-specific configuration:

### SafucardNFT
```bash
PRIVATE_KEY=your_wallet_private_key
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSCSCAN_API_KEY=your_bscscan_api_key
CHAINLINK_BNB_USD_FEED=0x... # BSC oracle address
```

### Safucardserver
```bash
BSC_RPC_URL=https://bsc-dataseed.binance.org/
PORT=3000
DATABASE_URL=your_database_url
```

### Frontend
```bash
VITE_BSC_RPC=https://bsc-dataseed.binance.org/
VITE_CONTRACT_ADDRESS=deployed_nft_contract_address
VITE_API_URL=http://localhost:3000
```

## Technology Stack

### Blockchain
- **Network**: BNB Smart Chain (BSC)
- **Smart Contracts**: Solidity
- **Development**: Hardhat
- **Oracles**: Chainlink (BSC network)
- **Standard**: ERC721

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Blockchain**: ethers.js / web3.js (BSC RPC)
- **Database**: PostgreSQL / MongoDB

### Frontend
- **Framework**: React
- **Web3**: wagmi, viem, ethers.js
- **Build**: Vite
- **Wallet**: MetaMask, RainbowKit

## Deployment

### 1. Deploy Smart Contract to BSC

```bash
cd SafucardNFT
npx hardhat run scripts/deploy.js --network bsc
# Note the deployed contract address
```

### 2. Verify on BSCScan

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 3. Deploy Backend

```bash
cd Safucardserver
# Configure environment for BSC RPC
npm run build
npm start
```

### 4. Deploy Frontend

```bash
cd frontend
# Update .env with BSC contract address
npm run build
# Deploy dist/ to hosting service
```

## Network Information

### BSC Mainnet
- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **Chainlink BNB/USD**: Available on BSC mainnet

### BSC Testnet
- **Chain ID**: 97
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

## Integration with Safuverse

Safucard integrates with other Safuverse components on BNB Chain:
- **safudomains**: Domain holder scorecard bonuses
- **SafuCourse**: Achievement-based NFT updates
- **safupad**: Token launch participation scoring
- **SafuAgents**: AI-powered score analysis

All integrations occur on-chain on BNB Chain.

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test on BSC Testnet
4. Submit a pull request

## Security

- Smart contracts audited for common vulnerabilities
- Chainlink oracle price validation
- Owner-only withdrawal functions
- URI freezing prevents metadata tampering

For security issues: info@level3labs.fun

## License

See individual component directories for license information.

## Support

- **Documentation**: See component-specific READMEs
- **Issues**: GitHub Issues
- **Email**: info@level3labs.fun

---

**Built on BNB Chain** - Dynamic NFT scorecards powered by BNB Smart Chain and Chainlink oracles.
