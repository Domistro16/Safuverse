// from @nomicfoundation/hardhat-toolbox-viem to avoid module issue
// Temporarily disabled due to dependency issues without bun
// import '@nomicfoundation/hardhat-ignition-viem'
import '@nomicfoundation/hardhat-verify'
import '@nomicfoundation/hardhat-viem'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import './tasks/hardhat-deploy-viem.cjs'

import dotenv from 'dotenv'
import 'hardhat-abi-exporter'
import 'hardhat-contract-sizer'
import 'hardhat-deploy'
import '@nomicfoundation/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/config'

import('@ensdomains/hardhat-chai-matchers-viem')
// hardhat actions
import './tasks/esm_fix.cjs'

// Load environment variables from .env file. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.
// https://github.com/motdotla/dotenv
dotenv.config({ debug: false })
let real_accounts = undefined
if (process.env.DEPLOYER_KEY) {
  real_accounts = [
    process.env.DEPLOYER_KEY,
    process.env.OWNER_KEY || process.env.DEPLOYER_KEY,
  ]
}

// circular dependency shared with actions
export const archivedDeploymentPath = './deployments/archive'

const config = {
  networks: {
    hardhat: {
      saveDeployments: false,
      tags: ['test', 'legacy', 'use_root'],
      allowUnlimitedContractSize: true,
    },
    level3chain: {
      chainId: 7777771,
      url: 'http://localhost:8545', // or your DigitalOcean-hosted endpoint
      accounts: real_accounts,
    },
    localhost: {
      url: 'http://127.0.0.1:8545/',
      tags: ['test', 'legacy', 'use_root'],
    },
    testnet: {
      url: `https://bsc-testnet-rpc.publicnode.com`,
      tags: ['test', 'use_root'],
      chainId: 97,
      accounts: real_accounts,
    },
    bsc: {
      url: `https://bsc-dataseed1.binance.org/`,
      tags: ['legacy', 'use_root'],
      chainId: 56,
      accounts: real_accounts,
    },
  },
  mocha: {},
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1200,
          },
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata'],
              '': ['ast'], // Make sure AST is included
            },
          },
        },
      },
      // for DummyOldResolver contract
      {
        version: '0.4.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1200,
          },
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata'],
              '': ['ast'], // Make sure AST is included
            },
          },
        },
      },
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1200,
          },

          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata'],
              '': ['ast'], // Make sure AST is included
            },
          },
        },
      },
    ],
    overrides: {
      'node_modules/@uniswap/v3-periphery/**': { version: '0.7.6' },
      'contracts/ethregistrar/ETHRegistrarController.sol': {
        version: '0.8.17',
        settings: {

          optimizer: {
            enabled: true,
            runs: 1200,
          },
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'metadata'],
              '': ['ast'], // Make sure AST is included
            },
          },
        },
      },
    },
  },
  abiExporter: {
    path: './build/contracts',
    runOnCompile: true,
    clear: true,
    flat: true,
    except: [
      'Controllable$',
      'INameWrapper$',
      'IBaseRegistrar$',
      'SHA1$',
      'Ownable$',
      'NameResolver$',
      'TestBytesUtils$',
      'legacy/*',
    ],
    spacing: 2,
    pretty: true,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    owner: {
      default: 1,
      9745: '0x2A0D7311fA7e9aC2890CFd8219b2dEf0c206E79B',
      56: '0xD83deFbA240568040b39bb2C8B4DB7dB02d40593',
      97: '0xd83defba240568040b39bb2c8b4db7db02d40593',
    },
  },
  external: {
    contracts: [
      {
        artifacts: [archivedDeploymentPath],
      },
    ],
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.BSCSCAN_API_KEY,
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    enabled: true,
  },
} satisfies HardhatUserConfig

export default config
