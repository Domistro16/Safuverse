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

The frontend application is currently deployed and operational. The `frontend/` directory in this repository is reserved for future frontend source code integration.

**Live Application**: [academy.safuverse.com](https://academy.safuverse.com)

### Expected Frontend Technology Stack

Based on the Safuverse ecosystem architecture, the frontend is expected to include:

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 5.x for modern, fast development
- **Styling**: Tailwind CSS with custom theming
- **Web3 Integration**:
  - **Wagmi v2**: React hooks for BNB Chain interactions
  - **RainbowKit**: Multi-wallet connection support
  - **Ethers/Viem**: Smart contract interactions
- **State Management**:
  - TanStack Query (React Query) for server state
  - React Context for application state
- **Backend Integration**:
  - REST API for course content and user data
  - OpenZeppelin Defender relayer for gasless transactions
  - GraphQL (optional) for complex data queries

### Frontend Setup (When Available)

Once the frontend source code is added to this repository, follow these steps:

#### Installation

```bash
# Navigate to frontend directory
cd SafuCourse/frontend

# Install dependencies
npm install
# or
bun install
```

#### Environment Configuration

Create a `.env` file in the `frontend` directory:

```bash
# Backend API Configuration
VITE_API_URL=https://api.safuverse.com/courses

# OpenZeppelin Defender Relayer (for gasless transactions)
VITE_RELAYER_URL=your_defender_relayer_url
VITE_RELAYER_API_KEY=your_relayer_api_key

# Contract Addresses (BNB Chain)
VITE_COURSE_FACTORY_ADDRESS=0xE796bc81c3F372237641998c24C755e710832bA9
VITE_LEVEL3_COURSE_ADDRESS=0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13

# safudomains Integration
VITE_DNS_REGISTRY_ADDRESS=0x6aEFc7ac590096c08187a9052030dA59dEd7E996
VITE_DNS_RESOLVER_ADDRESS=0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357

# WalletConnect Project ID
VITE_WC_PROJECT_ID=your_walletconnect_project_id

# Web3Auth (for social login)
VITE_WEB3AUTH_CLIENT_ID=your_web3auth_client_id

# Analytics (optional)
VITE_ANALYTICS_ID=your_analytics_id
```

#### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Frontend Architecture

#### Expected Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── courses/        # Course-related components
│   │   ├── enrollment/     # Enrollment flow
│   │   ├── progress/       # Progress tracking
│   │   └── common/         # Shared UI components
│   ├── hooks/              # Custom React hooks
│   │   ├── useCourses.ts  # Course data hooks
│   │   ├── useEnrollment.ts
│   │   └── useRelayer.ts  # Gasless transaction hooks
│   ├── lib/                # Utility libraries
│   │   ├── contracts.ts   # Contract ABIs and addresses
│   │   └── relayer.ts     # Defender relayer integration
│   ├── pages/              # Route pages
│   │   ├── Courses.tsx    # Course catalog
│   │   ├── CourseDetail.tsx
│   │   ├── Dashboard.tsx  # User dashboard
│   │   └── Profile.tsx    # User profile
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point with providers
│   └── wagmi.config.ts     # Wagmi/RainbowKit setup
├── public/                 # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

#### Contract Integration

The frontend will interact with deployed contracts on BNB Chain:

```typescript
// Expected contract configuration
export const contracts = {
  courseFactory: {
    address: '0xE796bc81c3F372237641998c24C755e710832bA9',
    abi: CourseFactoryABI,
    chainId: 56, // BSC Mainnet
  },
  level3Course: {
    address: '0xD0cB04cB20Dff62E26b7069B95Fa9fF3D4694d13',
    abi: Level3CourseABI,
    chainId: 56,
  },
}
```

#### Gasless Transaction Flow

The frontend implements gasless transactions using OpenZeppelin Defender:

```typescript
// Simplified gasless enrollment flow
async function enrollInCourse(courseId: string) {
  // 1. User signs enrollment request (no gas required)
  const signature = await signTypedData(enrollmentParams)

  // 2. Send to relayer backend
  const response = await fetch(RELAYER_URL, {
    method: 'POST',
    body: JSON.stringify({ signature, params: enrollmentParams })
  })

  // 3. Relayer submits transaction on-chain
  // 4. User receives confirmation without paying gas
}
```

### Key Frontend Features

1. **Course Catalog**
   - Browse available courses on BNB Chain
   - Filter by category, difficulty, and duration
   - View course details and prerequisites

2. **Domain-Gated Enrollment**
   - Verify .safu domain ownership
   - Automatic eligibility checking
   - Gasless enrollment via relayer

3. **Progress Tracking**
   - Real-time on-chain progress updates
   - Lesson completion tracking
   - Achievement badges and certificates

4. **User Dashboard**
   - View enrolled courses
   - Track learning progress
   - Access course materials
   - Download certificates (NFT-based)

5. **Wallet Integration**
   - Multi-wallet support (MetaMask, Binance Wallet, etc.)
   - BNB Chain network auto-switching
   - Domain ownership verification

### Deployment

#### Build for Production

```bash
npm run build
```

The production build will be optimized for:
- Code splitting
- Asset optimization
- Tree shaking
- Minification

#### Deployment Options

Deploy the built `dist/` folder to:

- **Vercel** (recommended for Next.js/Vite apps)
  ```bash
  vercel --prod
  ```

- **Netlify**
  ```bash
  netlify deploy --prod
  ```

- **AWS S3 + CloudFront**
- **Cloudflare Pages**
- **Traditional hosting** (any static file server)

### Integration with Safuverse Ecosystem

The SafuCourse frontend integrates with:

1. **safudomains** - Verify domain ownership for enrollment
2. **Safucard** - Issue NFT-based course certificates
3. **SafuAgents** - AI-powered course recommendations
4. **SafuLanding** - Ecosystem navigation and discovery

All integrations occur seamlessly on BNB Chain.

### Development Roadmap

Planned frontend features:

- [ ] Advanced course progress analytics
- [ ] Social features (discussion forums, study groups)
- [ ] NFT certificate marketplace
- [ ] Course creator dashboard
- [ ] Video streaming integration
- [ ] Mobile app (React Native)

### Troubleshooting

**Common Issues:**

1. **Gasless transactions failing**
   - Verify relayer has sufficient BNB balance
   - Check OpenZeppelin Defender configuration
   - Ensure meta-transaction signatures are valid

2. **Domain verification not working**
   - Confirm user owns a .safu domain
   - Check safudomains contract integration
   - Verify resolver is set correctly

3. **Network connection issues**
   - Ensure wallet is connected to BNB Chain (Chain ID: 56)
   - Try switching networks manually
   - Clear wallet cache and reconnect

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)
- **Smart Contracts**: Solidity 0.8.28
- **Development**: Hardhat 2.x
- **Meta-Transactions**: EIP-2771 (ERC2771Context)
- **Relayer**: OpenZeppelin Defender (BSC network)
- **Libraries**: OpenZeppelin Contracts 5.3.0
- **Verification**: BSCScan
- **Frontend**: React 18+ with TypeScript, Vite, Wagmi (deployed separately)

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
├── contracts/
│   ├── CourseFactory.sol       # Course deployment factory
│   ├── Coursecontract.sol      # Main course logic
│   ├── ILevel3Course.sol       # Interface
│   ├── INameResolver.sol       # DNS integration
│   ├── ENS.sol                 # DNS integration
│   └── IReverseRegistrar.sol   # DNS integration
├── scripts/
│   ├── deploy.ts               # Deployment to BSC
│   ├── createCourse.ts         # Course creation
├── test/                       # Contract tests
├── hardhat.config.ts           # BSC network configuration
└── package.json
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
