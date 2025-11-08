# SafuCourse (EduFi-contracts)

Decentralized educational platform **deployed on BNB Chain** with on-chain courses linked to domain ownership. This smart contract system enables gasless course enrollment and progress tracking through OpenZeppelin Defender relayer integration on BNB Smart Chain.

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

- **Gasless Transactions**: Zero gas fees for users through OpenZeppelin Defender relayer on BNB Chain
- **Domain-Gated Access**: Only domain owners from the safudomains system (deployed on BSC) can enroll
- **On-Chain Progress**: Course completion tracked transparently on BNB Chain
- **Course Creation**: Deploy courses as individual smart contracts on BSC
- **Meta-Transactions**: EIP-2771 compliant for gasless user experience

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
- **ERC2771Context.sol**: Meta-transaction support for gasless operations
- **Ownable.sol**: Access control

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

# OpenZeppelin Defender (for gasless transactions on BSC)
API_KEY=your_defender_api_key
API_SECRET=your_defender_api_secret
RELAYER_API_KEY=  # Generated in setup
RELAYER_API_SECRET=  # Generated in setup

# Contract configuration
OWNER_ADDRESS=your_wallet_address
FORWARDER_ADDRESS=  # Generated after deployment
ACTION_ID=  # Generated in setup
```

### Setup OpenZeppelin Defender Relayer for BNB Chain

1. Create API credentials at [OpenZeppelin Defender](https://defender.openzeppelin.com/v2/#/settings/api-keys/new)

2. Generate relayer (configured for BNB Chain):

```bash
yarn create-relayer
```

This creates a relayer specifically for BNB Chain transactions and updates your `.env` file automatically.

**Important**: Fund your relayer with BNB tokens on BSC mainnet or testnet BNB for testnet operations.

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

After deployment, copy the Forwarder Address to your `.env` file.

### Verify Contracts on BSCScan

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Create Defender Action

Set up the gasless transaction action on BNB Chain:

```bash
yarn create-action
```

Then visit [Defender Actions](https://defender.openzeppelin.com/v2/#/actions/automatic) to:
1. Copy the webhook URL
2. Ensure it's configured for BNB Chain network
3. Save the webhook for your frontend integration

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

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)
- **Smart Contracts**: Solidity 0.8.28
- **Development**: Hardhat 2.x
- **Meta-Transactions**: EIP-2771 (ERC2771Context)
- **Relayer**: OpenZeppelin Defender (BSC network)
- **Libraries**: OpenZeppelin Contracts 5.3.0
- **Verification**: BSCScan

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
│   ├── ERC2771Context.sol      # Meta-transaction support
│   ├── Ownable.sol             # Access control
│   └── IReverseRegistrar.sol   # DNS integration
├── scripts/
│   ├── deploy.ts               # Deployment to BSC
│   ├── createCourse.ts         # Course creation
│   ├── create-relayer.ts       # Setup Defender relayer
│   └── create-action.ts        # Setup gasless actions
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
