# SafucardNFT - Smart Contracts

ERC721 NFT smart contract **deployed on BNB Chain** with dynamic USD-pegged pricing powered by Chainlink oracles.

## Deployment Information

**Network**: BNB Smart Chain (BSC)

- **Mainnet Chain ID**: 56
- **Testnet Chain ID**: 97

This contract is specifically designed for deployment on BNB Chain, utilizing Chainlink price feed oracles available on the BSC network to maintain a stable $5 USD mint price regardless of BNB price fluctuations.

## Contract Overview

**Contract Name**: ScorecardNFT
**Symbol**: SCNFT
**Token Name**: Safucard

### Key Features

1. **Dynamic BNB Pricing**: Mint fee is always $5 USD, converted to BNB using Chainlink oracle on BSC
2. **URI Freezing**: Token metadata URI is frozen after minting (immutable)
3. **Oracle Integration**: Uses Chainlink BNB/USD price feed on BNB Chain
4. **Secure Withdrawals**: Owner-only fund withdrawal function
5. **ERC721 Standard**: Full ERC721 compliance with URI storage extension

## Smart Contract Details

### Constructor Parameters

```solidity
constructor(address oracleAddress)
```

- `oracleAddress`: Chainlink BNB/USD price feed oracle address on BSC
  - **BSC Mainnet Oracle**: Check Chainlink documentation for current address
  - **BSC Testnet Oracle**: Check Chainlink documentation for testnet address

### Main Functions

#### `mintNFT(string memory _URI) public payable returns (uint256)`

Mints a new Safucard NFT to the caller.

**Parameters**:

- `_URI`: IPFS or HTTP URI for the scorecard metadata

**Requirements**:

- Must send sufficient BNB to cover $5 USD mint fee
- URI can only be set once per token (frozen after mint)

**Returns**: Token ID of newly minted NFT

**Emits**: `NFTMinted(address recipient, uint256 tokenId, string tokenURI)`

#### `getMintFeeInNative() public view returns (uint256)`

Returns the current mint fee in BNB (18 decimals) equivalent to $5 USD.

**How it works**:

1. Fetches current BNB/USD price from Chainlink oracle on BSC
2. Calculates BNB amount needed for $5 USD
3. Returns the amount in wei (18 decimals)

**Example**:

- If BNB = $600, mint fee = 0.00833... BNB
- If BNB = $300, mint fee = 0.01666... BNB

#### `withdrawFunds() external onlyOwner`

Allows contract owner to withdraw accumulated mint fees.

**Requirements**: Only callable by contract owner

**Emits**: `FundsWithdrawn(address owner, uint256 amount)`

### Internal Functions

#### `_setTokenURI(uint256 tokenId, string memory tokenURI_) internal override`

Sets token URI with freeze protection - can only be set once per token.

**Security**: Prevents metadata manipulation after minting

## Chainlink Oracle Integration

The contract uses Chainlink's price feed interface on BNB Chain:

```solidity
interface IPriceOracle {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,      // Price with 8 decimals
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
}
```

### BNB/USD Oracle on BSC

The oracle provides BNB/USD price with 8 decimal precision, updated regularly on BNB Chain by Chainlink node operators.

## Development Setup

### Prerequisites

- Node.js 18+
- Hardhat
- BNB Chain wallet with testnet/mainnet BNB
- BSCScan API key (for verification)

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Gas Reporting

```bash
REPORT_GAS=true npx hardhat test
```

## Deployment

### Configure Hardhat for BNB Chain

Create `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.28",
  networks: {
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY],
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY,
  },
};
```

### Environment Variables

Create `.env`:

```bash
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key
BSC_RPC_URL=https://bsc-dataseed.binance.org/
CHAINLINK_BNB_USD_ORACLE=0x... # Chainlink oracle address on BSC
```

### Deploy to BSC Testnet

```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

### Deploy to BSC Mainnet

```bash
npx hardhat run scripts/deploy.ts --network bsc
```

### Deployment Script Example

Create `scripts/deploy.ts`:

```javascript
const hre = require("hardhat");

