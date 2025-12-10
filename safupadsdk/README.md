- ðŸ” **Type-safe** - Full TypeScript support with comprehensive types
- ðŸŽ¯ **Easy to use** - Simple, intuitive API
- âš¡ **Fast** - Optimized for performance
- ðŸŒ **Multi-network** - Support for BSC Mainnet, Testnet, and localhost
- ðŸ”Œ **Flexible** - Works in Node.js and browsers
- ðŸ“Š **Complete** - All contract functions wrapped with helpers
- ðŸŽ¨ **Event handling** - Easy event listening and filtering
- ðŸ›¡ï¸ **Error handling** - Comprehensive error types and messages
- ðŸ“ˆ **Volume Tracking** - Built-in 24h volume and trading analytics

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
  network: 'BSC',
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
  network: 'BSCTestnet',
  privateKey: process.env.PRIVATE_KEY,
});

await sdk.initialize();

// Create a launch - âœ… UPDATED: No projectInfoFiWallet needed
const tx = await sdk.launchpad.createLaunch({
  name: 'MyToken',
  symbol: 'MTK',
  totalSupply: 1000000000,
  raiseTargetBNB: '50', // âœ… NEW: BNB amounts instead of USD
  raiseMaxBNB: '100', // âœ… NEW: BNB amounts instead of USD
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

## ðŸš¨ Breaking Changes v2.0.0

### Removed `projectInfoFiWallet` Parameter

**Before (v1.x):**

```typescript
await sdk.launchpad.createLaunch({
  // ...
  projectInfoFiWallet: '0x...', // âŒ No longer needed
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
  raiseTargetUSD: '50000', // âŒ USD amounts
  raiseMaxUSD: '100000', // âŒ USD amounts
  // ...
});
```

**After (v2.x):**

```typescript
await sdk.launchpad.createLaunch({
  raiseTargetBNB: '50', // âœ… BNB amounts (50- BNB)
  raiseMaxBNB: '100', // âœ… BNB amounts
  // ...
});
```

### Updated Launch Info

**Before (v1.x):**

```typescript
const info = await sdk.launchpad.getLaunchInfo(tokenAddress);
console.log(info.projectInfoFiWallet); // âŒ No longer exists
```

**After (v2.x):**

```typescript
const info = await sdk.launchpad.getLaunchInfo(tokenAddress);
// projectInfoFiWallet removed - managed globally by platform
console.log(info.burnLP); // âœ… Still available
```

## Core Concepts

### SDK Instance

The main entry point for all SafuPad interactions:

```typescript
const sdk = new SafuPadSDK({
  network: 'BSC' | 'BSCTestnet' | 'localhost',
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
// âœ… UPDATED: No projectInfoFiWallet, uses BNB amounts
const tx = await sdk.launchpad.createLaunch({
  name: 'MyToken',
  symbol: 'MTK',
  totalSupply: 1000000000, // 1 billion
  raiseTargetBNB: '50', // âœ… Minimum  BNB
  raiseMaxBNB: '100', // âœ… Maximum  BNB
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

- `raiseTargetBNB`: String - Minimum raise target (50- BNB)
- `raiseMaxBNB`: String - Maximum raise cap (50- BNB)
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
// âœ… UPDATED: No longer includes projectInfoFiWallet
const info = await sdk.launchpad.getLaunchInfo(tokenAddress);
console.log('Founder:', info.founder);
console.log('Raised:', sdk.formatBNB(info.totalRaised));
console.log('Target:', sdk.formatBNB(info.raiseTarget));
console.log('Completed:', info.raiseCompleted);
console.log('Graduated:', info.graduatedToBSC DEX);
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
  graduatedToBSC DEX: boolean;
  raisedFundsVesting: bigint;
  raisedFundsClaimed: bigint;
  launchType: LaunchType;
  burnLP: boolean;
  // âŒ projectInfoFiWallet removed
}
```

#### Get Launch Info with USD

```typescript
// âœ… Provides both BNB and USD values
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

#### Graduate to BSC DEX

```typescript
// Token graduates at  BNB in bonding curve
const tx = await sdk.launchpad.graduateToBSC DEX(tokenAddress);
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
console.log('BNB Reserve:', sdk.formatBNB(pool.BNBReserve));
console.log('Token Reserve:', sdk.formatToken(pool.tokenReserve));
console.log('Current Price:', sdk.formatBNB(pool.currentPrice));
console.log('Graduation:', Number(pool.graduationProgress), '%');
console.log('Graduated:', pool.graduated);
```

**Graduation Threshold:**

- All INSTANT_LAUNCH tokens graduate at ** BNB** in bonding curve
- PROJECT_RAISE require their raise target to be met before graduation

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
  console.log(`${trade.type}: ${sdk.formatBNB(trade.BNBAmount)} BNB`);
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
const BNBAmount = await sdk.priceOracle.usdToBNB(ethers.parseUnits('50000', 18));

// Convert BNB to USD
const usdAmount = await sdk.priceOracle.BNBToUSD(ethers.parseEther('10'));
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
const BNB = sdk.formatBNB(bigintAmount); // "0.5"
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
const unsuBSCribe1 = sdk.launchpad.onLaunchCreated((event) => {
  console.log('New launch:', event.args.token);
  console.log('Founder:', event.args.founder);
  console.log('Burn LP:', event.args.burnLP);
});

// Trading events
const unsuBSCribe2 = sdk.bondingDex.onTokensBought((event) => {
  console.log('Buyer:', event.args.buyer);
  console.log('Amount:', sdk.formatBNB(event.args.BNBAmount));
  console.log('Price:', sdk.formatBNB(event.args.currentPrice));
});

// Sell events
const unsuBSCribe3 = sdk.bondingDex.onTokensSold((event) => {
  console.log('Seller:', event.args.seller);
  console.log('Amount:', sdk.formatBNB(event.args.bnbReceived));
});

// Graduation events
const unsuBSCribe4 = sdk.bondingDex.onPoolGraduated((event) => {
  console.log('Pool graduated:', event.args.token);
  console.log('Final Market Cap:', sdk.formatBNB(event.args.finalMarketCap));
});

// Cleanup
unsuBSCribe1();
unsuBSCribe2();
unsuBSCribe3();
unsuBSCribe4();
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
        network: 'BSC',
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

## Migration Guide (v1.x â†’ v2.x)

### 1. Update Launch Creation

```typescript
// âŒ Old (v1.x)
await sdk.launchpad.createLaunch({
  raiseTargetUSD: '50000',
  raiseMaxUSD: '100000',
  projectInfoFiWallet: '0x...',
  // ...
});

// âœ… New (v2.x)
await sdk.launchpad.createLaunch({
  raiseTargetBNB: '50', // Now in BNB
  raiseMaxBNB: '100', // Now in BNB
  // projectInfoFiWallet removed
  // ...
});
```

### 2. Update Launch Info Access

```typescript
// âŒ Old (v1.x)
const info = await sdk.launchpad.getLaunchInfo(token);
console.log(info.projectInfoFiWallet); // No longer exists

// âœ… New (v2.x)
const info = await sdk.launchpad.getLaunchInfo(token);
// Access other properties as before
console.log(info.burnLP); // Still available
```

### 3. Update Raise Validation

```typescript
// âŒ Old (v1.x)
if (raiseTarget >= 50000 && raiseTarget <= 500000) // USD

// âœ… New (v2.x)
if (raiseTarget >= 50 && raiseTarget <= 500) // BNB
```

## Frontend Integration Guide - BSC Migration

This guide covers everything you need to integrate the BSC-migrated SDK into your React/Vue/Next.js frontend applications.

### 1. Wallet Configuration for BSC

#### Add BSC Network to MetaMask

Users need to add the BSC network to their wallet before interacting with your dApp:

```typescript
// utils/addBSCNetwork.ts
export const BSC_MAINNET = {
  chainId: '0x279F', // 10143 in hex
  chainName: 'BSC',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.BSC.xyz/'],
  blockExplorerUrls: ['https://explorer.BSC.xyz'],
};

export const BSC_TESTNET = {
  chainId: '0x2803', // 10243 in hex
  chainName: 'BSC Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.BSC.xyz/'],
  blockExplorerUrls: ['https://testnet-explorer.BSC.xyz'],
};

export async function addBSCNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [BSC_MAINNET],
    });
  } catch (error) {
    console.error('Failed to add BSC network:', error);
    throw error;
  }
}
```

#### Auto-Switch to BSC Network

```typescript
// utils/switchToBSC.ts
export async function switchToBSCNetwork() {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x279F' }], // BSC mainnet
    });
  } catch (switchError: any) {
    // Network not added yet
    if (switchError.code === 4902) {
      await addBSCNetwork();
    } else {
      throw switchError;
    }
  }
}
```

### 2. SDK Initialization in React

#### Create a Custom Hook

```typescript
// hooks/useSafuPad.ts
import { SafuPadSDK } from '@safupad/sdk';
import { useState, useEffect } from 'react';

