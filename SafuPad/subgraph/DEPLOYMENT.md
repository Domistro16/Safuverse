# SafuPad Subgraph Deployment Guide

This guide walks you through deploying the SafuPad subgraph to The Graph Network.

## Prerequisites

- [ ] Node.js >= 16 installed
- [ ] Graph CLI installed globally: `npm install -g @graphprotocol/graph-cli`
- [ ] Contract ABIs extracted (see below)
- [ ] Contract addresses and deployment blocks

## Step 1: Install Dependencies

```bash
cd SafuPad/subgraph
npm install
```

## Step 2: Extract Contract ABIs

Run the ABI extraction script from the SafuPad root directory:

```bash
cd SafuPad
npm run compile  # Ensure contracts are compiled
node subgraph/scripts/extract-abis.js
```

This will create the following files in `subgraph/abis/`:
- `LaunchpadManager.json`
- `TokenFactory.json`
- `BondingDEX.json`
- `ERC20.json`

## Step 3: Update Configuration

Edit `subgraph/subgraph.yaml` and update:

### For each data source, update:

1. **Contract Address** - Replace `0x0000000000000000000000000000000000000000` with deployed address
2. **Start Block** - Replace `0` with the deployment block number
3. **Network** - Ensure it's set correctly:
   - `bsc` for mainnet
   - `bsc-testnet` for testnet

Example:
```yaml
dataSources:
  - kind: ethereum/contract
    name: LaunchpadManager
    network: bsc-testnet
    source:
      address: "0xYourDeployedAddress"  # Update this
      abi: LaunchpadManager
      startBlock: 12345678  # Update this
```

### Get Deployment Information

You can get this information from your deployment scripts or block explorer:

```bash
# From SafuPad directory
npx hardhat run scripts/deploy.js --network bscTestnet
```

Or check your deployment logs for addresses and blocks.

## Step 4: Generate Types

Generate TypeScript types from your schema and ABIs:

```bash
cd subgraph
npm run codegen
```

This creates the `generated/` directory with TypeScript types.

## Step 5: Build

Build the subgraph:

```bash
npm run build
```

Fix any compilation errors before proceeding.

## Step 6: Deploy to The Graph Studio

### Create a Subgraph

1. Go to [The Graph Studio](https://thegraph.com/studio/)
2. Connect your wallet
3. Click "Create a Subgraph"
4. Name it (e.g., "safupad-subgraph")
5. Choose BSC or BSC Testnet network

### Authenticate

Copy your deploy key from The Graph Studio and authenticate:

```bash
graph auth --studio <YOUR_DEPLOY_KEY>
```

### Deploy

```bash
npm run deploy
```

Or for testnet:

```bash
npm run deploy:testnet
```

Follow the prompts to deploy.

## Step 7: Publish (Mainnet Only)

Once your subgraph is syncing and tested:

1. Go to The Graph Studio
2. Select your subgraph
3. Click "Publish to Network"
4. Pay the publication fee (in GRT)

## Testing Your Subgraph

### Check Sync Status

In The Graph Studio, you can see:
- Current sync block
- Health status
- Any errors

### Run Test Queries

Try some basic queries in the playground:

```graphql
{
  platformStats(id: "platform") {
    totalLaunches
    totalVolume
  }

  launches(first: 5) {
    id
    founder
    launchType
    raiseTarget
  }
}
```

## Local Development (Optional)

For local testing, you can run a Graph Node:

### Start Local Graph Node

Use Docker Compose:

```bash
git clone https://github.com/graphprotocol/graph-node
cd graph-node/docker
./setup.sh
docker-compose up
```

### Deploy Locally

```bash
cd SafuPad/subgraph
npm run create-local
npm run deploy-local
```

## Troubleshooting

### Build Errors

**Problem**: TypeScript compilation errors

**Solution**:
- Ensure all ABIs are present in `abis/`
- Run `npm run codegen` again
- Check event signatures match contract events

### Sync Issues

**Problem**: Subgraph not syncing or failing

**Solution**:
- Check contract addresses are correct
- Verify startBlock is before first transaction
- Check RPC endpoint is working
- Review logs in The Graph Studio

### Missing Entities

**Problem**: Queries return null for expected entities

**Solution**:
- Verify events are being emitted by contracts
- Check event handler logic in mapping files
- Ensure entity IDs are consistent

## Updating the Subgraph

After making changes:

1. Update version in `subgraph.yaml`
2. Run `npm run codegen`
3. Run `npm run build`
4. Run `npm run deploy`

## Networks

### BSC Mainnet
- Network ID: `bsc`
- Chain ID: 56
- Explorer: https://bscscan.com

### BSC Testnet
- Network ID: `bsc-testnet`
- Chain ID: 97
- Explorer: https://testnet.bscscan.com
- Faucet: https://testnet.binance.org/faucet-smart

## Resources

- [The Graph Documentation](https://thegraph.com/docs/)
- [AssemblyScript Documentation](https://www.assemblyscript.org/)
- [The Graph Discord](https://discord.gg/graphprotocol)

## Support

For issues or questions:
- Open an issue on GitHub
- Ask in The Graph Discord
- Check The Graph documentation
