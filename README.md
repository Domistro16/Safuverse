# Safuverse Ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive Web3 ecosystem **deployed on BNB Chain** (BNB Smart Chain - BSC), offering decentralized education, naming services, token launchpad, NFT scorecards, and AI-powered agents.

## Deployment Information

**Primary Network**: BNB Smart Chain (BSC)

- **BSC Mainnet** (Chain ID: 56)
- **BSC Testnet** (Chain ID: 97)

All smart contracts in this ecosystem are deployed and operational on BNB Chain, leveraging its low transaction costs and high throughput for optimal user experience.

## Ecosystem Components

### 1. SafuAcademy - Decentralized Education Platform

On-chain educational platform with gasless transactions, allowing domain owners to create and participate in blockchain courses.

**Live on BNB Chain**: https://academy.safuverse.com

**Features**:

- Gasless on-chain courses via a backend relayer
- Domain-gated access control
- Progress tracking stored on BSC
- Integration with SafuDomains naming service

**Directory**: `SafuAcademy/`

### 2. SafuDomains - Decentralized Naming Service

ENS-inspired domain name system with custom .safu TLD deployed on BNB Chain.

**Live on BNB Chain**: https://names.safuverse.com

**Features**:

- Custom .safu TLD on BSC
- Multi-token pricing (BNB, CAKE, USD1)
- Built-in referral rewards system
- Complete ENS registry implementation
- Chainlink price oracles for BNB/USD

**Directory**: `SafuDomains/`

### 3. SafuPad - Token Launchpad (In Development)

Fair launch platform with bonding curve mechanics and automatic PancakeSwap integration on BNB Chain.

**Features**:

- Two launch modes: Project Raise & Instant Launch
- Bonding curve DEX with dynamic fees
- Automatic graduation to PancakeSwap V2
- Anti-bot protection mechanisms
- BNB-denominated token launches (50-500 BNB)

**Directory**: `SafuPad/`

### 4. SafuPadSDK - TypeScript SDK

Comprehensive TypeScript SDK for interacting with SafuPad launchpad on BNB Chain.

**Features**:

- Full type safety with TypeScript
- Multi-network support (BSC Mainnet, BSC Testnet, localhost)
- Event handling and volume tracking
- Browser and Node.js compatible

**Directory**: `SafuPadSDK/`

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

**Directory**: `SafuAgents/`

### 7. SafuLanding - Marketing Website

Landing page and marketing website for the Safuverse ecosystem.

**Directory**: `SafuLanding/`

## User Journey Diagrams

### SafuPad - Token Launch Journey

```mermaid
graph TD
    A[User Connects Wallet] --> B{Choose Launch Type}
    B -->|Project Raise| C[Configure Token Details]
    B -->|Instant Launch| D[Configure Token & Initial Liquidity]

    C --> E[Set Raise Parameters<br/>50-500 BNB]
    E --> F[Deploy Token via Factory]
    F --> G[24h Fundraising Period]

    D --> H[Deploy with Bonding Curve]
    H --> I[Immediate Trading Starts]

    G --> J{Raise Target Met?}
    J -->|Yes| K[Graduate to PancakeSwap]
    J -->|No| L[Contributors Get Refunds]

    I --> M[Trading on Bonding Curve]
    M --> N{15 BNB Threshold Reached?}
    N -->|Yes| K
    N -->|No| M

    K --> O[LP Tokens Locked/Burned]
    O --> P[Trading on PancakeSwap]
    P --> Q[Founder Vesting Begins]
    Q --> R[LP Fees Harvested]

    style A fill:#FF7000
    style K fill:#90EE90
    style P fill:#90EE90
```

### SafuAcademy - Learning Journey

```mermaid
graph TD
    A[User Connects Wallet] --> B{Has .safu Domain?}
    B -->|No| C[Redirect to SafuDomains]
    B -->|Yes| D[Browse Course Catalog]

    C --> E[Purchase .safu Domain]
    E --> D

    D --> F[Select Course]
    F --> G[View Course Details]
    G --> H[Enroll - Gasless Transaction]

    H --> I[Relayer Submits Transaction]
    I --> J[On-Chain Enrollment Confirmed]

    J --> K[Access Course Content]
    K --> L[Watch Video Lessons]
    L --> M[Complete Quizzes]

    M --> N[Progress Tracked On-Chain]
    N --> O{Course Completed?}
    O -->|No| L
    O -->|Yes| P[Earn Points & Certificate]

    P --> Q[NFT Certificate Issued]
    Q --> R[Share Achievement]

    style A fill:#FF7000
    style H fill:#90EE90
    style P fill:#FFD700
    style Q fill:#FFD700
```

