# safupad-contracts - Token Launchpad Platform

Smart contract system for fair token launches **deployed on BNB Chain** (BNB Smart Chain). Features bonding curve mechanics, automatic PancakeSwap integration, and two launch modes: Project Raise and Instant Launch.

## Deployment Information

**Primary Network**: BNB Chain (BNB Smart Chain)

- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97

All contracts are designed specifically for deployment on BNB Chain, leveraging PancakeSwap V2 for automatic liquidity provision and BNB as the base trading pair.

## Overview

safupad is a decentralized token launchpad platform on BNB Chain that provides:

- **Fair Launch Mechanisms**: Two launch modes for different project needs
- **Bonding Curve DEX**: Dynamic pricing based on supply
- **Automatic Graduation**: Seamless migration to PancakeSwap on BSC
- **Anti-Bot Protection**: Built-in safeguards against manipulation
- **BNB-Denominated Launches**: All token launches priced in BNB

## Features

### Two Launch Modes

#### 1. Project Raise (Fixed-Price Sale)

- 24-hour contribution period
- Fixed token price in BNB
- Minimum/maximum contribution limits
- Refunds if targets not met
- Automatic PancakeSwap listing after raise

#### 2. Instant Launch (Bonding Curve)

- Immediate trading on bonding curve DEX
- Dynamic pricing based on supply
- 10% → 1-2% fee schedule
- Graduates to PancakeSwap at 15 BNB threshold
- Real-time price discovery

### PancakeSwap Integration on BSC

Automatic graduation to PancakeSwap V2 when conditions met:

- Liquidity pool created on PancakeSwap (BSC)
- LP tokens locked for security
- 1% platform fee on graduation
- Seamless transition from bonding curve to AMM

### Token Vesting

- Founder tokens vested over time
- On-chain vesting schedule
- Transparent unlock periods

## Smart Contracts

### Core Contracts

#### LaunchpadManagerV2.sol (LaunchpadManagerV3)

Main launchpad coordinator deployed on BNB Chain.

**Key Functions**:

- `createProjectRaise()` - Create fixed-price raise
- `createInstantLaunch()` - Deploy bonding curve launch
- `contribute()` - Participate in raises (pay with BNB)
- `claimTokens()` - Claim purchased tokens
- `graduateToPancakeSwap()` - Migrate to PancakeSwap on BSC

**Features**:

- BNB-based contributions (50-500 BNB ranges)
- Integration with PancakeSwap Router on BSC
- Platform fee collection (1%)
- Emergency pause functionality

#### BondingDEX.sol (BondingCurveDEX)

Bonding curve automated market maker on BNB Chain.

**Bonding Curve Formula**:

```
price = basePrice + (currentSupply * priceIncrement)
```

**Fee Schedule**:

- Initial: 10%
- Gradual reduction to 1-2%
- Dynamic based on volume
- Fees collected in BNB

**Graduation Threshold**: 15 BNB in liquidity triggers PancakeSwap migration

#### TokenFactoryV2.sol

ERC20 token factory for launched tokens on BSC.

**Creates**: LaunchpadTokenV2 instances

- Standard ERC20 with transfer locks
- Unlock after raise completion
- Metadata and branding support

#### LPFeeHarvester.sol

LP token management and fee harvesting on BSC.

**Features**:

- Locks PancakeSwap LP tokens
- Harvests trading fees
- Distributes rewards to platform

#### PriceOracle.sol

Chainlink integration for BNB/USD pricing on BSC.

**Purpose**:

- USD-denominated pricing converted to BNB
- Uses Chainlink BNB/USD feed on BNB Chain
- Accurate price discovery for launches

## Deployed Contracts

### BSC Testnet (Unverified)

- **LaunchpadManager**: `0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c`
- **BondingCurveDEX**: `0x14eB3B6C297ff6fefc25c0E0d289Bf8348e864f6`
- **TokenFactory**: `0xcb7526b9598240A737237C52f852705e6A449cD0`
- **PriceOracle**: `0x56f0b1f80F8cc37f875Be42e2f4D09810514F346`
- **LPFeeHarvester**: `0xa886B8897814193f99A88701d70b31b4a8E27a1E`

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)
- **Solidity**: 0.8.28
- **Framework**: Hardhat 3.0.7 (Beta)
- **Testing**: Mocha, Chai, Hardhat Chai Matchers
- **Libraries**: OpenZeppelin Contracts 5.4.0
- **DEX**: PancakeSwap V2 on BSC
- **Price Feeds**: Chainlink oracles on BSC
- **Verification**: BSCScan

## Getting Started

### Prerequisites

- Node.js 18+
- Hardhat 3.x
- BNB Chain wallet with testnet/mainnet BNB
- BSCScan API key for verification

### Installation

```bash
cd safupad-contracts
npm install
```

### Environment Configuration

Create `.env` file:

