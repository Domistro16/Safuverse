import type { HardhatUserConfig } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, task } from "hardhat/config";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import hardhatNetworkHelpersPlugin from "@nomicfoundation/hardhat-network-helpers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import "@nomicfoundation/hardhat-ethers-chai-matchers";
import "dotenv/config"
const config: HardhatUserConfig = {
  plugins: [
    hardhatToolboxMochaEthersPlugin,
    hardhatNetworkHelpersPlugin,
    hardhatNetworkHelpers,
    hardhatTypechain,
    hardhatVerify,
  ],

  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
      allowUnlimitedContractSize: true,
      forking: {
        enabled: true,
        url: "https://bsc-dataseed.binance.org/",
      },
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
      allowUnlimitedContractSize: true,
      forking: {
        enabled: true,
        url: "https://bsc-testnet-rpc.publicnode.com",
      },
    },
    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: "https://bsc-testnet-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY || ''],

    },
    bsc: {
      type: "http",
      chainType: "l1",
      url: "https://bsc-rpc.publicnode.com",
      accounts: [process.env.PRIVATE_KEY || ''],
    },
  },
  verify: {
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY || '',
    },
  },
  tasks: [
    task("multify", "Verify contracts using etherscan v2 api")
      .addPositionalArgument({
        name: "contractName",
        description: "The contract name to verify",
      })
      .addPositionalArgument({
        name: "address",
        description: "The contract address to verify",
      })
      .addVariadicArgument({
        name: "deployArgs",
        description: "Constructor arguments",
      })
      .setAction(() => import("./tasks/multify.js"))
      .build(),
  ],
};

export default config;