### SafuDomains - Domain Registration Journey

```mermaid
graph TD
    A[User Connects Wallet] --> B[Search for .safu Domain]
    B --> C{Domain Available?}
    C -->|No| B
    C -->|Yes| D[Select Registration Duration]

    D --> E{Payment Method?}
    E -->|BNB| F[Calculate BNB Price]
    E -->|CAKE| G[Calculate CAKE Price]
    E -->|USD1| H[Calculate USD1 Price]

    F --> I[Approve Payment]
    G --> I
    H --> I

    I --> J[Register Domain On-Chain]
    J --> K{Use Referral Code?}
    K -->|Yes| L[Referrer Gets Reward]
    K -->|No| M[Set as Primary Name]

    L --> M
    M --> N[Configure Resolver]
    N --> O[Domain Registered Successfully]

    O --> P[Access SafuAcademyy]
    O --> Q[Use for Identity]

    style A fill:#FF7000
    style O fill:#90EE90
    style L fill:#FFD700
```

### Safucard - NFT Scorecard Journey

```mermaid
graph TD
    A[User Connects Wallet] --> B[Request Wallet Analysis]
    B --> C[Backend Analyzes Memecoin Holdings]

    C --> D[Calculate Scorecard Metrics]
    D --> E[Display Score Preview]

    E --> F{User Wants to Mint?}
    F -->|No| G[Exit]
    F -->|Yes| H[Get USD Price from Chainlink]

    H --> I[Convert $5 USD to BNB]
    I --> J[User Pays in BNB]

    J --> K[NFT Minted On-Chain]
    K --> L[Metadata Uploaded to IPFS]
    L --> M[URI Frozen - Permanent Record]

    M --> N[NFT Appears in Wallet]
    N --> O[Share on Social Media]

    style A fill:#FF7000
    style K fill:#90EE90
    style M fill:#FFD700
```

## System Architecture

### Overall Ecosystem Architecture

```mermaid
graph TB
    subgraph "User Layer"
        U1[Web Browser]
        U2[MetaMask/Binance Wallet]
    end

    subgraph "Frontend Layer - Vercel"
        F1[SafuAcademy Frontend<br/>academy.safuverse.com]
        F2[SafuDomains Frontend<br/>names.safuverse.com]
        F3[Safucard Frontend<br/>safucard.xyz]
        F4[SafuAgents Frontend<br/>ai.safuverse.com]
        F5[SafuLanding<br/>safuverse.com]
    end

    subgraph "Backend Layer"
        B1[SafuAcademy Relayer<br/>Gasless Transactions]
        B2[Safucard API<br/>Score Calculation]
        B3[SafuAgents API<br/>OpenAI Integration]
    end

    subgraph "BNB Smart Chain - Chain ID 56"
        subgraph "SafuPad Contracts"
            SP1[LaunchpadManager]
            SP2[BondingCurveDEX]
            SP3[TokenFactory]
            SP4[LPFeeHarvester]
        end

        subgraph "SafuAcademyy Contracts"
            SA1[CourseFactory]
            SA2[Level3Course]
        end

        subgraph "SafuDomains Contracts"
            SD1[ENS Registry]
            SD2[Controller]
            SD3[BaseRegistrar]
            SD4[NameWrapper]
            SD5[PublicResolver]
            SD6[ReverseRegistrar]
            SD7[Referral System]
        end

        subgraph "Safucard Contracts"
            SC1[ScorecardNFT]
        end

        subgraph "External BSC Integrations"
            EX1[PancakeSwap V2<br/>Router & Factory]
            EX2[Chainlink Oracles<br/>BNB/USD]
            EX3[WBNB Contract]
        end
    end

    subgraph "Storage Layer"
        S1[IPFS/Pinata<br/>Course Content & NFT Metadata]
    end

    U1 --> F1
    U1 --> F2
    U1 --> F3
    U1 --> F4
    U1 --> F5

    U2 --> SP1
    U2 --> SA2
    U2 --> SD2
    U2 --> SC1

    F1 --> B1
    F3 --> B2
    F4 --> B3

    B1 --> SA2

    F1 --> SA2
    F1 --> SD6
    F2 --> SD2

    SP1 --> SP2
    SP1 --> SP3
    SP1 --> EX1
    SP2 --> EX1
    SP4 --> EX1

    SA2 --> SD6

    SD2 --> SD1
    SD2 --> SD3
    SD3 --> SD4
    SD1 --> SD5
    SD1 --> SD6
    SD2 --> SD7

    SC1 --> EX2
    SD2 --> EX2

    SP1 --> EX3
    EX1 --> EX3

    F1 --> S1
    SC1 --> S1

    style U1 fill:#FFE4B5
    style U2 fill:#FFE4B5
    style EX1 fill:#E6E6FA
    style EX2 fill:#E6E6FA
    style EX3 fill:#E6E6FA
```