export function useSafuPad() {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask not installed');
        }

        const newSdk = new SafuPadSDK({
          network: 'BSC', // âœ… Changed from 'bsc' to 'BSC'
          provider: window.ethereum,
        });

        await newSdk.initialize();
        setSdk(newSdk);

        // Get current chain
        const chain = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(parseInt(chain, 16));

        // Listen for chain changes
        window.ethereum.on('chainChanged', (newChainId: string) => {
          setChainId(parseInt(newChainId, 16));
          window.location.reload(); // Recommended by MetaMask
        });

        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            setAddress(null);
          } else {
            setAddress(accounts[0]);
          }
        });
      } catch (error) {
        console.error('Failed to initialize SDK:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSDK();

    return () => {
      // Cleanup listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
        window.ethereum.removeAllListeners('accountsChanged');
      }
    };
  }, []);

  const connect = async () => {
    if (!sdk) throw new Error('SDK not initialized');

    // Check if on correct network
    if (chainId !== 10143) {
      await switchToBSCNetwork();
    }

    const addr = await sdk.connect();
    setAddress(addr);
    return addr;
  };

  return { sdk, address, connect, isLoading, chainId };
}
```

### 3. Migration Checklist for Existing Frontends

#### Step 1: Update Environment Variables

```bash
# .env.local (BEFORE - BSC)
NEXT_PUBLIC_CHAIN_ID=56
NEXT_PUBLIC_RPC_URL=https://bsc-dataseed.binance.org/
NEXT_PUBLIC_EXPLORER_URL=https://bscscan.com
NEXT_PUBLIC_CURRENCY_SYMBOL=BNB

