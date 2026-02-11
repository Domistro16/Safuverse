# SafuDomains (dns-contracts)

A decentralized naming system **deployed on BNB Chain** (BNB Smart Chain), inspired by ENS, with the custom .id TLD. Features dynamic pricing in BNB, CAKE, and USD1 tokens via Chainlink oracles, plus a built-in referral rewards system.

## Deployment Information

**Primary Network**: BNB Chain (BNB Smart Chain)

- **BSC Mainnet**: Chain ID 56
- **BSC Testnet**: Chain ID 97
- **Plasma Network**: Chain ID 9745 (alternative deployment)

All smart contracts are deployed and operational on BNB Chain networks, leveraging BSC's low gas costs and fast finality for affordable domain registration.

## Deployed Contracts (BSC Mainnet)

The following contracts are deployed on BNB Chain Mainnet (Chain ID: 56):

- **Controller**: `0x48511b6c15fe1F89bAf6b30dBFA35bF0eAaEB751`
- **Registry**: `0x6aEFc7ac590096c08187a9052030dA59dEd7E996`
- **ReverseRegistrar**: `0xc070aAcE207ad5eb2A460D059785ffC9D4D2C536`
- **BaseRegistrar**: `0xc85f95FCe09b582D546606f591CEEC88D88714f5`
- **NameWrapper**: `0x86a930d1931C11e3Ec46b3A050E27F29bF94B612`
- **PublicResolver**: `0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357`
- **Referral**: `0x182690bD985ef02Ae44A6F8a2e71666bDe1196E2`

## Live Application