async function main() {
  // Chainlink BNB/USD oracle address on BSC
  const oracleAddress = process.env.CHAINLINK_BNB_USD_ORACLE;

  console.log("Deploying ScorecardNFT to BNB Chain...");

  const ScorecardNFT = await hre.ethers.getContractFactory("ScorecardNFT");
  const scorecard = await ScorecardNFT.deploy(oracleAddress);

  await scorecard.waitForDeployment();

  const address = await scorecard.getAddress();
  console.log("ScorecardNFT deployed to:", address);
  console.log("Verify on BSCScan with:");
  console.log(`npx hardhat verify --network bsc ${address} ${oracleAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## Verification on BSCScan

After deployment, verify the contract:

```bash
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <ORACLE_ADDRESS>
```

Example:

```bash
npx hardhat verify --network bsc 0x123... 0xabc...
```

## Contract Interaction

### Get Current Mint Fee (in BNB)

```javascript
const fee = await scorecardNFT.getMintFeeInNative();
console.log("Mint fee:", ethers.formatEther(fee), "BNB");
```

### Mint NFT

```javascript
const uri = "ipfs://Qm.../metadata.json";
const fee = await scorecardNFT.getMintFeeInNative();

const tx = await scorecardNFT.mintNFT(uri, {
  value: fee,
});

await tx.wait();
console.log("NFT minted!");
```

### Withdraw Funds (Owner Only)

```javascript
const tx = await scorecardNFT.withdrawFunds();
await tx.wait();
console.log("Funds withdrawn");
```

## Security Features

1. **Oracle Validation**: Checks oracle price is positive before calculation
2. **URI Freezing**: Metadata cannot be changed after minting
3. **Access Control**: Only owner can withdraw funds
4. **Reentrancy Protection**: Uses OpenZeppelin's secure patterns
5. **Safe Minting**: Uses `_safeMint` to prevent token loss

## Events

### NFTMinted

```solidity
event NFTMinted(address indexed recipient, uint256 tokenId, string tokenURI)
```

Emitted when a new scorecard NFT is minted.

### FundsWithdrawn

```solidity
event FundsWithdrawn(address indexed owner, uint256 amount)
```

Emitted when the owner withdraws accumulated fees.

## Technology Stack

- **Blockchain**: BNB Smart Chain (BSC)
- **Solidity**: 0.8.28
- **Framework**: Hardhat
- **Standards**: ERC721, ERC721URIStorage, ERC721Burnable
- **Libraries**: OpenZeppelin Contracts 5.x
- **Oracle**: Chainlink Price Feeds on BSC

## Network Information

### BSC Mainnet

- **Chain ID**: 56
- **RPC**: https://bsc-dataseed.binance.org/
- **Explorer**: https://bscscan.com
- **Chainlink Docs**: https://docs.chain.link/data-feeds/price-feeds/addresses?network=bnb-chain

### BSC Testnet

- **Chain ID**: 97
- **RPC**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com
- **Faucet**: https://testnet.bnbchain.org/faucet-smart

## Gas Optimization

The contract is optimized for gas efficiency:

- Single storage slot for token ID counter
- Efficient oracle price calculation
- Minimal storage writes

Estimated gas costs on BSC:

- **Mint**: ~150,000-200,000 gas (very cheap on BSC)
- **Withdraw**: ~30,000 gas

## Testing

Run comprehensive tests:

```bash
npx hardhat test
```

Test coverage includes:

- Minting with correct fee
- URI freeze functionality
- Oracle price integration
- Withdrawal permissions
- Edge cases and reverts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Test on BSC Testnet
5. Submit a pull request

## License

MIT License

## Support

For questions or issues:

- Email: info@level3labs.fun
- GitHub Issues
- BNB Chain Documentation: https://docs.bnbchain.org

---

**Deployed on BNB Chain and Powered by .safu** - Dynamic USD-pegged NFT minting powered by Chainlink oracles on BSC.
