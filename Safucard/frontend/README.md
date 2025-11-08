# Safucard Frontend

React-based decentralized application (dApp) **deployed for BNB Chain** that generates personalized wallet scorecard NFTs with on-chain minting on BNB Smart Chain.

## Overview

Safucard is a Web3 application that allows users to:
1. Input their **BNB Chain wallet address**
2. Receive a customized visual "SafuCard" scorecard based on memecoin activity
3. Mint their SafuCard as an NFT on **BNB Chain**
4. Store metadata on IPFS with minting on BSC

## Deployment Information

**Network**: BNB Smart Chain (BSC)
- **Chain ID**: 56 (BSC Mainnet)
- **Contract Address**: `0x2B20F646CEdB8D40f2a37358A3b712ced3D5B294` (on BSC)

The application is configured to interact exclusively with BNB Chain using wagmi and RainbowKit for wallet connections.

## Features

- **Web3 Wallet Integration**: RainbowKit and wagmi configured for **BNB Chain**
- **BSC Wallet Analysis**: Fetches scorecard data from SafuServer analyzing BSC wallets
- **Canvas Rendering**: Personalized scorecard image using Fabric.js
- **Download & Preview**: Fullscreen preview and download options
- **IPFS Upload**: Metadata and images uploaded to IPFS via Pinata
- **NFT Minting on BSC**: Mints NFT on BNB Chain with Chainlink price feed integration

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Styling**: TailwindCSS
- **Build Tool**: Vite

### Web3 (BNB Chain)
- **Wallet Connection**: RainbowKit, wagmi
- **Blockchain Interaction**: ethers.js v6
- **Network**: BNB Smart Chain (BSC)
- **Price Feeds**: Chainlink oracles on BSC

### Graphics & Storage
- **Canvas**: fabric.js for scorecard generation
- **IPFS**: Pinata via backend proxy
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+
- BNB Chain wallet (MetaMask, Trust Wallet, etc.)
- BNB tokens for minting NFTs
- Backend API running (SafuServer)

### Installation

```bash
cd Safucard/frontend
npm install
```

### Environment Variables

Create a `.env` file:

```bash
# Backend API URL
VITE_API_URL=http://localhost:3000

# Smart Contract on BSC
VITE_CONTRACT_ADDRESS=0x2B20F646CEdB8D40f2a37358A3b712ced3D5B294

# Chainlink Price Feed on BSC
VITE_PRICE_ORACLE=0x... # BNB/USD oracle address

# Optional: WalletConnect Project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Usage

### User Flow

1. **Connect Wallet**: Click **Connect Wallet** and select your BNB Chain wallet
   - Ensure your wallet is on **BSC Mainnet** (Chain ID: 56)

2. **Enter Address**: Input your BNB Chain wallet address (0x...)

3. **Generate Card**: Click **Search** to:
   - Fetch memecoin score from SafuServer
   - Analyze BSC wallet activity
   - Generate visual scorecard

4. **Preview**: View your scorecard with:
   - **Download** button to save as image
   - **Fullscreen** button to preview

5. **Mint NFT**: Click **Mint NFT** to:
   - Upload scorecard to IPFS
   - Calculate mint fee (5 USD in BNB via Chainlink)
   - Mint NFT on BNB Chain
   - Receive NFT in your BSC wallet

## Smart Contract Integration

### Contract Details

- **Address**: `0x2B20F646CEdB8D40f2a37358A3b712ced3D5B294` (BSC)
- **Network**: BNB Smart Chain (Chain ID: 56)
- **Function**: `mintNFT(tokenURI)`
- **Price**: 5 USD (converted to BNB via Chainlink oracle on BSC)

### Price Calculation

The contract uses Chainlink's BNB/USD price feed on BSC:
- Fetches current BNB price
- Calculates required BNB for $5 USD
- User pays dynamic BNB amount

Example:
- If BNB = $600 → 0.00833 BNB mint fee
- If BNB = $300 → 0.01666 BNB mint fee

### Minting Process

```typescript
// 1. Get mint fee in BNB
const fee = await contract.getMintFeeInNative();