### SafuPad Smart Contract Architecture

```mermaid
graph TB
    subgraph "User Interactions"
        U[Founder/Trader]
    end

    subgraph "LaunchpadManagerV3 - Main Controller"
        LM[LaunchpadManager]
        LM_CREATE[createLaunch/<br/>createInstantLaunch]
        LM_CONTRIB[contribute]
        LM_GRAD[graduateToPancakeSwap]
        LM_VEST[Vesting Logic]
    end

    subgraph "BondingCurveDEX - Trading Engine"
        BC[BondingCurveDEX]
        BC_BUY[buyTokens]
        BC_SELL[sellTokens]
        BC_FEES[Dynamic Fee System<br/>10% → 1-2%]
        BC_GRAD[graduatePool]
    end

    subgraph "TokenFactoryV2"
        TF[Token Factory]
        TF_DEPLOY[deployToken<br/>CREATE2]
        TF_TOKEN[LaunchpadTokenV2<br/>ERC20]
    end

    subgraph "LPFeeHarvester"
        LP[LP Harvester]
        LP_LOCK[lockLP]
        LP_HARVEST[harvestFees]
        LP_DIST[Fee Distribution<br/>70% Creator<br/>30% Platform]
    end

    subgraph "PriceOracle"
        PO[Chainlink Oracle]
        PO_BNB[getBNBPrice]
        PO_CONVERT[bnbToUSD/<br/>usdToBNB]
    end

    subgraph "External Contracts"
        PS_ROUTER[PancakeSwap Router]
        PS_FACTORY[PancakeSwap Factory]
        PS_PAIR[PancakeSwap Pair<br/>Token/WBNB]
        WBNB[Wrapped BNB]
        CHAINLINK[Chainlink BNB/USD]
    end

    U -->|1. Create Launch| LM_CREATE
    LM_CREATE --> TF_DEPLOY
    TF_DEPLOY --> TF_TOKEN

    LM_CREATE -->|Instant Launch| BC

    U -->|2a. Contribute BNB| LM_CONTRIB
    U -->|2b. Trade on Curve| BC_BUY
    U -->|2b. Trade on Curve| BC_SELL

    BC_BUY --> BC_FEES
    BC_SELL --> BC_FEES

    LM_CONTRIB -->|Target Met| LM_GRAD
    BC -->|15 BNB Reached| BC_GRAD
    BC_GRAD --> LM_GRAD

    LM_GRAD --> PS_ROUTER
    PS_ROUTER --> PS_FACTORY
    PS_FACTORY --> PS_PAIR

    PS_PAIR --> LP_LOCK
    LP_LOCK -->|Periodic| LP_HARVEST
    LP_HARVEST --> LP_DIST

    PS_ROUTER --> WBNB

    LM_CREATE --> PO_BNB
    PO_BNB --> CHAINLINK

    LM_GRAD -->|After Graduation| LM_VEST
    LM_VEST -->|10% Immediate<br/>90% Vested| U

    style U fill:#FFE4B5
    style TF_TOKEN fill:#90EE90
    style PS_PAIR fill:#90EE90
    style BC_FEES fill:#FFD700
    style LP_DIST fill:#FFD700
```

