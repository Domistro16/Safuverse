# SafuPad SDK

A comprehensive TypeScript SDK for interacting with SafuPad smart contracts **deployed on BNB Chain** (BNB Smart Chain - BSC).

## Deployment Information

**Primary Network**: BNB Smart Chain (BSC)
- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97

This SDK provides TypeScript/JavaScript bindings for the SafuPad token launchpad platform deployed on BNB Chain, enabling developers to integrate fair token launches, bonding curve trading, and PancakeSwap graduation features into their applications.

## Features

- 🔐 **Type-safe** - Full TypeScript support with comprehensive types
- 🎯 **Easy to use** - Simple, intuitive API
- ⚡ **Fast** - Optimized for performance
- 🌐 **Multi-network** - Support for BSC Mainnet, Testnet, and localhost
- 🔌 **Flexible** - Works in Node.js and browsers
- 📊 **Complete** - All contract functions wrapped with helpers
- 🎨 **Event handling** - Easy event listening and filtering
- 🛡️ **Error handling** - Comprehensive error types and messages
- 📈 **Volume Tracking** - Built-in 24h volume and trading analytics

## Installation

```bash
npm install @safupad/sdk ethers
# or
yarn add @safupad/sdk ethers
# or
pnpm add @safupad/sdk ethers
```

## Quick Start

### Browser (React/Vue/etc)

```typescript
import { SafuPadSDK } from '@safupad/sdk';

// Initialize SDK with MetaMask or other injected provider
const sdk = new SafuPadSDK({
  network: 'bsc',
  provider: window.ethereum,
});

await sdk.initialize();

// Connect wallet
const address = await sdk.connect();
console.log('Connected:', address);

// Buy tokens
const tx = await sdk.bondingDex.buyTokens('0x...', '0.1');
await tx.wait();
```

### Node.js (Backend/Scripts)

```typescript
import { SafuPadSDK } from '@safupad/sdk';

const sdk = new SafuPadSDK({
  network: 'bscTestnet',
  privateKey: process.env.PRIVATE_KEY,
});

await sdk.initialize();

// Create a launch - ✅ UPDATED: No projectInfoFiWallet needed
const tx = await sdk.launchpad.createLaunch({
  name: 'MyToken',
  symbol: 'MTK',
  totalSupply: 1000000000,
  raiseTargetBNB: '50', // ✅ NEW: BNB amounts instead of USD
  raiseMaxBNB: '100', // ✅ NEW: BNB amounts instead of USD
  vestingDuration: 90,
  metadata: {
    logoURI: 'https://example.com/logo.png',
    description: 'My awesome token',
    website: 'https://mytoken.com',
    twitter: 'https://twitter.com/mytoken',
    telegram: 'https://t.me/mytoken',
    discord: 'https://discord.gg/mytoken',
  },
  burnLP: false, // true to burn LP, false to lock in harvester
});

await tx.wait();
```

## 🚨 Breaking Changes v2.0.0

### Removed `projectInfoFiWallet` Parameter

**Before (v1.x):**

```typescript
await sdk.launchpad.createLaunch({
  // ...
  projectInfoFiWallet: '0x...', // ❌ No longer needed
  // ...
});
```

**After (v2.x):**

```typescript
await sdk.launchpad.createLaunch({
  // ...
  // projectInfoFiWallet removed - uses global InfoFi address
  // ...
});
```

### Changed to BNB-Based Raises

**Before (v1.x):**

```typescript
await sdk.launchpad.createLaunch({
  raiseTargetUSD: '50000', // ❌ USD amounts
  raiseMaxUSD: '100000', // ❌ USD amounts
  // ...
});
```

**After (v2.x):**

```typescript
await sdk.launchpad.createLaunch({
  raiseTargetBNB: '50', // ✅ BNB amounts (50-500 BNB)
  raiseMaxBNB: '100', // ✅ BNB amounts
  // ...
});
```

### Updated Launch Info

**Before (v1.x):**

```typescript
const info = await sdk.launchpad.getLaunchInfo(tokenAddress);
console.log(info.projectInfoFiWallet); // ❌ No longer exists
```

**After (v2.x):**

```typescript
const info = await sdk.launchpad.getLaunchInfo(tokenAddress);
// projectInfoFiWallet removed - managed globally by platform
console.log(info.burnLP); // ✅ Still available
```

