# Contract ABIs

This directory should contain the ABI files for the SafuPad contracts.

## Required Files

Place the following ABI JSON files in this directory:

1. **LaunchpadManager.json** - ABI for LaunchpadManagerV2/V3 contract
2. **TokenFactory.json** - ABI for TokenFactoryV2 contract
3. **BondingDEX.json** - ABI for BondingDEX contract
4. **ERC20.json** - Standard ERC20 ABI

## Generating ABIs from Hardhat

If you're using Hardhat, you can extract ABIs from the artifacts:

```bash
# From the SafuPad directory, run:
node scripts/extract-abis.js
```

Or manually copy from:
```
artifacts/contracts/LaunchpadManagerV2.sol/LaunchpadManagerV3.json
artifacts/contracts/TokenFactoryV2.sol/TokenFactoryV2.json
artifacts/contracts/BondingDEX.sol/BondingDEX.json
```

Extract the `abi` field from each artifact file and save as a JSON file in this directory.

## Example ERC20.json

For a standard ERC20 ABI, you can use:

```json
[
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  }
]
```