### Data Flow - SafuAcademy Gasless Enrollment

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Relayer
    participant Domain as SafuDomains<br/>ReverseRegistrar
    participant Course as Level3Course<br/>Contract
    participant BSC as BNB Chain

    User->>Frontend: Connect Wallet
    Frontend->>Domain: getPrimaryName(address)
    Domain-->>Frontend: Returns .safu domain

    alt Has .safu Domain
        User->>Frontend: Click "Enroll in Course"
        Frontend->>Frontend: Create enrollment message
        User->>Frontend: Sign message (gasless)

        Frontend->>Relayer: Submit signed enrollment
        Relayer->>Relayer: Verify signature
        Relayer->>Course: enroll(user, courseId)
        Note over Relayer,Course: Relayer pays gas

        Course->>BSC: Transaction submitted
        BSC-->>Course: Confirmation
        Course-->>Relayer: Enrollment success
        Relayer-->>Frontend: Success response
        Frontend-->>User: "Enrolled! Access course now"

        User->>Frontend: Start lesson
        Frontend->>Course: getLessonContent(courseId, lessonId)
        Course-->>Frontend: Lesson data
        Frontend->>Frontend: Load video from IPFS

        User->>Frontend: Complete lesson
        Frontend->>Relayer: Submit completion signature
        Relayer->>Course: markLessonComplete(user, lessonId)
        Course->>BSC: Update progress on-chain
        BSC-->>Course: Confirmed
        Course-->>Frontend: Progress updated
        Frontend-->>User: "Lesson complete! +10 points"
    else No .safu Domain
        Frontend-->>User: "Please register a .safu domain first"
        User->>Frontend: Redirect to SafuDomains
    end
```

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
├── SafuAcademy/          # Educational platform contracts & frontend
├── SafuLanding/         # Marketing website
├── Safucard/            # NFT scorecard system
│   ├── SafucardNFT/     # Smart contracts
│   ├── Safucardserver/  # Backend API
│   └── frontend/        # User interface
├── SafuDomains/         # DNS naming service
├── SafuPad/   # Token launchpad contracts
└── SafuPadSDK/          # TypeScript SDK for launchpad
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
```

### Network Configuration

All projects are configured to deploy to:

- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97

RPC endpoints are configured in each project's `hardhat.config.ts` or frontend configuration files.

## Smart Contract Deployments

All smart contracts are deployed and verified on BSCScan. Below are the deployed contract addresses for each component:

### SafuAcademy - Education Platform

**BSC Mainnet (Chain ID: 56)**:

- **Course Factory**: `0xE796bc81c3F372237641998c24C755e710832bA9`
- **Level3Course**: `0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13`

### SafuDomains - Naming Service

**BSC Mainnet (Chain ID: 56)**:

- **Controller**: `0x48511b6c15fe1F89bAf6b30dBFA35bF0eAaEB751`
- **Registry**: `0x6aEFc7ac590096c08187a9052030dA59dEd7E996`
- **ReverseRegistrar**: `0xc070aAcE207ad5eb2A460D059785ffC9D4D2C536`
- **BaseRegistrar**: `0xc85f95FCe09b582D546606f591CEEC88D88714f5`
- **NameWrapper**: `0x86a930d1931C11e3Ec46b3A050E27F29bF94B612`
- **PublicResolver**: `0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357`
- **Referral**: `0x182690bD985ef02Ae44A6F8a2e71666bDe1196E2`

### SafuPad - Token Launchpad (In Development)

**BSC Testnet (Chain ID: 97) - Unverified**:

- **LaunchpadManager**: `0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c`
- **BondingCurveDEX**: `0x14eB3B6C297ff6fefc25c0E0d289Bf8348e864f6`
- **TokenFactory**: `0xcb7526b9598240A737237C52f852705e6A449cD0`
- **PriceOracle**: `0x56f0b1f80F8cc37f875Be42e2f4D09810514F346`
- **LPFeeHarvester**: `0xa886B8897814193f99A88701d70b31b4a8E27a1E`

### Safucard - NFT Scorecard

**BSC Mainnet (Chain ID: 56)**:

- **ScorecardNFT**: Deployed with Chainlink oracle integration
- Dynamic USD-pegged pricing ($5 USD per mint)

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