## Core Concepts

### SDK Instance

The main entry point for all SafuPad interactions:

```typescript
const sdk = new SafuPadSDK({
  network: 'bsc' | 'bscTestnet' | 'localhost',
  provider?: string | Provider | BrowserProvider,
  privateKey?: string,
});

await sdk.initialize();
```

### Contract Modules

The SDK exposes five main contract modules:

- **`sdk.launchpad`** - LaunchpadManager interactions
- **`sdk.bondingDex`** - BondingCurveDEX trading & volume analytics
- **`sdk.tokenFactory`** - Token creation
- **`sdk.priceOracle`** - Price feeds
- **`sdk.lpHarvester`** - LP lock and fee harvesting

## API Reference

### LaunchpadManager

#### Create Project Raise

```typescript
// ✅ UPDATED: No projectInfoFiWallet, uses BNB amounts
const tx = await sdk.launchpad.createLaunch({
  name: 'MyToken',
  symbol: 'MTK',
  totalSupply: 1000000000, // 1 billion
  raiseTargetBNB: '50', // ✅ Minimum 50 BNB
  raiseMaxBNB: '100', // ✅ Maximum 500 BNB
  vestingDuration: 90, // days (90-180)
  metadata: {
    logoURI: 'https://example.com/logo.png',
    description: 'My awesome token',
    website: 'https://mytoken.com',
    twitter: '@mytoken',
    telegram: '@mytoken',
    discord: 'discord.gg/mytoken',
  },
  burnLP: false, // false = lock in harvester, true = burn permanently
  vanitySalt: '0x...', // optional vanity address
});
```

**Parameters:**

- `raiseTargetBNB`: String - Minimum raise target (50-500 BNB)
- `raiseMaxBNB`: String - Maximum raise cap (50-500 BNB)
- `burnLP`: Boolean - `true` burns LP permanently, `false` locks in fee harvester
- ~~`projectInfoFiWallet`~~ - Removed, uses global InfoFi address

#### Create Instant Launch

```typescript
const tx = await sdk.launchpad.createInstantLaunch({
  name: 'MemeToken',
  symbol: 'MEME',
  totalSupply: 1000000000,       // must be 1 billion
  metadata: {...},
  initialBuyBNB: '0.1',          // Initial buy amount
  burnLP: true,                   // Burn LP on graduation
  vanitySalt: '0x...',           // optional
});
```

#### Contribute to Raise

```typescript
const tx = await sdk.launchpad.contribute(
  tokenAddress,
  '0.5' // BNB amount
);
```

#### Get Launch Info

```typescript
// ✅ UPDATED: No longer includes projectInfoFiWallet
const info = await sdk.launchpad.getLaunchInfo(tokenAddress);
console.log('Founder:', info.founder);
console.log('Raised:', sdk.formatBNB(info.totalRaised));
console.log('Target:', sdk.formatBNB(info.raiseTarget));
console.log('Completed:', info.raiseCompleted);
console.log('Graduated:', info.graduatedToPancakeSwap);
console.log('LP Burned:', info.burnLP);
```

**Returns:**

```typescript
{
  founder: string;
  raiseTarget: bigint;
  raiseMax: bigint;
  totalRaised: bigint;
  raiseDeadline: bigint;
  raiseCompleted: boolean;
  graduatedToPancakeSwap: boolean;
  raisedFundsVesting: bigint;
  raisedFundsClaimed: bigint;
  launchType: LaunchType;
  burnLP: boolean;
  // ❌ projectInfoFiWallet removed
}
```

#### Get Launch Info with USD

```typescript
// ✅ Provides both BNB and USD values
const info = await sdk.launchpad.getLaunchInfoWithUSD(tokenAddress);
console.log('Target BNB:', sdk.formatBNB(info.raiseTargetBNB));
console.log('Target USD:', sdk.formatBNB(info.raiseTargetUSD));
console.log('Raised BNB:', sdk.formatBNB(info.totalRaisedBNB));
console.log('Raised USD:', sdk.formatBNB(info.totalRaisedUSD));
```

#### Claim Founder Rewards

```typescript
// Check claimable amounts
const amounts = await sdk.launchpad.getClaimableAmounts(tokenAddress);

// Claim vested tokens
if (amounts.claimableTokens > 0n) {
  const tx = await sdk.launchpad.claimFounderTokens(tokenAddress);
  await tx.wait();
}

// Claim vested BNB
if (amounts.claimableFunds > 0n) {
  const tx = await sdk.launchpad.claimRaisedFunds(tokenAddress);
  await tx.wait();
}
```