```bash
# BNB Chain Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Deployer Wallet
PRIVATE_KEY=your_private_key_here

# BSCScan Verification
BSCSCAN_API_KEY=your_bscscan_api_key

# PancakeSwap Addresses on BSC
PANCAKE_ROUTER=0x10ED43C718714eb63d5aA57B78B54704E256024E  # BSC Mainnet
PANCAKE_FACTORY=0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73  # BSC Mainnet

# Chainlink Price Feed on BSC
BNB_USD_ORACLE=chainlink_bnb_usd_feed_address_on_bsc

# Platform Configuration
PLATFORM_FEE_RECIPIENT=your_fee_collection_address
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

Run Solidity tests only:

```bash
npx hardhat test solidity
```

Run TypeScript tests only:

```bash
npx hardhat test mocha
```

### Run Tests with Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

## Deployment to BNB Chain

### Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

### Deploy to BSC Mainnet

```bash
npx hardhat run scripts/deploy.ts --network bsc
```

### Verify on BSCScan

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Hardhat Configuration

The project uses Hardhat 3 Beta with BNB Chain networks configured:

```typescript
// hardhat.config.ts
networks: {
  bsc: {
    url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
    chainId: 56,
    accounts: [process.env.PRIVATE_KEY!],
  },
  bscTestnet: {
    url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
    chainId: 97,
    accounts: [process.env.PRIVATE_KEY!],
  },
}
```

## Usage Examples

### Create Project Raise

```javascript
const tx = await launchpadManager.createProjectRaise(
  "MyToken",
  "MTK",
  ethers.parseEther("50"), // 50 BNB goal
  ethers.parseEther("0.01"), // Min contribution
  ethers.parseEther("5"), // Max contribution
  tokenAmount,
  founderAmount,
  vestingSchedule
);
```

### Create Instant Launch

```javascript
const tx = await launchpadManager.createInstantLaunch(
  "MyToken",
  "MTK",
  ethers.parseEther("0.001"), // Base price in BNB
  ethers.parseEther("0.0001"), // Price increment
  tokenAmount,
  founderAmount,
  vestingSchedule
);
```

### Contribute to Raise

```javascript
const tx = await launchpadManager.contribute(launchId, {
  value: ethers.parseEther("1"), // 1 BNB contribution
});
```

### Buy on Bonding Curve

```javascript
const tx = await bondingDEX.buy(launchId, minTokensOut, {
  value: ethers.parseEther("0.5"), // 0.5 BNB
});
```

### Graduate to PancakeSwap

Once 15 BNB liquidity threshold is reached:

```javascript
const tx = await launchpadManager.graduateToPancakeSwap(launchId);
```

This creates a PancakeSwap V2 pair on BSC and migrates liquidity.

## PancakeSwap Integration Details

### Automatic Liquidity Migration

When a launch graduates:

1. Bonding curve liquidity withdrawn
2. PancakeSwap pair created (Token/WBNB)
3. Liquidity added to PancakeSwap on BSC
4. LP tokens locked via LPFeeHarvester
5. Trading continues on PancakeSwap

### LP Token Locking

- LP tokens locked for minimum period
- Harvester collects PancakeSwap trading fees
- Fees distributed to platform and project

## Security Features

1. **Reentrancy Protection**: OpenZeppelin ReentrancyGuard
2. **Access Control**: Ownable and role-based permissions
3. **Pause Mechanism**: Emergency pause functionality
4. **Price Oracle Validation**: Chainlink integration for accurate BNB/USD
5. **Transfer Locks**: Tokens locked during raise period
6. **Vesting Enforcement**: On-chain vesting for founder tokens

## Gas Optimization

Contracts optimized for BSC's gas model:

- Efficient storage patterns
- Batch operations where possible
- Optimized for 10000 runs

Estimated gas costs on BSC (very affordable):

- Create Launch: ~2-3M gas
- Contribute: ~150K gas
- Buy on Curve: ~200K gas
- Graduate to PancakeSwap: ~500K gas

## Testing on BSC Testnet

1. Get testnet BNB from [faucet](https://testnet.bnbchain.org/faucet-smart)
2. Deploy contracts to BSC Testnet
3. Test with testnet PancakeSwap addresses
4. Verify on testnet.bscscan.com

## Network Information

### BSC Mainnet

- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **PancakeSwap Router**: 0x10ED43C718714eb63d5aA57B78B54704E256024E
- **PancakeSwap Factory**: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73

### BSC Testnet

- **Chain ID**: 97
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

## Integration with Safuverse

safupad integrates with other Safuverse components on BNB Chain:

- **safudomains**: Enhanced launch permissions for .safu domain holders
- **SafuCourse**: Token economics education courses
- **Safucard**: Project scorecard NFTs
- **SafuAgents**: AI-powered launch analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Test on BSC Testnet
5. Submit a pull request

## Hardhat 3 Beta Features

This project uses Hardhat 3 Beta:

- Improved TypeScript support
- Better error messages
- Enhanced testing capabilities
- Faster compilation

Learn more: [Hardhat 3 Beta Guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3)

Feedback: [Hardhat 3 Beta Telegram](https://hardhat.org/hardhat3-beta-telegram-group)

## License

MIT License

## Support

- **Email**: info@level3labs.fun
- **GitHub Issues**: For bug reports and feature requests
- **BNB Chain Docs**: https://docs.bnbchain.org
- **PancakeSwap Docs**: https://docs.pancakeswap.finance

---

**Deployed on BNB Chain and Powered by .safu** - Fair token launches with bonding curves and automatic PancakeSwap integration on BNB Smart Chain.
