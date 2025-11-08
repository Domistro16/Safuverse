# SafuCourse (EduFi-contracts)

Decentralized educational platform **deployed on BNB Chain** with on-chain courses linked to domain ownership. This smart contract system enables gasless course enrollment and progress tracking through a backend relayer integration on BNB Smart Chain.

## Deployment Information

**Network**: BNB Chain (BNB Smart Chain)
- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97

**Live Production**: [academy.safuverse.com](https://academy.safuverse.com) - Running on BNB Chain

## Deployed Contracts (BSC Mainnet)

The following contracts are deployed on BNB Chain Mainnet (Chain ID: 56):

- **Course Factory**: `0xE796bc81c3F372237641998c24C755e710832bA9`
- **CourseContract/Level3Course**: `0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13`

## Configuration

The contracts are configured for BNB Chain deployment as specified in `hardhat.config.ts`:
```typescript
networks: {
  bsc: {
    chainId: 56,
    // BSC Mainnet configuration
  }
}
```

## Features

- **Gasless Transactions**: Zero gas fees for users through a backend relayer controlled by the owner on BNB Chain
- **Domain-Gated Access**: Only domain owners from the safudomains system (deployed on BSC) can enroll
- **On-Chain Progress**: Course completion tracked transparently on BNB Chain
- **Course Creation**: Deploy courses as individual smart contracts on BSC


## How It Works

1. Users must own a .safu domain from the safudomains system on BNB Chain
2. Course creators deploy courses via the CourseFactory contract
3. Domain owners enroll in courses without paying gas (relayer-enabled)
4. Progress is tracked on-chain on BNB Chain
5. All transactions verified on BSCScan

## Smart Contracts

### Main Contracts

- **CourseFactory.sol**: Deploys and manages course instances on BSC
- **Coursecontract.sol** (Level3Course): Individual course logic with enrollment and progress tracking

### Integration

- **IReverseRegistrar.sol**: Integration with safudomains DNS on BNB Chain

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Hardhat development environment
- MetaMask or compatible wallet
- **BNB Chain access** (testnet or mainnet)
- BNB tokens for deployment (testnet BNB from [BNB Chain Faucet](https://testnet.bnbchain.org/faucet-smart))

### Installation

```bash
git clone https://github.com/Level3AI-hub/Safuverse.git
cd Safuverse/SafuCourse
npm install
```

### Configuration

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Configure environment variables for BNB Chain:

```bash
# BNB Chain RPC URL
API_URL=https://bsc-dataseed.binance.org/  # BSC Mainnet
# or for testnet
API_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Deployment wallet
PRIVATE_KEY=your_private_key_here


# Contract configuration
OWNER_ADDRESS=your_wallet_address
```

**Important**: Fund your relayer wallet with BNB tokens on BSC mainnet or testnet BNB for testnet operations.

### Compile Contracts

```bash
npx hardhat compile
```

### Deploy to BNB Chain

Deploy to BSC Testnet:

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

Deploy to BSC Mainnet:

```bash
npx hardhat run scripts/deploy.ts --network bsc
```

### Verify Contracts on BSCScan

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Create a Course

Configure your course details and run:

```bash
npx hardhat run scripts/createCourse.ts --network bsc
```

## Usage

### Prerequisites for Course Enrollment

1. **Domain Ownership**: User must own a .safu domain from safudomains (deployed on BNB Chain)
2. **Funded Relayer**: Ensure your OpenZeppelin Defender relayer has BNB for gas
3. **Deployed Courses**: Course contracts must be deployed on BSC

### User Flow

1. User connects wallet to BNB Chain (BSC Mainnet)
2. User owns a .safu domain (verified on-chain)
3. User enrolls in course (gasless via relayer)
4. Progress tracked on BNB Chain
5. Completion certificates issued on-chain

## BNB Chain Configuration Details

### Hardhat Network Setup

The project is explicitly configured for BNB Chain in `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    bsc: {
      url: process.env.API_URL || "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY!],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
};
```

### Why BNB Chain?

- **Low Gas Costs**: Enables gasless transactions for users via affordable relayer operations
- **Fast Confirmations**: Quick enrollment and progress updates
- **BSC Ecosystem**: Integration with other Safuverse components (safudomains, safupad)
- **Proven Infrastructure**: Reliable network for educational platform operations

## Integration with Safuverse Ecosystem

SafuCourse integrates with other BNB Chain components:

- **safudomains**: Domain ownership verification on BSC
- **Safucard**: NFT scorecard integration
- **SafuAgents**: AI-powered course recommendations

All components deployed on BNB Chain for seamless interoperability.

## Frontend Application

The SafuCourse platform is live at [academy.safuverse.com](https://academy.safuverse.com), providing a user-friendly interface for course enrollment, progress tracking, and educational content delivery on BNB Chain.

### Frontend Status

The frontend application is **fully implemented** and operational. The `frontend/` directory contains the complete source code for the SafuCourse web application.

**Live Application**: [academy.safuverse.com](https://academy.safuverse.com)

### Frontend Technology Stack

The SafuCourse frontend is built with modern web technologies:

- **Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.2.11 for fast, modern development
- **Styling**: Tailwind CSS 3.3.3 with custom theming and animations
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Web3 Integration**:
  - **Wagmi v2.15.6**: React hooks for BNB Chain interactions
  - **RainbowKit v2.2.8**: Multi-wallet connection support with custom theming
  - **Ethers v5.8.0**: Contract interactions and utilities
  - **Viem v2.29.0**: TypeScript-first Ethereum library
  - **Binance W3W Connector**: Native Binance Web3 Wallet support
- **State Management**:
  - **TanStack Query v5.82.0**: Server state management and caching
  - React Context for application state
- **Media & Content**:
  - **Video.js v7.21**: Video player for course lessons
  - **Pinata SDK v2.4.9**: IPFS integration for content storage
- **Additional Libraries**:
  - **Framer Motion v10.16.4**: Smooth animations and transitions
  - **React Router DOM v6.16.0**: Client-side routing
  - **Lucide React**: Modern icon library

### Frontend Setup

The frontend source code is available in the `frontend/` directory. Follow these steps to set up and run the application locally:

#### Prerequisites

- Node.js 18+ (specified in `.nvmrc`)
- npm or yarn package manager
- A BNB Chain-compatible wallet (MetaMask, Binance Wallet, etc.)

#### Installation

```bash
# Navigate to frontend directory
cd SafuCourse/frontend

# Install dependencies
npm install
```

#### Environment Configuration

Create a `.env` file in the `frontend` directory based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

```bash
# Backend API Configuration
VITE_API_KEY=your_api_key_here
VITE_API_URL=your_backend_api_url_here

# Pinata IPFS Integration
VITE_PINATA_KEY=your_pinata_api_key_here
```

**Note**: The contract addresses and network configuration are hardcoded in `src/constants.ts`:
- **ERC2771 Forwarder**: `0xa579e4F7158826e4C0E6842779580f524bD6188C`
- **Level3Course Contract**: `0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13`
- **BNB Chain**: Chain ID 56 (BSC Mainnet)

#### Development Commands

```bash
# Start development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Available Scripts** (from `package.json`):
- `dev`: Start Vite development server with hot module replacement
- `build`: TypeScript compilation followed by Vite production build
- `preview`: Preview the production build locally

### Frontend Architecture

#### Project Structure

```
frontend/
├── src/
│   ├── components/              # React components
│   │   ├── ui/                 # Radix UI components (shadcn/ui)
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── Footer.tsx          # Page footer
│   │   ├── CourseCard.tsx      # Course display card
│   │   ├── CoursesSection.tsx  # Course listing section
│   │   ├── VideoPlayer.tsx     # Video.js player component
│   │   ├── CTASection.tsx      # Call-to-action section
│   │   ├── FaqSection.tsx      # FAQ accordion
│   │   ├── connectButton.tsx   # Custom wallet connect button
│   │   ├── walletModal.tsx     # Wallet connection modal
│   │   ├── useAvatar.tsx       # Avatar display component
│   │   └── ScrollToTop.tsx     # Scroll to top utility
│   ├── pages/                  # Route pages
│   │   ├── CoursesLandingPage.tsx  # Main landing page
│   │   ├── CourseListPage.tsx      # Course catalog
│   │   ├── CourseDetailPage.tsx    # Individual course view
│   │   └── LessonPage.tsx          # Lesson viewer with video
│   ├── hooks/                  # Custom React hooks
│   │   ├── getPrimaryName.ts   # Fetch user's primary domain
│   │   ├── progress.ts         # Course progress management
│   │   └── use-toast.ts        # Toast notifications
│   ├── lib/                    # Utility libraries
│   │   ├── constant.ts         # Application constants
│   │   ├── useWriteContractMeta.ts  # Meta-transaction helper
│   │   └── utils.ts            # Utility functions
│   ├── constants.ts            # Contract ABIs and addresses
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx                # Entry point with Wagmi/RainbowKit providers
│   ├── index.css               # Global styles and Tailwind imports
│   └── vite-env.d.ts           # Vite environment types
├── public/                     # Static assets
├── plugins/                    # Custom Vite plugins
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration with polyfills
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json          # TypeScript config for Node
├── components.json             # shadcn/ui configuration
├── vercel.json                 # Vercel deployment config
├── .nvmrc                      # Node version specification
└── package.json                # Dependencies and scripts
```

#### Contract Integration

The frontend interacts with deployed contracts on BNB Chain through `src/constants.ts`:

```typescript
// Contract configuration (from src/constants.ts)
export const ERC2771Forwarder = "0xa579e4F7158826e4C0E6842779580f524bD6188C";
export const Deploy = "0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13"; // Level3Course contract

// Contract ABI is exported in the same file
export const abi = [...]; // Full Level3Course ABI
```

The frontend uses Wagmi hooks for contract interactions:
- Read operations: `useReadContract` for fetching courses, progress, and enrollment status
- Write operations: Custom `useWriteContractMeta` hook for gasless meta-transactions via ERC2771Forwarder

#### Gasless Transaction Flow

The frontend implements gasless transactions using ERC2771 meta-transactions:

**Implementation** (from `src/lib/useWriteContractMeta.ts`):
1. User initiates an action (enroll, update progress) via the UI
2. Frontend creates a meta-transaction request with user's signature
3. Request is sent to backend relayer with the trusted forwarder address
4. Backend relayer submits the transaction on-chain, paying gas fees
5. User receives confirmation without paying gas

**Key Features**:
- Uses `eth-sig-util` for signature generation
- Supports multiple wallet types through RainbowKit
- Automatic network switching to BNB Chain
- Transaction status tracking with TanStack Query

### Key Frontend Features

#### 1. **Multi-Wallet Connection**
   - **RainbowKit Integration**: Supports MetaMask, Binance Wallet, Rainbow, Coinbase, WalletConnect
   - **Custom Theming**: Dark theme with orange accent color (#FF7000)
   - **Automatic Network Switching**: Defaults to BNB Chain (Chain ID 56)
   - **Session Sync**: Cross-domain session synchronization via iframe

#### 2. **Course Catalog** (CourseListPage.tsx)
   - Browse all available courses from on-chain data
   - View course details including title, description, instructor, and duration
   - Course cards display level, category, and enrollment count
   - Direct enrollment from catalog with domain verification

#### 3. **Course Detail Page** (CourseDetailPage.tsx)
   - Comprehensive course information display
   - Course objectives and prerequisites
   - Lesson list with completion status
   - Enrollment button with gasless transaction support
   - Domain ownership verification before enrollment

#### 4. **Video Learning Platform** (LessonPage.tsx)
   - **Video.js Player**: Professional video playback with quality selection
   - **IPFS Integration**: Content delivery via Pinata
   - Progress tracking per lesson
   - Automatic progress updates on lesson completion
   - Quiz integration support

#### 5. **Domain-Gated Access**
   - Verify .safu domain ownership via `getPrimaryName` hook
   - Automatic eligibility checking using safudomains reverse registrar
   - Gasless enrollment via ERC2771 meta-transactions
   - User points and achievement tracking

#### 6. **Progress Tracking**
   - Real-time on-chain progress updates
   - Lesson completion percentage
   - User points accumulation
   - Course completion certificates (on-chain verification)

### Deployment

#### Build for Production

```bash
cd SafuCourse/frontend
npm run build
```

The production build creates an optimized `dist/` folder with:
- **Code splitting**: Separate chunks for wagmi, RainbowKit, and Video.js
- **Asset optimization**: Minified CSS and JavaScript
- **Tree shaking**: Unused code elimination
- **TypeScript compilation**: Pre-build type checking

#### Deployment Configuration

The project includes a `vercel.json` configuration for Vercel deployment:

**Current Deployment**: [academy.safuverse.com](https://academy.safuverse.com)

**Deployment Steps**:
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard:
   - `VITE_API_KEY`
   - `VITE_API_URL`
   - `VITE_PINATA_KEY`
3. Deploy from the `SafuCourse/frontend` directory
4. Vercel automatically builds and deploys on push

**Alternative Deployment Options**:
- **Netlify**: Deploy the `dist/` folder
- **Cloudflare Pages**: Connect GitHub and deploy
- **AWS S3 + CloudFront**: Upload dist folder to S3 bucket
- **Traditional hosting**: Any static file server supporting SPA routing

### Integration with Safuverse Ecosystem

The SafuCourse frontend integrates with:

1. **safudomains** - Verify domain ownership for enrollment
2. **Safucard** - Issue NFT-based course certificates
3. **SafuAgents** - AI-powered course recommendations
4. **SafuLanding** - Ecosystem navigation and discovery

All integrations occur seamlessly on BNB Chain.

### Technical Highlights

**Vite Configuration** (`vite.config.ts`):
- **Node.js Polyfills**: Buffer and process polyfills for Web3 compatibility
- **Path Aliases**: `@/` alias for clean imports
- **Code Splitting**: Manual chunks for wagmi, RainbowKit, and Video.js
- **External Dependencies**: Babel packages excluded from bundle

**Tailwind Configuration** (`tailwind.config.js`):
- **Custom Fonts**: Gilroy font family (Regular, Bold, Medium, Light, Heavy)
- **Custom Animations**: Float, pulse-glow, accordion animations
- **Theme Extension**: Custom color system with HSL variables
- **Dark Mode**: Class-based dark mode support

**TypeScript Configuration**:
- **Target**: ES2020 with bundler module resolution
- **Strict Mode**: Enabled with unused locals/parameters checking
- **Path Mapping**: `@/*` resolves to `src/*`

### Troubleshooting

**Common Frontend Issues:**

1. **Wallet Connection Problems**
   - Ensure you have MetaMask or a compatible wallet installed
   - Check that your wallet is connected to BNB Chain (Chain ID: 56)
   - Try refreshing the page and reconnecting
   - Clear browser cache if connection persists failing

2. **Gasless Transactions Failing**
   - Verify backend relayer has sufficient BNB balance
   - Check that ERC2771Forwarder address is correct
   - Ensure meta-transaction signatures are properly generated
   - Confirm API_URL environment variable is set correctly

3. **Domain Verification Issues**
   - Confirm user owns a .safu domain on BNB Chain
   - Check safudomains reverse registrar integration
   - Verify the primary name is set for the wallet address
   - Use the `getPrimaryName` hook to debug domain lookup

4. **Video Playback Issues**
   - Ensure IPFS content is accessible via Pinata gateway
   - Check VITE_PINATA_KEY is configured correctly
   - Verify Video.js player loaded successfully
   - Check browser console for video loading errors

5. **Build/Development Errors**
   - Run `npm install` to ensure all dependencies are installed
   - Clear `node_modules` and reinstall if persistent errors
   - Check Node.js version matches `.nvmrc` (Node 18+)
   - Ensure TypeScript compilation succeeds before Vite build

## Technology Stack

### Backend (Smart Contracts)
- **Blockchain**: BNB Smart Chain (BSC) - Chain ID 56
- **Smart Contracts**: Solidity 0.8.28
- **Development Framework**: Hardhat 2.x
- **Meta-Transactions**: EIP-2771 (ERC2771Context)
- **Relayer**: Backend relayer with ERC2771Forwarder
- **Contract Libraries**: OpenZeppelin Contracts 5.3.0
- **Verification**: BSCScan
- **Testing**: Hardhat test suite

### Frontend (Web Application)
- **Framework**: React 18.2.0 with TypeScript 5.2.2
- **Build Tool**: Vite 5.2.11
- **Styling**: Tailwind CSS 3.3.3 + PostCSS
- **UI Components**: Radix UI + shadcn/ui
- **Web3 Libraries**:
  - Wagmi 2.15.6 (React hooks)
  - Viem 2.29.0 (Ethereum library)
  - Ethers 5.8.0 (utilities)
  - RainbowKit 2.2.8 (wallet connection)
- **State Management**: TanStack Query 5.82.0
- **Routing**: React Router DOM 6.16.0
- **Animation**: Framer Motion 10.16.4
- **Media**: Video.js 7.21
- **Storage**: Pinata SDK 2.4.9 (IPFS)
- **Deployment**: Vercel (live at academy.safuverse.com)

## Network Information

### BSC Mainnet
- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **Native Token**: BNB

### BSC Testnet
- **Chain ID**: 97
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

## Testing

Run contract tests:

```bash
npx hardhat test
```

Run with gas reporting:

```bash
REPORT_GAS=true npx hardhat test
```

## Project Structure

```
SafuCourse/
├── contracts/                      # Smart contracts
│   ├── CourseFactory.sol          # Course deployment factory
│   ├── Coursecontract.sol         # Main course logic (Level3Course)
│   ├── ILevel3Course.sol          # Course interface
│   ├── INameResolver.sol          # safudomains DNS integration
│   ├── ENS.sol                    # ENS registry integration
│   └── IReverseRegistrar.sol      # Reverse registrar integration
├── frontend/                       # React web application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Route pages
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility libraries
│   │   ├── constants.ts          # Contract ABIs and addresses
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # Entry point
│   ├── public/                   # Static assets
│   ├── vite.config.ts            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   ├── tsconfig.json             # TypeScript config
│   ├── package.json              # Frontend dependencies
│   └── .env.example              # Environment variables template
├── scripts/
│   ├── deploy.ts                 # Smart contract deployment to BSC
│   └── createCourse.ts           # Course creation script
├── test/                          # Smart contract tests
├── hardhat.config.ts              # Hardhat & BSC network configuration
├── package.json                   # Backend dependencies
└── README.md                      # This file
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test on BSC Testnet
4. Submit a pull request

## Security

- Contracts use OpenZeppelin security libraries
- Meta-transaction validation prevents replay attacks
- Access control restricts admin functions
- Domain ownership verified on-chain

For security issues, contact: [info@level3labs.fun](mailto:info@level3labs.fun)

## License

MIT License

## Support

- **Email**: [info@level3labs.fun](mailto:info@level3labs.fun)
- **Issues**: [GitHub Issues](https://github.com/Level3AI-hub/Safuverse/issues)
- **Documentation**: [BNB Chain Docs](https://docs.bnbchain.org)

---

**Deployed on BNB Chain** - Delivering gasless, domain-gated education on BNB Smart Chain.