**Note:** If token price drops below starting market cap:

- Tokens to be released are burned
- Raised funds go to global InfoFi address for redistribution

#### Graduate to PancakeSwap

```typescript
// Token graduates at 15 BNB in bonding curve
const tx = await sdk.launchpad.graduateToPancakeSwap(tokenAddress);
await tx.wait();
```

### BondingCurveDEX

#### Buy Tokens

```typescript
// Get quote first
const quote = await sdk.bondingDex.getBuyQuote(tokenAddress, '0.1');
console.log('You will receive:', sdk.formatToken(quote.tokensOut));

// Buy with 1% slippage tolerance
const tx = await sdk.bondingDex.buyTokens(
  tokenAddress,
  '0.1', // BNB amount
  1 // slippage %
);
await tx.wait();
```

#### Sell Tokens

```typescript
// Get quote
const quote = await sdk.bondingDex.getSellQuote(tokenAddress, '1000');
console.log('You will receive:', sdk.formatBNB(quote.tokensOut), 'BNB');

// Sell with 1% slippage
const tx = await sdk.bondingDex.sellTokens(
  tokenAddress,
  '1000', // token amount
  1 // slippage %
);
```

#### Get Pool Info

```typescript
const pool = await sdk.bondingDex.getPoolInfo(tokenAddress);
console.log('Market Cap USD:', sdk.formatBNB(pool.marketCapUSD));
console.log('Market Cap BNB:', sdk.formatBNB(pool.marketCapBNB));
console.log('BNB Reserve:', sdk.formatBNB(pool.bnbReserve));
console.log('Token Reserve:', sdk.formatToken(pool.tokenReserve));
console.log('Current Price:', sdk.formatBNB(pool.currentPrice));
console.log('Graduation:', Number(pool.graduationProgress), '%');
console.log('Graduated:', pool.graduated);
```

**Graduation Threshold:**

- All tokens graduate at **15 BNB** in bonding curve
- Both PROJECT_RAISE and INSTANT_LAUNCH use same threshold

#### Get Fee Information

```typescript
const feeInfo = await sdk.bondingDex.getFeeInfo(tokenAddress);
console.log('Current fee:', Number(feeInfo.currentFeeRate) / 100, '%');
console.log('Fee stage:', feeInfo.feeStage);
console.log('Blocks until next tier:', feeInfo.blocksUntilNextTier);
```

**Fee Schedule:**

- **Blocks 0-20**: 10% (anti-bot)
- **Blocks 21-50**: 6%
- **Blocks 51-100**: 4%
- **After block 100**: 1% (PROJECT_RAISE) or 2% (INSTANT_LAUNCH)
- **Post-graduation**: 2%

#### Volume Analytics

```typescript
// Get 24h trading volume
const volume24h = await sdk.bondingDex.get24hVolume(tokenAddress);
console.log('24h Volume:', sdk.formatBNB(volume24h.totalVolumeBNB), 'BNB');
console.log('Buy Volume:', sdk.formatBNB(volume24h.totalBuyVolumeBNB));
console.log('Sell Volume:', sdk.formatBNB(volume24h.totalSellVolumeBNB));
console.log('Total Trades:', volume24h.buyCount + volume24h.sellCount);
console.log('Unique Traders:', volume24h.uniqueTraders);
console.log(
  'Buy/Sell Ratio:',
  Number(volume24h.totalBuyVolumeBNB) / Number(volume24h.totalSellVolumeBNB)
);

// Get total all-time volume
const totalVolume = await sdk.bondingDex.getTotalVolume(tokenAddress);

// Get hourly volume for last 24 hours
const hourlyVolume = await sdk.bondingDex.getVolumeHistory(
  tokenAddress,
  3600, // 1 hour intervals
  24 // 24 periods
);

// Get recent trades
const trades = await sdk.bondingDex.getRecentTrades(tokenAddress, 50);
trades.forEach((trade) => {
  console.log(`${trade.type}: ${sdk.formatBNB(trade.bnbAmount)} BNB`);
});

// Get top traders
const topTraders = await sdk.bondingDex.getTopTraders(tokenAddress, 10);
topTraders.forEach((trader, i) => {
  console.log(`#${i + 1}: ${trader.address}`);
  console.log(`  Volume: ${sdk.formatBNB(trader.totalVolumeBNB)} BNB`);
  console.log(`  Net Position: ${sdk.formatToken(trader.netTokens)}`);
});
```

#### Claim Creator Fees

```typescript
const feeInfo = await sdk.bondingDex.getCreatorFeeInfo(tokenAddress);