- **SafuAcademy**: https://academy.safuverse.com
- **SafuDomains**: https://names.safuverse.com
- **Safucard**: https://safucard.xyz
- **SafuAgents**: https://ai.safuverse.com

## Open-Source Dependencies

This section provides a comprehensive overview of all major open-source dependencies used across the Safuverse ecosystem, organized by category.

### Smart Contract Development

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **Solidity** | 0.8.17 - 0.8.28 | GPL-3.0 | Smart contract language | All contracts |
| **Hardhat** | 2.x - 3.0.7 | MIT | Development framework | All contract projects |
| **OpenZeppelin Contracts** | 5.3.0 - 5.4.0 | MIT | Secure contract libraries | All contracts |
| **@nomicfoundation/hardhat-toolbox** | 5.x | MIT | Hardhat plugin suite | SafuPad, SafuAcademyy |
| **@nomicfoundation/hardhat-chai-matchers** | 2.x | MIT | Testing matchers | All contract projects |
| **Chai** | 4.x | MIT | Assertion library | All contract tests |
| **Mocha** | 10.x | MIT | Test framework | All contract tests |
| **ethers** | 6.x | MIT | Ethereum library | All contract projects |
| **Typechain** | 8.x | MIT | TypeScript bindings | SafuPad |
| **hardhat-gas-reporter** | 1.x | MIT | Gas usage reporting | SafuPad |
| **solidity-coverage** | 0.8.x | MIT | Code coverage | SafuPad |

### Frontend Framework & Build Tools

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **React** | 18.2.0 - 19.x | MIT | UI framework | All frontends |
| **TypeScript** | 5.2.2 - 5.x | Apache-2.0 | Type safety | All frontends |
| **Vite** | 5.2.11 - 5.x | MIT | Build tool | SafuAcademyy, SafuAgents |
| **React Router DOM** | 6.16.0 | MIT | Client-side routing | SafuAcademyy |
| **Next.js** | 14.x | MIT | React framework | SafuDomains (possible) |

### Web3 & Blockchain Integration

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **Wagmi** | 2.15.6 | MIT | React hooks for Ethereum | All frontends |
| **Viem** | 2.29.0 | MIT | TypeScript Ethereum library | All frontends |
| **RainbowKit** | 2.2.8 | MIT | Wallet connection UI | SafuAcademyy, SafuAgents |
| **ethers (v5)** | 5.8.0 | MIT | Ethereum utilities | Frontends (legacy) |
| **@binance/w3w-wagmi-connector** | Latest | MIT | Binance Wallet connector | SafuAcademyy |
| **@metamask/sdk-react** | Latest | MIT | MetaMask integration | Various |

### UI Components & Styling

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **Tailwind CSS** | 3.3.3 - 3.x | MIT | Utility-first CSS | All frontends |
| **Radix UI** | 1.x | MIT | Accessible UI primitives | SafuAcademyy |
| **shadcn/ui** | Latest | MIT | Component collection | SafuAcademyy |
| **Framer Motion** | 10.16.4 | MIT | Animation library | SafuAcademyy |
| **Lucide React** | Latest | ISC | Icon library | SafuAcademyy |
| **PostCSS** | 8.x | MIT | CSS transformation | All frontends |
| **Autoprefixer** | 10.x | MIT | CSS vendor prefixes | All frontends |

### State Management & Data Fetching

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **TanStack Query (React Query)** | 5.82.0 | MIT | Server state management | SafuAcademyy |
| **Zustand** | 4.x | MIT | Client state management | Various |
| **SWR** | 2.x | MIT | Data fetching | SafuDomains (possible) |

### Media & Content

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **Video.js** | 7.21 | Apache-2.0 | Video player | SafuAcademyy |
| **Pinata SDK** | 2.4.9 | MIT | IPFS integration | SafuAcademyy, Safucard |

### Backend & API

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **Node.js** | 18+ | MIT | Runtime environment | All backends |
| **Express** | 4.x | MIT | Web framework | Safucard API |
| **OpenZeppelin Defender** | Latest | MIT | Transaction relayer | SafuAcademyy |

### BNB Chain Specific Integrations

