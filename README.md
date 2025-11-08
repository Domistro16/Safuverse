# Safuverse Ecosystem

A comprehensive Web3 ecosystem **deployed on BNB Chain** (BNB Smart Chain - BSC), offering decentralized education, naming services, token launchpad, NFT scorecards, and AI-powered agents.

## Deployment Information

**Primary Network**: BNB Smart Chain (BSC)
- **BSC Mainnet** (Chain ID: 56)
- **BSC Testnet** (Chain ID: 97)

All smart contracts in this ecosystem are deployed and operational on BNB Chain, leveraging its low transaction costs and high throughput for optimal user experience.

## Ecosystem Components

### 1. SafuCourse - Decentralized Education Platform
On-chain educational platform with gasless transactions, allowing domain owners to create and participate in blockchain courses.

**Live on BNB Chain**: https://learn.level3labs.fun

**Features**:
- Gasless on-chain courses via OpenZeppelin Defender relayer
- Domain-gated access control
- Progress tracking stored on BSC
- Integration with Safudomains naming service

**Directory**: `SafuCourse/`

### 2. safudomains - Decentralized Naming Service
ENS-inspired domain name system with custom .safu TLD deployed on BNB Chain.

**Live on BNB Chain**: https://dns.level3labs.fun

**Features**:
- Custom .safu TLD on BSC
- Multi-token pricing (BNB, CAKE, USD1)
- Built-in referral rewards system
- Complete ENS registry implementation
- Chainlink price oracles for BNB/USD

**Directory**: `safudomains/`

### 3. safupad-contracts - Token Launchpad
Fair launch platform with bonding curve mechanics and automatic PancakeSwap integration on BNB Chain.

**Features**:
- Two launch modes: Project Raise & Instant Launch
- Bonding curve DEX with dynamic fees
- Automatic graduation to PancakeSwap V2
- Anti-bot protection mechanisms
- BNB-denominated token launches (50-500 BNB)

**Directory**: `safupad-contracts/`

### 4. safupadsdk - TypeScript SDK
Comprehensive TypeScript SDK for interacting with SafuPad launchpad on BNB Chain.

**Features**:
- Full type safety with TypeScript
- Multi-network support (BSC Mainnet, BSC Testnet, localhost)
- Event handling and volume tracking
- Browser and Node.js compatible

**Directory**: `safupadsdk/`

### 5. Safucard - NFT Scorecard System
Dynamic NFT scorecard system with USD-pegged minting deployed on BNB Chain.

**Features**:
- ERC721 NFT with $5 USD dynamic pricing via Chainlink oracle
- Wallet memecoin score analysis
- Backend API for score calculation
- URI freezing after mint

**Directory**: `Safucard/`
- `SafucardNFT/` - Smart contracts
- `Safucardserver/` - Backend API
- `frontend/` - User interface

### 6. SafuAgents - AI Agents Interface
React-based frontend for interacting with AI agents, with Web3 wallet integration.

**Features**:
- Multi-chain wallet support (primary: BNB Chain)
- RainbowKit integration
- OpenAI-powered agents
- Solana secondary support

**Directory**: `SafuAgents/`

### 7. SafuLanding - Marketing Website
Landing page and marketing website for the Safuverse ecosystem.

**Directory**: `SafuLanding/`

## Technology Stack

### Blockchain Infrastructure
- **Primary Network**: BNB Smart Chain (BSC Mainnet & Testnet)
- **Smart Contracts**: Solidity 0.8.17 - 0.8.28
- **Development**: Hardhat 2.x & 3.0
- **Standards**: ERC20, ERC721, ERC1155, EIP-2771

### BNB Chain Integrations
- **PancakeSwap V2/V3**: Automated liquidity provision and token trading
- **WBNB**: Wrapped BNB token integration
- **Chainlink on BSC**: Price oracles for BNB/USD and dynamic pricing
- **BSCScan**: Contract verification and transparency

### Frontend
- **Framework**: React 18-19, TypeScript
- **Build Tool**: Vite
- **Web3**: wagmi, viem (configured for BSC)
- **Wallet**: RainbowKit, MetaMask
- **UI**: Radix UI, Tailwind CSS