if (feeInfo.canClaim) {
  const tx = await sdk.bondingDex.claimCreatorFees(tokenAddress);
  await tx.wait();
}
```

#### Post-Graduation Stats

```typescript
const stats = await sdk.bondingDex.getPostGraduationStats(tokenAddress);
console.log('Tokens sold:', sdk.formatToken(stats.totalTokensSold));
console.log('Liquidity added:', sdk.formatBNB(stats.totalLiquidityAdded));
console.log('LP generated:', stats.lpTokensGenerated);
```

### Price Oracle

```typescript
// Get current BNB price in USD
const price = await sdk.priceOracle.getBNBPrice();
console.log('BNB Price:', sdk.formatUnits(price, 8), 'USD');

// Convert USD to BNB
const bnbAmount = await sdk.priceOracle.usdToBNB(ethers.parseUnits('50000', 18));

// Convert BNB to USD
const usdAmount = await sdk.priceOracle.bnbToUSD(ethers.parseEther('10'));
```

### LP Fee Harvester

```typescript
// Get lock information
const lockInfo = await sdk.lpHarvester.getLockInfo(tokenAddress);
console.log('LP Amount:', sdk.formatToken(lockInfo.lpAmount));
console.log('Unlock Time:', new Date(Number(lockInfo.unlockTime) * 1000));
console.log('Fees Harvested:', sdk.formatBNB(lockInfo.totalFeesHarvested));

// Check if can harvest
const [canHarvest, timeRemaining] = await sdk.lpHarvester.canHarvest(tokenAddress);

if (canHarvest) {
  const tx = await sdk.lpHarvester.harvestFees(tokenAddress);
  await tx.wait();
}

// Get platform stats
const stats = await sdk.lpHarvester.getPlatformStats();
console.log('Total Value Locked:', sdk.formatBNB(stats.totalValueLocked));
console.log('Total Fees Distributed:', sdk.formatBNB(stats.totalFeesDistributed));
```

### Utility Functions

```typescript
// Format amounts
const bnb = sdk.formatBNB(bigintAmount); // "0.5"
const tokens = sdk.formatToken(bigintAmount, 18); // "1000.0"

// Parse amounts
const bnbWei = sdk.parseBNB('0.5'); // bigint
const tokenWei = sdk.parseToken('1000', 18); // bigint

// Get balance
const balance = await sdk.getBalance(); // current signer
const otherBalance = await sdk.getBalance('0x...'); // other address

// Get gas price
const gasPrice = await sdk.getGasPrice(); // in gwei

// Get explorer URL
const url = sdk.getExplorerUrl('address', '0x...');
const txUrl = sdk.getExplorerUrl('tx', '0x...');
```

## Event Handling

### Listen to Events

```typescript
// Launch events
const unsubscribe1 = sdk.launchpad.onLaunchCreated((event) => {
  console.log('New launch:', event.args.token);
  console.log('Founder:', event.args.founder);
  console.log('Burn LP:', event.args.burnLP);
});

// Trading events
const unsubscribe2 = sdk.bondingDex.onTokensBought((event) => {
  console.log('Buyer:', event.args.buyer);
  console.log('Amount:', sdk.formatBNB(event.args.bnbAmount));
  console.log('Price:', sdk.formatBNB(event.args.currentPrice));
});

// Sell events
const unsubscribe3 = sdk.bondingDex.onTokensSold((event) => {
  console.log('Seller:', event.args.seller);
  console.log('Amount:', sdk.formatBNB(event.args.bnbReceived));
});

// Graduation events
const unsubscribe4 = sdk.bondingDex.onPoolGraduated((event) => {
  console.log('Pool graduated:', event.args.token);
  console.log('Final Market Cap:', sdk.formatBNB(event.args.finalMarketCap));
});