| Dependency | Type | Purpose | Used In |
|------------|------|---------|---------|
| **PancakeSwap V2 Router** | Contract | DEX integration | SafuPad |
| **PancakeSwap V2 Factory** | Contract | Pair creation | SafuPad |
| **Chainlink BNB/USD Oracle** | Contract | Price feeds | SafuPad, SafuDomains, Safucard |
| **WBNB** | Contract | Wrapped BNB | SafuPad |

### Development & Testing

| Dependency | Version | License | Purpose | Used In |
|------------|---------|---------|---------|---------|
| **ESLint** | 8.x | MIT | Code linting | All projects |
| **Prettier** | 3.x | MIT | Code formatting | All projects |
| **ts-node** | 10.x | MIT | TypeScript execution | Contract projects |
| **chai-as-promised** | 7.x | WTFPL | Async test assertions | SafuPad |

### SafuPad SDK Specific

| Dependency | Version | License | Purpose |
|------------|---------|---------|---------|
| **ethers** | 6.x | MIT | Core Ethereum library |
| **@ethersproject/*** | 5.x | MIT | Ethereum utilities |
| **TypeScript** | 5.x | Apache-2.0 | Type definitions |

### License Summary

The Safuverse ecosystem primarily uses **MIT-licensed** dependencies, ensuring maximum compatibility and freedom for both development and deployment. Key licenses include:

- **MIT License**: ~90% of dependencies (permissive, allows commercial use)
- **Apache-2.0**: TypeScript, Video.js (permissive with patent grant)
- **GPL-3.0**: Solidity compiler (copyleft, contracts are MIT)
- **ISC**: Lucide icons (permissive, similar to MIT)

All dependencies are compatible with the MIT license used by Safuverse projects.

### Dependency Management

**Package Managers:**
- **npm** - Primary package manager for most projects
- **yarn** - Alternative package manager (supported)
- **bun** - Fast alternative (some projects)

**Version Control:**
- Lock files (`package-lock.json`, `yarn.lock`) committed to repository
- Semantic versioning followed for dependencies
- Regular updates via Dependabot (recommended)

**Security:**
- Dependencies audited regularly with `npm audit`
- OpenZeppelin contracts used for security-critical code
- Chainlink oracles for reliable price data
- No known critical vulnerabilities in production

### External Services & APIs

| Service | Purpose | Used In | Website |
|---------|---------|---------|---------|
| **BSCScan API** | Contract verification | All contracts | https://bscscan.com |
| **Chainlink** | Price oracles | SafuPad, Safucard, SafuDomains | https://chain.link |
| **PancakeSwap** | DEX integration | SafuPad | https://pancakeswap.finance |
| **Pinata** | IPFS hosting | SafuAcademyy, Safucard | https://pinata.cloud |
| **OpenAI API** | AI agents | SafuAgents | https://openai.com |
| **Vercel** | Frontend hosting | All frontends | https://vercel.com |
| **BNB Chain RPC** | Blockchain access | All projects | https://bscscan.com |

### Installation Instructions

To install all dependencies for a specific project:

```bash
# Navigate to project directory
cd <project-directory>

# Install dependencies
npm install

# Or with yarn
yarn install

# Or with bun
bun install
```

For the entire monorepo (all projects):

```bash
# Install all dependencies (from root)
for dir in SafuPad SafuAcademy SafuDomains Safucard SafuAgents SafuLanding safupadsdk; do
  (cd "$dir" && npm install)
done
```

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update to latest within semver range
npm update

# Update to latest (potentially breaking)
npm install <package>@latest

# Security audit
npm audit
npm audit fix
```

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or writing tests, your help is appreciated.

**Quick Start:**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For detailed guidelines, please read our [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Individual projects also contain their own LICENSE files:

- [SafuPad/LICENSE](SafuPad/LICENSE)
- [SafuAcademy/LICENSE](SafuAcademy/LICENSE)
- [SafuDomains/LICENSE.txt](SafuDomains/LICENSE.txt)
- [Safucard/SafucardNFT/LICENSE](Safucard/SafucardNFT/LICENSE)
- [SafuAgents/LICENSE](SafuAgents/LICENSE)
- [SafuLanding/LICENSE](SafuLanding/LICENSE)
- [SafuPadSDK/LICENSE](SafuPadSDK/LICENSE)

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