**Production**: [names.safuverse.com](https://names.safuverse.com) - Running on BNB Chain

Register your .id domain on BNB Smart Chain today!

# ENS

For documentation of the ENS system, see [docs.ens.domains](https://docs.ens.domains/).

## Pre-Deployment

Before deploying these contracts to setup your own domain name service, You must configure a few details tailored to the TLD you want to deploy.

First of all, ALL instances of '.id' in the contracts and deploy scripts must be replaced with your own TLD. For example:

```solidity
function _setReverseRecord(
  string memory name,
  address resolver,
  address owner
) internal {
  reverseRegistrar.setNameForAddr(
    msg.sender,
    owner,
    resolver,
    string.concat(name, '.id')
  );
}
```

in ETHRegistrarController.sol should be replaced with:

```solidity
function _setReverseRecord(
  string memory name,
  address resolver,
  address owner
) internal {
  reverseRegistrar.setNameForAddr(
    msg.sender,
    owner,
    resolver,
    string.concat(name, '.<YOUR_TLD>')
  );
}
```

AND

```solidity
    bytes32 private constant CRE8OR_NODE =
        0x4f2c0fc83d175c423d55ddf2fef3b9b38af479fac3adb42afb02778397a27454;

    bytes32 private constant CRE8OR_LABELHASH =
        0x0d1f301a4d55e328cfe2f78743e489a98cedaf66d744b3ab1bb877ff82930b0b;

    names[CRE8OR_NODE] = "\x07pns\x00";
```

in Your NameWrapper Contract should be replaced with:

```solidity
       bytes32 private constant CRE8OR_NODE =
        Namehash(YourTLD);

    bytes32 private constant CRE8OR_LABELHASH =
        Keccak256(YourTLD);

     names[CRE8OR_NODE] = "\xN<YOUR_TLD>\x00";
```

Note: In

```solidity

names[CRE8OR_NODE] = "\xN<YOUR_TLD>\x00";

```

'xN' is the number of characters your TLD has. For example, "\x03bnb\x00".

## Testing

After deployment of all contracts, to test if the minting process works run:

```bash
npx hardhat run scripts/ens-test.ts --network <network-name>
```

## Contracts

## Registry

The ENS registry is the core contract that lies at the heart of ENS resolution. All ENS lookups start by querying the registry. The registry maintains a list of domains, recording the owner, resolver, and TTL for each, and allows the owner of a domain to make changes to that data. It also includes some generic registrars.

### ENS.sol

Interface of the ENS Registry.

### ENSRegistry

Implementation of the ENS Registry, the central contract used to look up resolvers and owners for domains.

### ENSRegistryWithFallback

The new implementation of the ENS Registry after [the 2020 ENS Registry Migration](https://docs.ens.domains/ens-migration-february-2020/technical-description#new-ens-deployment).

### FIFSRegistrar

Implementation of a simple first-in-first-served registrar, which issues (sub-)domains to the first account to request them.

### ReverseRegistrar

Implementation of the reverse registrar responsible for managing reverse resolution via the .addr.reverse special-purpose TLD.

### TestRegistrar

Implementation of the `.test` registrar facilitates easy testing of ENS on the Ethereum test networks. Currently deployed on Ropsten network, it provides functionality to instantly claim a domain for test purposes, which expires 28 days after it was claimed.

### BaseRegistrar

BaseRegistrar is the contract that owns the TLD in the ENS registry. This contract implements a minimal set of functionality:

- The owner of the registrar may add and remove controllers.
- Controllers may register new domains and extend the expiry of (renew) existing domains. They can not change the ownership or reduce the expiration time of existing domains.
- Name owners may transfer ownership to another address.
- Name owners may reclaim ownership in the ENS registry if they have lost it.
- Owners of names in the interim registrar may transfer them to the new registrar, during the 1 year transition period. When they do so, their deposit is returned to them in its entirety.

This separation of concerns provides name owners strong guarantees over continued ownership of their existing names, while still permitting innovation and change in the way names are registered and renewed via the controller mechanism.

### EthRegistrarController

EthRegistrarController is the first implementation of a registration controller for the new registrar. This contract implements the following functionality:

- The owner of the registrar may set a price oracle contract, which determines the cost of registrations and renewals based on the name and the desired registration or renewal duration.
- The owner of the registrar may withdraw any collected funds to their account.
- Users can register new names using a commit/reveal process and by paying the appropriate registration fee.
- Users can renew a name by paying the appropriate fee. Any user may renew a domain, not just the name's owner.

The commit/reveal process is used to avoid frontrunning, and operates as follows:

1.  A user commits to a hash, the preimage of which contains the name to be registered and a secret value.
2.  After a minimum delay period and before the commitment expires, the user calls the register function with the name to register and the secret value from the commitment. If a valid commitment is found and the other preconditions are met, the name is registered.

The minimum delay and expiry for commitments exist to prevent miners or other users from effectively frontrunning registrations.

### SimplePriceOracle

SimplePriceOracle is a trivial implementation of the pricing oracle for the EthRegistrarController that always returns a fixed price per domain per year, determined by the contract owner.

### TokenPriceOracle

TokenPriceOracle is a price oracle implementation that allows the contract owner to specify pricing based on the length of a name. It uses a fiat currency oracle to set a fixed price per name and checks the equivalent value in the native chain currency (e.g., BNB), CAKE, and USD1.

### ReferralController

The ReferralController contract manages the referral system by allocating a portion of the payment to the referrer after each token mint. It also tracks and calculates the total number of successful referrals made by each address.

## Resolvers

Resolver implements a general-purpose ENS resolver that is suitable for most standard ENS use cases. The public resolver permits updates to ENS records by the owner of the corresponding name.

PublicResolver includes the following profiles that implements different EIPs.

- ABIResolver = EIP 205 - ABI support (`ABI()`).
- AddrResolver = EIP 137 - Contract address interface. EIP 2304 - Multicoin support (`addr()`).
- ContentHashResolver = EIP 1577 - Content hash support (`contenthash()`).
- InterfaceResolver = EIP 165 - Interface Detection (`supportsInterface()`).
- NameResolver = EIP 181 - Reverse resolution (`name()`).
- PubkeyResolver = EIP 619 - SECP256k1 public keys (`pubkey()`).
- TextResolver = EIP 634 - Text records (`text()`).
- DNSResolver = Experimental support is available for hosting DNS domains on the Ethereum blockchain via ENS. [The more detail](https://veox-ens.readthedocs.io/en/latest/dns.html) is on the old ENS doc.

## Developer guide

### Prettier pre-commit hook

This repo runs a husky precommit to prettify all contract files to keep them consistent. Add new folder/files to `prettier format` script in package.json. If you need to add other tasks to the pre-commit script, add them to `.husky/pre-commit`

### How to setup

```bash
git clone https://github.com/Level3AI-Hub/Safuverse
cd Safuverse/SafuDomains
bun install
# or
npm install
```

### Environment Configuration

Create a `.env` file for BNB Chain deployment:

```bash
# BNB Chain RPC URLs
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/

# Deployer wallet
DEPLOYER_KEY=your_private_key_here

# BSCScan verification
BSCSCAN_API_KEY=your_bscscan_api_key

# Optional: Alchemy for BSC
ALCHEMY_KEY=your_alchemy_api_key_for_bsc

# Chainlink price feed addresses on BSC
BNB_USD_ORACLE=chainlink_bnb_usd_feed_address
CAKE_USD_ORACLE=chainlink_cake_usd_feed_address
```

### How to run tests

```
bun run test
```

### How to publish

```
bun run pub
```

### Deployment to BNB Chain

Deploy to BSC Testnet:

```bash
NODE_OPTIONS='--experimental-loader ts-node/esm/transpile-only' bun run hardhat --network testnet deploy
```

Deploy to BSC Mainnet:

```bash
NODE_OPTIONS='--experimental-loader ts-node/esm/transpile-only' bun run hardhat --network bsc deploy
```

**Available BNB Chain Networks**: The hardhat configuration includes support for:

- `bsc` - BSC Mainnet (Chain ID: 56)
- `bscTestnet` - BSC Testnet (Chain ID: 97)
- `plasma` - Plasma Network (Chain ID: 9745)

Full list of available networks is in [hardhat.config.cts](hardhat.config.cts#L38).

### Verify on BSCScan

After deployment, verify your contracts on BSCScan:

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Release flow

1. Create a `feature` branch from `staging` branch
2. Make code updates
3. Ensure you are synced up with `staging`
4. Code should now be in a state where you think it can be deployed to production
5. Create a "Release Candidate" [release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) on GitHub. This will be of the form `v1.2.3-RC0`. This tagged commit is now subject to our bug bounty.
6. Have the tagged commit audited if necessary
7. If changes are required, make the changes and then once ready for review create another GitHub release with an incremented RC value `v1.2.3-RC0` -> `v.1.2.3-RC1`. Repeat as necessary.
8. Deploy to testnet. Open a pull request to merge the deploy artifacts into
   the `feature` branch. Create GitHub release of the form `v1.2.3-testnet` from the commit that has the new deployment artifacts.
9. Get someone to review and approve the deployment and then merge. You now MUST merge this branch into `staging` branch.
10. If any further changes are needed, you can either make them on the existing feature branch that is in sync or create a new branch, and follow steps 1 -> 9. Repeat as necessary.
11. Make a deployment to ethereum mainnet from `staging`. Create a GitHub release of the form `v1.2.3` from the commit that has the new deployment artifacts.
12. Open a PR to merge into `main`. Have it reviewed and merged.

### Cherry-picked release flow

Certain changes can be released in isolation via cherry-picking, although ideally we would always release from `staging`.

1. Create a new branch from `mainnet`.
2. Cherry-pick from `staging` into new branch.
3. Deploy to ethereum mainnet, tag the commit that has deployment artifacts and create a release.
4. Merge into `mainnet`.

### Emergency release process

1. Branch from `main`, make fixes, deploy to testnet (can skip), deploy to mainnet
2. Merge changes back into `main` and `staging` immediately after deploy
3. Create GitHub releases, if you didn't deploy to testnet in step 1, do it now

### Notes

- Deployed code should always match source code in mainnet releases. This may not be the case for `staging`.
- `staging` branch and `main` branch should start in sync
- `staging` is intended to be a practice `main`. Only code that is intended to be released to `main` can be merged to `staging`. Consequently:
  - Feature branches will be long-lived
  - Feature branches must be kept in sync with `staging`
  - Audits are conducted on feature branches
- All code that is on `staging` and `main` should be deployed to testnet and mainnet respectively i.e. these branches should not have any undeployed code
- It is preferable to not edit the same file on different feature branches.
- Code on `staging` and `main` will always be a subset of what is deployed, as smart contracts cannot be undeployed.
- Release candidates, `staging` and `main` branch are subject to our bug bounty
- Releases follow semantic versioning and releases should contain a description of changes with developers being the intended audience

## BNB Chain Specific Features

This DNS system is specifically designed and optimized for BNB Chain:

### Multi-Token Pricing on BSC

The TokenPriceOracle contract supports three payment methods, all native to BNB Chain:

1. **BNB** - Native currency of BNB Smart Chain
2. **CAKE** - PancakeSwap's native token on BSC
3. **USD1** - Stablecoin on BSC

Prices are determined via Chainlink price feeds deployed on BNB Chain for accurate BNB/USD and CAKE/USD conversion.

### PancakeSwap Integration

The system integrates with PancakeSwap V3 deployed on BNB Chain:

- Uses PancakeSwap's pool factory for liquidity
- Leverages CAKE token for payment options
- Benefits from BSC's DeFi ecosystem

### Referral Rewards on BSC

The ReferralController allocates a portion of each domain registration fee to referrers:

- Referral tracking on-chain on BSC
- Instant rewards in BNB, CAKE, or USD1
- Transparent referral analytics

### Why BNB Chain?

1. **Low Gas Costs**: Domain registration costs pennies in gas fees on BSC
2. **Fast Finality**: 3-second block times for instant domain confirmation
3. **Chainlink Integration**: Reliable price oracles for multi-token pricing
4. **PancakeSwap Ecosystem**: Native CAKE token payment option
5. **BSCScan Verification**: Full contract transparency and verification

## Network Information

### BSC Mainnet (Primary Deployment)

- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **ENS Registry**: Deployed on BSC
- **Chainlink Oracles**: BNB/USD, CAKE/USD price feeds available

### BSC Testnet (Development)

- **Chain ID**: 97
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

### Plasma Network (Alternative)

- **Chain ID**: 9745
- **Custom BNB Chain deployment option**

## Integration with Safuverse

The .id domain system integrates with other Safuverse components on BNB Chain:

- **SafuAcademyy**: Domain-gated course enrollment
- **Safucard**: Domain holder NFT bonuses
- **safupad**: Enhanced launch permissions for domain owners
- **SafuAgents**: Domain-based identity for AI agents

All integrations occur on-chain on BNB Chain.

## Frontend Application

The SafuDomains frontend is a modern React-based web application deployed at [names.safuverse.com](https://names.safuverse.com), providing a user-friendly interface for domain registration and management on BNB Chain.

### Frontend Technology Stack

- **Framework**: React 18.3+ with TypeScript
- **Build Tool**: Vite 5.x for fast development and optimized production builds
- **Styling**: Tailwind CSS 4.x with custom theme
- **Web3 Integration**:
  - **Wagmi v2**: React hooks for Ethereum/BSC
  - **RainbowKit**: Wallet connection UI with multi-wallet support
  - **Ethers v5**: Blockchain interactions
  - **Viem**: Modern alternative to ethers for some operations
- **State Management**:
  - TanStack Query (React Query) for server state
  - React Context for app state
- **Data Fetching**:
  - Apollo Client for GraphQL queries
  - Axios for REST API calls
- **Additional Features**:
  - Web3Auth for social login options
  - Binance W3W connector for Binance Wallet
  - Transak SDK for fiat on-ramp
  - Fabric.js for canvas-based NFT rendering
  - Flutterwave for payment processing

### Frontend Setup

#### Prerequisites

- Node.js 18+ and npm/yarn/bun
- Git
- A code editor (VS Code recommended)

#### Installation

```bash
# Clone the repository
git clone https://github.com/Level3AI-hub/Safuverse.git
cd Safuverse/SafuDomains/frontend

# Install dependencies
npm install
# or
bun install
```

#### Environment Configuration

Create a `.env` file in the `frontend` directory:

```bash
# Web3Auth Client ID (for social login)
VITE_CLIENT_ID=your_web3auth_client_id

# Flutterwave Public Key (for payments)
VITE_FLUTTERWAVE_KEY=your_flutterwave_public_key

# Backend API URL (if applicable)
VITE_API_URL=https://api.safuverse.com

# API Key (if required)
VITE_API_KEY=your_api_key

# WalletConnect Project ID (for wallet connections)
VITE_WC_PROJECT_ID=your_walletconnect_project_id
```

**Note**: Replace placeholder values with your actual API keys and configuration.

#### Development Commands

```bash
# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Frontend Architecture

#### Key Files and Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # App entry point with providers
│   ├── wagmi.ts            # Wagmi configuration
│   ├── web3auth.ts         # Web3Auth configuration
│   ├── constant.ts         # Contract addresses and constants
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

#### Contract Integration

The frontend connects to deployed contracts on BNB Chain using addresses defined in `src/constant.ts`:

```typescript
export const constants = {
  Controller: '0x48511b6c15fe1F89bAf6b30dBFA35bF0eAaEB751',
  Registry: '0x6aEFc7ac590096c08187a9052030dA59dEd7E996',
  ReverseRegistrar: '0xc070aAcE207ad5eb2A460D059785ffC9D4D2C536',
  BaseRegistrar: '0xc85f95FCe09b582D546606f591CEEC88D88714f5',
  NameWrapper: '0x86a930d1931C11e3Ec46b3A050E27F29bF94B612',
  PublicResolver: '0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357',
  Referral: '0x182690bD985ef02Ae44A6F8a2e71666bDe1196E2',
}
```

#### Wallet Support

The application supports multiple wallet providers through RainbowKit:

- **Rainbow Wallet**
- **Binance Wallet** (W3W connector)
- **MetaMask**
- **Coinbase Wallet**
- **WalletConnect** (for mobile wallets)
- **Web3Auth** (social login)

#### Network Configuration

Configured for BNB Smart Chain (BSC) in `src/main.tsx` and `src/wagmi.ts`:

```typescript
import { bsc } from 'wagmi/chains'

const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})
```

#### GraphQL Integration

The app uses Apollo Client to query The Graph subgraph for domain data:

```typescript
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/112443/ens-subgraph/v0.0.1',
  }),
  cache: new InMemoryCache(),
})
```

### Deployment

#### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory with:

- Code splitting for wagmi, RainbowKit, and Apollo Client
- Minified JavaScript and CSS
- Optimized assets

#### Deploy to Vercel

The project includes `vercel.json` for easy deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

#### Other Deployment Options

The built static files in `dist/` can be deployed to:

- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Any static hosting service

### Frontend Features

1. **Domain Search & Registration**

   - Real-time availability checking
   - Multi-token payment (BNB, CAKE, USD1)
   - Price calculation with Chainlink oracles

2. **Domain Management**

   - Set resolver records (addresses, text records, etc.)
   - Transfer ownership
   - Renew domains
   - Manage subdomains

3. **Referral System**

   - Share referral links
   - Track referral earnings
   - Automatic reward distribution

4. **Wallet Integration**

   - Multi-wallet support via RainbowKit
   - Social login via Web3Auth
   - Seamless BNB Chain connection

5. **Responsive Design**
   - Mobile-first approach
   - Dark theme with custom orange accent
   - Smooth animations and transitions

### Troubleshooting

**Common Issues:**

1. **Wallet connection fails**

   - Ensure you're on BNB Chain (Chain ID: 56)
   - Try clearing browser cache
   - Update MetaMask/wallet extension

2. **Build errors with polyfills**

   - The project uses `vite-plugin-node-polyfills` for Node.js compatibility
   - Buffer and process are polyfilled in `index.html`

3. **Environment variables not working**
   - Ensure `.env` file is in the `frontend/` directory
   - All Vite env vars must be prefixed with `VITE_`
   - Restart dev server after changing `.env`

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)
- **Smart Contracts**: Solidity 0.8.17
- **Development**: Hardhat 2.x with TypeScript
- **Testing**: Mocha, Chai
- **Price Oracles**: Chainlink on BSC
- **DEX Integration**: PancakeSwap V3
- **Verification**: BSCScan
- **Frontend**: React 18 + TypeScript + Vite + Wagmi + RainbowKit

## Support & Resources

- **Live App**: https://.level3labs.fun (on BNB Chain)
- **ENS Documentation**: https://docs.ens.domains
- **BNB Chain Docs**: https://docs.bnbchain.org
- **Chainlink BSC**: https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain
- **Email**: info@level3labs.fun

---

**Deployed on BNB Chain and Powered by .id** - Decentralized .id domains on BNB Smart Chain with multi-token pricing and referral rewards.
