const fs = require('fs');
const path = require('path');

/**
 * Script to extract ABIs from Hardhat artifacts
 * Run this from the SafuPad directory: node subgraph/scripts/extract-abis.js
 */

const contracts = [
  {
    name: 'LaunchpadManager',
    artifactPath: 'artifacts/contracts/LaunchpadManagerV2.sol/LaunchpadManagerV3.json',
    outputPath: 'subgraph/abis/LaunchpadManager.json'
  },
  {
    name: 'TokenFactory',
    artifactPath: 'artifacts/contracts/TokenFactoryV2.sol/TokenFactoryV2.json',
    outputPath: 'subgraph/abis/TokenFactory.json'
  },
  {
    name: 'BondingDEX',
    artifactPath: 'artifacts/contracts/BondingDEX.sol/BondingDEX.json',
    outputPath: 'subgraph/abis/BondingDEX.json'
  }
];

function extractABI(artifactPath, outputPath) {
  try {
    // Read the artifact file
    const artifactContent = fs.readFileSync(artifactPath, 'utf8');
    const artifact = JSON.parse(artifactContent);

    // Extract just the ABI
    const abi = artifact.abi;

    // Write to output file
    fs.writeFileSync(outputPath, JSON.stringify(abi, null, 2));
    console.log(`✓ Extracted ABI for ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Failed to extract ${artifactPath}:`, error.message);
  }
}

function createERC20ABI() {
  const erc20ABI = [
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
    },
    {
      "constant": false,
      "inputs": [
        {"name": "recipient", "type": "address"},
        {"name": "amount", "type": "uint256"}
      ],
      "name": "transfer",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {"name": "owner", "type": "address"},
        {"name": "spender", "type": "address"}
      ],
      "name": "allowance",
      "outputs": [{"name": "", "type": "uint256"}],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "spender", "type": "address"},
        {"name": "amount", "type": "uint256"}
      ],
      "name": "approve",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {"name": "sender", "type": "address"},
        {"name": "recipient", "type": "address"},
        {"name": "amount", "type": "uint256"}
      ],
      "name": "transferFrom",
      "outputs": [{"name": "", "type": "bool"}],
      "type": "function"
    }
  ];

  fs.writeFileSync('subgraph/abis/ERC20.json', JSON.stringify(erc20ABI, null, 2));
  console.log('✓ Created ERC20.json');
}

console.log('Extracting ABIs from Hardhat artifacts...\n');

// Extract contract ABIs
contracts.forEach(contract => {
  extractABI(contract.artifactPath, contract.outputPath);
});

// Create standard ERC20 ABI
createERC20ABI();

console.log('\nDone! ABIs extracted to subgraph/abis/');
console.log('\nNext steps:');
console.log('1. Update contract addresses in subgraph/subgraph.yaml');
console.log('2. Update startBlock in subgraph/subgraph.yaml');
console.log('3. Run: cd subgraph && npm install');
console.log('4. Run: npm run codegen');
console.log('5. Run: npm run build');