### Backend
- **Runtime**: Node.js with TypeScript
- **Relayer**: OpenZeppelin Defender (gasless transactions)
- **APIs**: Express-based REST APIs

## Repository Structure

```
Safuverse/
├── SafuAgents/          # AI agents interface
├── SafuCourse/          # Educational platform contracts & frontend
├── SafuLanding/         # Marketing website
├── Safucard/            # NFT scorecard system
│   ├── SafucardNFT/     # Smart contracts
│   ├── Safucardserver/  # Backend API
│   └── frontend/        # User interface
├── safudomains/         # DNS naming service
├── safupad-contracts/   # Token launchpad contracts
└── safupadsdk/          # TypeScript SDK for launchpad
```

## Getting Started

Each sub-project contains its own README with detailed setup instructions. General steps:

### Prerequisites
- Node.js 18+ or Bun
- BNB Chain wallet (MetaMask recommended)
- BSC testnet BNB for development (get from https://testnet.bnbchain.org/faucet-smart)

### Environment Setup

Most projects require these environment variables:

```bash
# Blockchain Configuration
DEPLOYER_KEY=your_private_key_here
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# BSCScan Verification
BSCSCAN_API_KEY=your_bscscan_api_key

# For SafuCourse gasless transactions
RELAYER_API_KEY=your_openzeppelin_defender_key
```

### Network Configuration

All projects are configured to deploy to:
- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97

RPC endpoints are configured in each project's `hardhat.config.ts` or frontend configuration files.

## Smart Contract Deployments

All smart contracts are deployed and verified on BSCScan:

- **SafuCourse**: Course creation and management
- **safudomains**: ENS registry, controllers, resolvers, price oracles
- **safupad-contracts**: Launchpad manager, bonding curve DEX, token factory
- **Safucard**: Scorecard NFT with Chainlink integration

## Development

### Install Dependencies

Each sub-project uses npm/yarn/bun:

```bash
cd <project-directory>
npm install
```

### Testing

Smart contract projects include Hardhat tests:

```bash
npx hardhat test
```

### Deployment to BSC

```bash
# Deploy to BSC Testnet
npx hardhat run scripts/deploy.ts --network bscTestnet

# Deploy to BSC Mainnet
npx hardhat run scripts/deploy.ts --network bsc
```

### Contract Verification on BSCScan

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## BNB Chain Specific Features

This ecosystem leverages BNB Chain's unique advantages:

1. **Low Transaction Costs**: Enables gasless course enrollment via relayers
2. **High Throughput**: Supports high-frequency trading on bonding curves
3. **PancakeSwap Integration**: Native DEX integration for token graduation
4. **Chainlink Oracles**: Reliable BNB/USD price feeds for dynamic pricing
5. **BSC Ecosystem**: Integration with CAKE token and other BSC-native assets

## Live Deployments on BNB Chain

- **SafuCourse**: https://learn.level3labs.fun
- **safudomains**: https://dns.level3labs.fun

## Contributing

Each sub-project may have its own contribution guidelines. Please check individual project READMEs.

## License

See individual project directories for specific license information.

## Security

Smart contracts deployed on BNB Chain have been developed with security best practices:
- OpenZeppelin contract libraries
- Reentrancy guards
- Access control mechanisms
- Price oracle integration for fair pricing

For security concerns, please review individual project documentation.

## Support & Documentation

For detailed documentation on each component:
- Navigate to individual project directories
- Check project-specific README files
- Review smart contract comments and NatSpec documentation

## Network Information

### BSC Mainnet
- Chain ID: 56
- RPC: https://bsc-dataseed.binance.org/
- Explorer: https://bscscan.com
- Native Token: BNB

### BSC Testnet
- Chain ID: 97
- RPC: https://data-seed-prebsc-1-s1.binance.org:8545/
- Explorer: https://testnet.bscscan.com
- Faucet: https://testnet.bnbchain.org/faucet-smart

---

**Built on BNB Chain** - Leveraging the power of BNB Smart Chain for scalable, efficient Web3 applications.