// Cleanup
unsubscribe1();
unsubscribe2();
unsubscribe3();
unsubscribe4();
```

### Query Past Events

```typescript
const events = await sdk.launchpad.getPastEvents('LaunchCreated', {
  fromBlock: 0,
  toBlock: 'latest',
});

events.forEach((event) => {
  console.log('Token:', event.args.token);
  console.log('Founder:', event.args.founder);
});
```

## Error Handling

```typescript
import { SafuPadError, ContractError, ValidationError } from '@safupad/sdk';

try {
  const tx = await sdk.bondingDex.buyTokens(tokenAddress, '0.1');
  await tx.wait();
} catch (error) {
  if (error instanceof ContractError) {
    console.error('Contract error:', error.message);
    console.error('Code:', error.code);
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof SafuPadError) {
    console.error('SafuPad error:', error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Advanced Usage

### Custom Network Configuration

```typescript
const sdk = new SafuPadSDK({
  network: {
    name: 'Custom Network',
    chainId: 56,
    rpcUrl: 'https://custom-rpc.com',
    explorerUrl: 'https://custom-explorer.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      launchpadManager: '0x...',
      bondingCurveDEX: '0x...',
      tokenFactory: '0x...',
      priceOracle: '0x...',
      lpFeeHarvester: '0x...',
      pancakeRouter: '0x...',
      pancakeFactory: '0x...',
    },
  },
});
```

### Using Different Signers

```typescript
// Create SDK with default signer
const sdk = new SafuPadSDK({...});

// Switch to different signer
const newWallet = new ethers.Wallet(privateKey, provider);
sdk.updateSigner(newWallet);

// Or create new SDK instance with different signer
const newSdk = sdk.withSigner(newWallet);
```

### Estimate Gas

```typescript
// For launchpad operations
const gasLimit = await sdk.launchpad.estimateGas(
  'createLaunch',
  [...args],
  txOptions
);

// Manual gas estimation
const tx = await sdk.launchpad.createLaunch({...});
const gasEstimate = await sdk.estimateGas(tx);
```

## React Integration

```tsx
import { SafuPadSDK } from '@safupad/sdk';
import { useState, useEffect } from 'react';

function useSafuPad() {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      const newSdk = new SafuPadSDK({
        network: 'bsc',
        provider: window.ethereum,
      });

      await newSdk.initialize();
      setSdk(newSdk);
    };

    initSDK();
  }, []);

  const connect = async () => {
    if (sdk) {
      const addr = await sdk.connect();
      setAddress(addr);
      return addr;
    }
  };

  return { sdk, address, connect };
}

function App() {
  const { sdk, address, connect } = useSafuPad();
  const [volume, setVolume] = useState(null);

  const handleBuy = async () => {
    if (!sdk) return;

    const tx = await sdk.bondingDex.buyTokens('0x...', '0.1');
    await tx.wait();
    alert('Purchase successful!');
  };

  const fetchVolume = async () => {
    if (!sdk) return;

    const vol24h = await sdk.bondingDex.get24hVolume('0x...');
    setVolume(vol24h);
  };

  return (
    <div>
      {!address ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {address}</p>
          <button onClick={handleBuy}>Buy Tokens</button>
          <button onClick={fetchVolume}>Get 24h Volume</button>
          {volume && (
            <div>
              <p>Total Volume: {sdk.formatBNB(volume.totalVolumeBNB)} BNB</p>
              <p>Trades: {volume.buyCount + volume.sellCount}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Testing

```typescript
import { SafuPadSDK } from '@safupad/sdk';

// Use localhost network for testing
const sdk = new SafuPadSDK({
  network: 'localhost',
  provider: 'http://localhost:8545',
  privateKey: 'test_private_key',
});
```

## Building from Source

```bash
# Clone repository
git clone https://github.com/safupad/sdk.git
cd sdk

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Generate documentation
npm run docs
```

## Migration Guide (v1.x → v2.x)

### 1. Update Launch Creation

```typescript
// ❌ Old (v1.x)
await sdk.launchpad.createLaunch({
  raiseTargetUSD: '50000',
  raiseMaxUSD: '100000',
  projectInfoFiWallet: '0x...',
  // ...
});

// ✅ New (v2.x)
await sdk.launchpad.createLaunch({
  raiseTargetBNB: '50', // Now in BNB
  raiseMaxBNB: '100', // Now in BNB
  // projectInfoFiWallet removed
  // ...
});
```

### 2. Update Launch Info Access

```typescript
// ❌ Old (v1.x)
const info = await sdk.launchpad.getLaunchInfo(token);
console.log(info.projectInfoFiWallet); // No longer exists

// ✅ New (v2.x)
const info = await sdk.launchpad.getLaunchInfo(token);
// Access other properties as before
console.log(info.burnLP); // Still available
```

### 3. Update Raise Validation

```typescript
// ❌ Old (v1.x)
if (raiseTarget >= 50000 && raiseTarget <= 500000) // USD

// ✅ New (v2.x)
if (raiseTarget >= 50 && raiseTarget <= 500) // BNB
```

## BNB Chain Integration Details

This SDK is specifically designed for BNB Chain (BNB Smart Chain) deployment:

### Network Configuration

The SDK includes pre-configured support for BSC networks:

```typescript
// BSC Mainnet (default for 'bsc')
{
  chainId: 56,
  rpcUrl: 'https://bsc-dataseed.binance.org/',
  explorerUrl: 'https://bscscan.com',
  nativeCurrency: 'BNB'
}

// BSC Testnet
{
  chainId: 97,
  rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  explorerUrl: 'https://testnet.bscscan.com',
  nativeCurrency: 'tBNB'
}
```

### BNB Chain Specific Features

1. **BNB-Denominated Launches**: All token raises are denominated in BNB (50-500 BNB range)
2. **PancakeSwap Integration**: Automatic graduation to PancakeSwap V2 on BSC at 15 BNB threshold
3. **Chainlink Price Feeds**: Uses Chainlink BNB/USD oracle deployed on BSC for accurate pricing
4. **Low Gas Costs**: Optimized for BSC's affordable transaction fees
5. **BSCScan Integration**: Built-in support for BSCScan transaction and contract links

### PancakeSwap on BNB Chain

The SDK integrates with PancakeSwap V2 contracts on BSC:
- **Router**: 0x10ED43C718714eb63d5aA57B78B54704E256024E (BSC Mainnet)
- **Factory**: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73 (BSC Mainnet)

Tokens automatically graduate from bonding curve to PancakeSwap when reaching 15 BNB liquidity.

### BSCScan Verification

All contract addresses and transactions can be verified on BSCScan:

```typescript
// Get BSCScan URL for transaction
const txUrl = sdk.getExplorerUrl('tx', txHash);
// https://bscscan.com/tx/0x...

// Get BSCScan URL for token
const tokenUrl = sdk.getExplorerUrl('address', tokenAddress);
// https://bscscan.com/address/0x...
```

### Network Information

#### BSC Mainnet
- **Chain ID**: 56
- **RPC URL**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **Native Token**: BNB
- **Faucet**: N/A (use exchanges to acquire BNB)

#### BSC Testnet
- **Chain ID**: 97
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com
- **Native Token**: tBNB
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

### Integration with Safuverse Ecosystem

The SafuPad SDK is part of the larger Safuverse ecosystem on BNB Chain:
- **safudomains**: Domain verification for enhanced launch permissions
- **SafuCourse**: Token economics education integration
- **Safucard**: Project scorecard NFTs on BSC
- **SafuAgents**: AI-powered launch analytics

All ecosystem components are deployed on BNB Chain for seamless interoperability.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@safupad.com
- 💬 Discord: https://discord.gg/safupad
- 🐦 Twitter: https://twitter.com/safupad
- 📖 Docs: https://docs.safupad.com

## Changelog

### v2.0.0 (Breaking Changes)

- ✅ **Removed `projectInfoFiWallet` parameter** - Now uses global InfoFi address
- ✅ **Changed to BNB-based raises** - `raiseTargetBNB` and `raiseMaxBNB` instead of USD
- ✅ **Unified graduation threshold** - All tokens graduate at 15 BNB
- ✅ **Added volume tracking** - 24h volume, top traders, and trading analytics
- ✅ **Fixed event parsing** - Improved reliability of volume tracking
- 🔧 Updated ABIs for new contract versions
- 🔧 Improved TypeScript types

### v1.0.0

- Initial release
- Full support for all SafuPad contracts
- TypeScript support
- Event handling
- Comprehensive documentation
- Browser and Node.js support

---

**Built for BNB Chain** - TypeScript SDK for SafuPad token launchpad platform on BNB Smart Chain.