# .env.local (AFTER - BSC)
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_RPC_URL=https://rpc.BSC.xyz/
NEXT_PUBLIC_EXPLORER_URL=https://explorer.BSC.xyz
NEXT_PUBLIC_CURRENCY_SYMBOL=BNB
```

#### Step 2: Update Network References

```typescript
// âŒ BEFORE (BSC)
const SUPPORTED_CHAINS = [56, 97]; // BSC mainnet, testnet
const NETWORK_NAMES = {
  56: 'BSC Mainnet',
  97: 'BSC Testnet',
};

// âœ… AFTER (BSC)
const SUPPORTED_CHAINS = [10143, 10243]; // BSC mainnet, testnet
const NETWORK_NAMES = {
  10143: 'BSC',
  10243: 'BSC Testnet',
};
```

#### Step 3: Update SDK Initialization

```typescript
// âŒ BEFORE
const sdk = new SafuPadSDK({
  network: 'bsc', // Old BSC network
  provider: window.ethereum,
});

// âœ… AFTER
const sdk = new SafuPadSDK({
  network: 'BSC', // New BSC network
  provider: window.ethereum,
});
```

#### Step 4: Update Function Calls

```typescript
// âŒ BEFORE
const price = await sdk.priceOracle.getBNBPrice();
const formatted = sdk.formatBNB(amount);
const bnbAmount = await sdk.priceOracle.usdToBNB(usdAmount);

// âœ… AFTER
const price = await sdk.priceOracle.getBNBPrice();
const formatted = sdk.formatBNB(amount);
const BNBAmount = await sdk.priceOracle.usdToBNB(usdAmount);
```

#### Step 5: Update Parameter Names

```typescript
// âŒ BEFORE
await sdk.launchpad.createLaunch({
  raiseTargetBNB: '100',
  raiseMaxBNB: '200',
  // ...
});

// âœ… AFTER
await sdk.launchpad.createLaunch({
  raiseTargetBNB: '100',
  raiseMaxBNB: '200',
  // ...
});
```

### 4. Display Components

#### Currency Display Component

```tsx
// components/BNBDisplay.tsx
import React from 'react';

interface BNBDisplayProps {
  amount: string | bigint;
  showSymbol?: boolean;
  decimals?: number;
}

export function BNBDisplay({ amount, showSymbol = true, decimals = 4 }: BNBDisplayProps) {
  const formatted = typeof amount === 'bigint' 
    ? parseFloat(ethers.formatEther(amount)).toFixed(decimals)
    : parseFloat(amount).toFixed(decimals);

  return (
    <span className="BNB-amount">
      {formatted} {showSymbol && 'BNB'}
    </span>
  );
}
```

#### Network Status Indicator

```tsx
// components/NetworkStatus.tsx
import React from 'react';
import { useSafuPad } from '../hooks/useSafuPad';
import { switchToBSCNetwork } from '../utils/switchToBSC';