// 2. Upload to IPFS
const tokenURI = await uploadToIPFS(metadata);

// 3. Mint NFT on BSC
const tx = await contract.mintNFT(tokenURI, { value: fee });

// 4. Wait for BSC confirmation
await tx.wait();
```

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx              # Main component with minting logic
│   ├── App.css              # Styling
│   ├── contract-abi.json    # NFT contract ABI (BSC)
│   ├── price-abi.json       # Chainlink price feed ABI (BSC)
│   └── main.tsx             # Entry point
├── public/
│   ├── token.jpg            # Scorecard background
│   ├── bronze.png           # Rank images
│   ├── silver.png
│   ├── gold.png
│   └── diamond.png
├── .env                     # Environment variables
├── package.json
└── vite.config.ts
```

## Configuration

### wagmi Configuration for BNB Chain

The app is configured to use BSC in wagmi:

```typescript
import { bsc } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'Safucard',
  projectId: 'YOUR_PROJECT_ID',
  chains: [bsc], // BSC Mainnet
});
```

### Network Switching

If users are on the wrong network, the app will prompt them to switch to BSC.

## API Integration

### SafuServer Endpoints

**Get Wallet Score**:
```typescript
GET /api/address/${address}

Response:
{
  address: "0x...",
  score: 850,
  rank: "diamond",
  tokens: [...],
  totalValue: 2500
}
```

**Upload to IPFS**:
```typescript
POST /api/upload

Body: {
  image: "base64...",
  metadata: {...}
}

Response: {
  ipfsHash: "QmXxx...",
  url: "ipfs://QmXxx.../metadata.json"
}
```

## Network Information

### BSC Mainnet
- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **Contract**: 0x2B20F646CEdB8D40f2a37358A3b712ced3D5B294

### Getting BNB for Minting
- Buy BNB on exchanges (Binance, KuCoin, etc.)
- Bridge from other chains
- Use BSC faucet for testnet

## Dependencies

- [React](https://reactjs.org/) - UI framework
- [wagmi](https://wagmi.sh/) - React hooks for Ethereum (BSC compatible)
- [RainbowKit](https://www.rainbowkit.com/) - Wallet connection UI
- [fabric.js](http://fabricjs.com/) - Canvas manipulation
- [axios](https://axios-http.com/) - HTTP requests
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [ethers.js](https://docs.ethers.org/) - Blockchain interaction

## Development Notes

### Testing on BSC Testnet

To test on BSC Testnet:
1. Update wagmi config to include `bscTestnet`
2. Deploy contract to BSC Testnet
3. Get testnet BNB from [faucet](https://testnet.bnbchain.org/faucet-smart)
4. Update `VITE_CONTRACT_ADDRESS` to testnet address

### Canvas Rendering

The scorecard is generated using fabric.js:
- Background image loaded
- Wallet address overlaid
- Score and rank displayed
- Status badge added based on rank

## Troubleshooting

### Wallet Not Connecting
- Ensure you're using a BSC-compatible wallet
- Check that MetaMask has BSC network added
- Verify internet connection

### Wrong Network Error
- Switch to BSC Mainnet (Chain ID: 56) in your wallet
- The app will prompt you to switch networks

### Mint Transaction Failing
- Ensure you have enough BNB for gas + mint fee
- Check contract is deployed on BSC
- Verify price oracle is functioning

## Security

- Never commit private keys or sensitive data
- Validate all user inputs
- Use secure HTTPS connections
- Audit smart contract before mainnet deployment

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test on BSC Testnet
4. Submit a pull request

## License

MIT License

## Author

**Desmond Egwurube** - Safucard Frontend Development

## Support

- **Email**: info@level3labs.fun
- **Documentation**: See main Safuverse repository
- **BNB Chain Docs**: https://docs.bnbchain.org

---

**Built on BNB Chain** - Generate and mint personalized wallet scorecard NFTs on BNB Smart Chain.
