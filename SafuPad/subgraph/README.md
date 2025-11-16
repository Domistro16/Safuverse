# SafuPad Subgraph

This subgraph indexes the SafuPad protocol contracts on BSC (Binance Smart Chain), including:

- **LaunchpadManagerV2/V3**: Manages token launches (Project Raise and Instant Launch)
- **TokenFactoryV2**: Creates ERC20 tokens with metadata
- **BondingDEX**: Bonding curve DEX for token trading

## Features

- Track all token launches (Project Raise & Instant Launch)
- Monitor bonding curve trading activity
- Track contributions and claims
- Real-time pool statistics
- Daily and platform-wide analytics
- Token holder tracking
- Creator fee tracking

## Prerequisites

- Node.js >= 16
- npm or yarn
- The Graph CLI

## Installation

```bash
npm install
```

## Configuration

Before deploying, you need to update the contract addresses in `subgraph.yaml`:

1. Update the `address` field for each data source with the deployed contract addresses
2. Update the `startBlock` field with the deployment block numbers
3. Ensure the network is set correctly (bsc or bsc-testnet)

## Generating ABIs

You need to place the contract ABIs in the `abis/` directory:

```bash
mkdir -p abis
```

Copy the following ABI files:
- `LaunchpadManager.json` - LaunchpadManagerV2/V3 ABI
- `TokenFactory.json` - TokenFactoryV2 ABI
- `BondingDEX.json` - BondingDEX ABI
- `ERC20.json` - Standard ERC20 ABI

You can generate these from your Hardhat/Foundry build artifacts.

## Development

### Generate Types

```bash
npm run codegen
```

This generates TypeScript types from your GraphQL schema and ABIs.

### Build

```bash
npm run build
```

### Deploy to The Graph Studio

1. Create a subgraph on [The Graph Studio](https://thegraph.com/studio/)
2. Authenticate:

```bash
graph auth --studio <DEPLOY_KEY>
```

3. Deploy:

```bash
npm run deploy
```

For testnet:

```bash
npm run deploy:testnet
```

### Local Development

To run a local Graph Node:

```bash
# Create local subgraph
npm run create-local

# Deploy locally
npm run deploy-local
```

## Queries

### Example Queries

#### Get all launches

```graphql
{
  launches(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    token {
      name
      symbol
    }
    founder
    launchType
    raiseTarget
    totalRaised
    raiseCompleted
  }
}
```

#### Get pool information

```graphql
{
  pools(first: 10, where: { graduated: false }) {
    id
    token {
      name
      symbol
    }
    bnbReserve
    tokenReserve
    currentPrice
    totalVolume
    graduated
  }
}
```

#### Get trading activity

```graphql
{
  trades(first: 20, orderBy: timestamp, orderDirection: desc) {
    id
    token {
      name
      symbol
    }
    trader
    isBuy
    bnbAmount
    tokenAmount
    price
    timestamp
  }
}
```

#### Platform statistics

```graphql
{
  platformStats(id: "platform") {
    totalLaunches
    totalProjectRaises
    totalInstantLaunches
    totalGraduated
    totalVolume
    totalFees
    totalRaised
  }
}
```

## Schema

The subgraph tracks the following entities:

- `Token` - ERC20 tokens created through the factory
- `Launch` - Token launch configurations and status
- `Pool` - Bonding curve pools
- `Trade` - Individual buy/sell transactions
- `Contribution` - User contributions to Project Raises
- `TokenHolder` - Token holder balances and activity
- `CreatorFees` - Creator fee accumulation and claims
- `PlatformStats` - Overall platform statistics
- `DailyStats` - Daily aggregated metrics

## Networks

### BSC Mainnet

- Network: `bsc`
- RPC: `https://bsc-dataseed.binance.org/`

### BSC Testnet

- Network: `bsc-testnet`
- RPC: `https://data-seed-prebsc-1-s1.binance.org:8545/`

## License

MIT
