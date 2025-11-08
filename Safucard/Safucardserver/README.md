# SafuServer - Safucard Backend API

Backend API server for the Safucard NFT system **on BNB Chain**. Analyzes wallet memecoin activity on BSC and provides scorecard data for NFT minting.

## Overview

SafuServer is a Node.js/Express API that:
- Retrieves and analyzes wallet addresses on **BNB Chain**
- Calculates memecoin scores based on BSC token holdings
- Provides data for Safucard NFT generation
- Supports the Safucard frontend and NFT minting on BSC

## BNB Chain Integration

This server specifically analyzes wallets on **BNB Smart Chain (BSC)**:
- Fetches ERC20 token balances from BSC addresses
- Analyzes memecoin transactions on BNB Chain
- Returns data for NFTs minted on BSC
- Integrates with Alchemy or other BSC RPC providers

## Key Features

- **BSC Wallet Analysis**: Retrieves and calculates memecoin scores for BNB Chain addresses
- **Simple Configuration**: Easy setup via environment variables
- **RESTful API**: Clean endpoints for wallet data
- **Fast Performance**: Optimized for quick score calculations
- **IPFS Integration**: Uploads scorecard metadata to IPFS for BSC NFTs

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- Alchemy API key (or other BSC RPC provider)
- Pinata account for IPFS uploads

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Level3AI-hub/Safuverse.git
   cd Safuverse/Safucard/Safucardserver
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (see below)

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

6. **Run production server**:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

Rename `.env.example` to `.env` and configure:

```bash
# BNB Chain RPC Provider
ALCHEMY_KEY=your_alchemy_api_key_for_bsc
BSC_RPC_URL=https://bsc-dataseed.binance.org/  # Optional if using Alchemy

# IPFS Gateway (Pinata)
GATEWAY_URL=https://gateway.pinata.cloud/ipfs/
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Authentication
JWT=your_jwt_secret_key

# Server Configuration
PORT=3000
```

### Alchemy BSC Configuration

To use Alchemy for BNB Chain:
1. Sign up at [Alchemy](https://www.alchemy.com)
2. Create a new app for **BNB Chain**
3. Copy your API key to `ALCHEMY_KEY`

Alchemy supports BSC Mainnet and Testnet.

## API Endpoints

### Get Wallet Score

**Endpoint**: `GET /api/address/:address`

**Description**: Returns the wallet's memecoin scorecard details for a BNB Chain address

**Parameters**:
- `address` (path): BNB Chain wallet address (0x...)

**Response**:
```json
{
  "address": "0x...",
  "score": 850,
  "tokens": [
    {
      "symbol": "SAFEMOON",
      "balance": "1000000",
      "value": 150
    }
  ],
  "rank": "Diamond",
  "totalValue": 2500
}
```

**Example**:
```bash
curl http://localhost:3000/api/address/0x1234...
```

### Upload to IPFS

**Endpoint**: `POST /api/upload`

**Description**: Uploads scorecard metadata and image to IPFS

**Request Body**:
```json
{
  "image": "base64_encoded_image",
  "metadata": {
    "name": "Safucard #123",
    "description": "BSC Wallet Scorecard",
    "attributes": [...]
  }
}
```

**Response**:
```json
{
  "ipfsHash": "QmXxxx...",
  "url": "ipfs://QmXxxx.../metadata.json"
}
```

## How It Works

### Wallet Analysis on BNB Chain

1. **Fetch Wallet Data**: Connects to BSC via RPC to get wallet token balances
2. **Identify Memecoins**: Filters for known memecoin contracts on BSC
3. **Calculate Score**: Analyzes portfolio composition and values
4. **Determine Rank**: Assigns rank based on score (Bronze, Silver, Gold, Diamond)
5. **Return Data**: Sends scorecard data to frontend

### Integration with NFT System

1. Frontend requests wallet score from API
2. API analyzes BSC wallet and returns data
3. Frontend generates scorecard image
4. API uploads image + metadata to IPFS
5. Frontend mints NFT on BSC with IPFS URI

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Blockchain**: Web3.js / ethers.js (for BSC)
- **RPC Provider**: Alchemy (BSC support)
- **IPFS**: Pinata for metadata storage
- **Authentication**: JWT

## Development

### Project Structure

```
Safucardserver/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # BSC wallet analysis logic
│   ├── utils/           # Helper functions
│   └── index.js         # Server entry point
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md
```

### Adding New Features

1. Add new route in `src/routes/`
2. Implement BSC integration in `src/services/`
3. Test with BSC Testnet addresses
4. Deploy and test on BSC Mainnet

## Deployment

### Docker

```bash
docker build -t safucardserver .
docker run -p 3000:3000 --env-file .env safucardserver
```

### Traditional Hosting

```bash
npm run build
npm start
```

### Environment-Specific Configuration

- **Development**: Uses BSC Testnet
- **Production**: Uses BSC Mainnet

Ensure `BSC_RPC_URL` and `ALCHEMY_KEY` point to the correct network.

## Network Information

### BSC Mainnet
- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Alchemy**: Available

### BSC Testnet
- **Chain ID**: 97
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Alchemy**: Available

## Security

- Never commit `.env` file
- Use environment variables for all secrets
- Validate wallet addresses before processing
- Rate limit API endpoints
- Sanitize user inputs

## Testing

```bash
npm test
```

Test coverage includes:
- Wallet address validation
- BSC RPC integration
- Score calculation logic
- IPFS upload functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test with BSC Testnet
4. Submit a pull request

## Support

For issues or questions:
- Email: info@level3labs.fun
- GitHub Issues
- BNB Chain Documentation

## License

MIT License

---

**Powered by BNB Chain** - Analyzing memecoin portfolios on BNB Smart Chain for NFT scorecards.