export function NetworkStatus() {
  const { chainId } = useSafuPad();
  const isBSC = chainId === 10143;

  if (isBSC) {
    return (
      <div className="network-status success">
        âœ“ Connected to BSC
      </div>
    );
  }

  return (
    <div className="network-status warning">
      âš ï¸ Wrong Network
      <button onClick={switchToBSCNetwork}>
        Switch to BSC
      </button>
    </div>
  );
}
```

### 5. Complete React Example

```tsx
// pages/LaunchToken.tsx
import React, { useState } from 'react';
import { useSafuPad } from '../hooks/useSafuPad';
import { BNBDisplay } from '../components/BNBDisplay';
import { NetworkStatus } from '../components/NetworkStatus';

export default function LaunchToken() {
  const { sdk, address, connect, isLoading } = useSafuPad();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    totalSupply: '1000000000',
    raiseTargetBNB: '50',
    raiseMaxBNB: '100',
  });

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sdk || !address) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const tx = await sdk.launchpad.createLaunch({
        name: formData.name,
        symbol: formData.symbol,
        totalSupply: parseInt(formData.totalSupply),
        raiseTargetBNB: formData.raiseTargetBNB,
        raiseMaxBNB: formData.raiseMaxBNB,
        vestingDuration: 90,
        metadata: {
          logoURI: '',
          description: '',
          website: '',
          twitter: '',
          telegram: '',
          discord: '',
        },
        burnLP: false,
      });

      console.log('Transaction:', tx.hash);
      await tx.wait();
      alert('Launch created successfully!');
    } catch (error) {
      console.error('Launch failed:', error);
      alert('Launch failed: ' + error.message);
    }
  };

  if (isLoading) {
    return <div>Loading SDK...</div>;
  }

  return (
    <div className="launch-page">
      <NetworkStatus />
      
      {!address ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {address}</p>
          
          <form onSubmit={handleLaunch}>
            <input
              placeholder="Token Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            
            <input
              placeholder="Symbol"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
            />
            
            <input
              type="number"
              placeholder="Raise Target (BNB)"
              value={formData.raiseTargetBNB}
              onChange={(e) => setFormData({ ...formData, raiseTargetBNB: e.target.value })}
            />
            
            <input
              type="number"
              placeholder="Raise Max (BNB)"
              value={formData.raiseMaxBNB}
              onChange={(e) => setFormData({ ...formData, raiseMaxBNB: e.target.value })}
            />
            
            <BNBDisplay amount={formData.raiseTargetBNB} />
            
            <button type="submit">Launch Token</button>
          </form>
        </div>
      )}
    </div>
  );
}
```

### 6. Testing on BSC Testnet

```typescript
// Use testnet for development
const sdk = new SafuPadSDK({
  network: 'BSCTestnet', // Use testnet
  provider: window.ethereum,
});

// Request testnet BNB from faucet
// Visit: https://faucet.BSC.xyz (placeholder - update when available)
```

### 7. ComBNB Issues and Solutions

#### Issue: "Unsupported Chain ID"

**Solution:** Make sure user is connected to BSC network (chain ID 10143)

```typescript
if (chainId !== 10143) {
  await switchToBSCNetwork();
}
```

#### Issue: "Insufficient BNB for gas"

**Solution:** Users need BNB tokens for gas fees (not BNB anymore)

```typescript
const balance = await sdk.getBalance(address);
if (balance < ethers.parseEther('0.01')) {
  alert('You need at least 0.01 BNB for gas fees');
}
```

#### Issue: "Transaction Reverted"

**Solution:** Check that contract addresses are updated for BSC

```typescript
// Verify you're using the correct network configuration
console.log(sdk.config.contracts);
```

### 8. Performance Optimization

```typescript
// Use React Query for caching
import { useQuery } from '@tanstack/react-query';

function useTokenPrice(tokenAddress: string) {
  const { sdk } = useSafuPad();
  
  return useQuery({
    queryKey: ['tokenPrice', tokenAddress],
    queryFn: async () => {
      if (!sdk) throw new Error('SDK not ready');
      return await sdk.bondingDex.getPoolInfo(tokenAddress);
    },
    enabled: !!sdk && !!tokenAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
```

### 9. TypeScript Types

```typescript
// types/BSC.ts
export interface BSCToken {
  address: string;
  name: string;
  symbol: string;
  raiseTargetBNB: string;
  raiseMaxBNB: string;
  totalRaisedBNB: string;
}

export interface BSCNetwork {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: 'BNB';
    symbol: 'BNB';
    decimals: 18;
  };
}
```

### 10. Build Configuration

Update your build configuration to handle the new network:

```javascript
// next.config.js
module.exports = {
  env: {
    NEXT_PUBLIC_BSC_CHAIN_ID: '10143',
    NEXT_PUBLIC_BSC_RPC: 'https://rpc.BSC.xyz/',
  },
};
```

---

## BSC Integration Details


This SDK is specifically designed for BSC (BSC) deployment:

### Network Configuration

The SDK includes pre-configured support for BSC networks:

```typescript
// BSC Mainnet (default for 'BSC')
{
  chainId: 56,
  rpcUrl: 'https://BSC-dataseed.binance.org/',
  explorerUrl: 'https://BSCscan.com',
  nativeCurrency: 'BNB'
}

// BSC Testnet
{
  chainId: 97,
  rpcUrl: 'https://data-seed-preBSC-1-s1.binance.org:8545/',
  explorerUrl: 'https://testnet.BSCscan.com',
  nativeCurrency: 'tBNB'
}
```

### BSC Specific Features

1. **BNB-Denominated Launches**: All token raises are denominated in BNB (50- BNB range)
2. **BSC DEX Integration**: Automatic graduation to BSC DEX V2 on BSC at  BNB threshold
3. **Chainlink Price Feeds**: Uses Chainlink BNB/USD oracle deployed on BSC for accurate pricing
4. **Low Gas Costs**: Optimized for BSC's affordable transaction fees
5. **BSCScan Integration**: Built-in support for BSCScan transaction and contract links

### BSC DEX on BSC

The SDK integrates with BSC DEX V2 contracts on BSC:
- **Router**: 0x10ED43C718714eb63d5aA57B78B54704E256024E (BSC Mainnet)
- **Factory**: 0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73 (BSC Mainnet)

Tokens automatically graduate from bonding curve to BSC DEX when reaching  BNB liquidity.

### BSCScan Verification

All contract addresses and transactions can be verified on BSCScan:

```typescript
// Get BSCScan URL for transaction
const txUrl = sdk.getExplorerUrl('tx', txHash);
// https://BSCscan.com/tx/0x...

// Get BSCScan URL for token
const tokenUrl = sdk.getExplorerUrl('address', tokenAddress);
// https://BSCscan.com/address/0x...
```

### Network Information

#### BSC Mainnet
- **Chain ID**: 56
- **RPC URL**: https://BSC-dataseed.binance.org/
- **Explorer**: https://BSCscan.com
- **Native Token**: BNB
- **Faucet**: N/A (use exchanges to acquire BNB)

#### BSC Testnet
- **Chain ID**: 97
- **RPC URL**: https://data-seed-preBSC-1-s1.binance.org:8545/
- **Explorer**: https://testnet.BSCscan.com
- **Native Token**: tBNB
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

### Integration with Safuverse Ecosystem

The SafuPad SDK is part of the larger Safuverse ecosystem on BSC:
- **SafuAcademyy**: Token economics education integration
- **Safucard**: Project scorecard NFTs on BSC
- **SafuAgents**: AI-powered launch analytics

All ecosystem components are deployed on BSC for seamless interoperability.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- ðŸ“§ Email: support@safupad.com
- ðŸ’¬ Discord: https://discord.gg/safupad
- ðŸ¦ Twitter: https://twitter.com/safupad
- ðŸ“– Docs: https://docs.safupad.com

## Changelog

### v2.0.0 (Breaking Changes)

- âœ… **Removed `projectInfoFiWallet` parameter** - Now uses global InfoFi address
- âœ… **Changed to BNB-based raises** - `raiseTargetBNB` and `raiseMaxBNB` instead of USD
- âœ… **Unified graduation threshold** - All tokens graduate at  BNB
- âœ… **Added volume tracking** - 24h volume, top traders, and trading analytics
- âœ… **Fixed event parsing** - Improved reliability of volume tracking
- ðŸ”§ Updated ABIs for new contract versions
- ðŸ”§ Improved TypeScript types

### v1.0.0

- Initial release
- Full support for all SafuPad contracts
- TypeScript support
- Event handling
- Comprehensive documentation
- Browser and Node.js support

---

**Built for BSC** - TypeScript SDK for SafuPad token launchpad platform on BSC.

