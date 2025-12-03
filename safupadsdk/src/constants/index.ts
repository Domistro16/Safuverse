// src/constants/index.ts
import { NetworkConfig, SDKConfig } from '../types';
/**
 * Network configurations
 */
export const NETWORKS: Record<string, NetworkConfig> = {
  bsc: {
    name: 'BSC Mainnet',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    alchemyRpcUrlTemplate: 'https://bnb-mainnet.g.alchemy.com/v2/{apiKey}',
    explorerUrl: 'https://bscscan.com',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/safupad-subgraph/version/latest', // TODO: UPDATE AFTER DEPLOYMENT
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      launchpadManager: '0xcCfcfeB17609f0C5aE604bC71c4907B90B94a3e9', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
      bondingCurveDEX: '0xE96baB0D0661Fbfc710d79d58Cdb32bcD7bB8815', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
      tokenFactory: '0x15E2ccAeb4D1eeA1A7b8d839FFA30D63519D1c50', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
      priceOracle: '0x3De1d0D44c9609b99D05BA14Ff48c691fF6059Ff', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
      lpFeeHarvester: '0x8b4499143ac1CDb7bDB25a2FEc1786F8BD9772F9', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
      pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      pancakeFactory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    },
  },

  bscTestnet: {
    name: 'BSC Testnet',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    alchemyRpcUrlTemplate: 'https://bnb-testnet.g.alchemy.com/v2/{apiKey}',
    explorerUrl: 'https://testnet.bscscan.com',
    subgraphUrl:
      'https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/safupad-testnet/version/latest', // TODO: UPDATE AFTER DEPLOYMENT
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    contracts: {
      launchpadManager: '0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c',
      bondingCurveDEX: '0x14eB3B6C297ff6fefc25c0E0d289Bf8348e864f6',
      tokenFactory: '0xcb7526b9598240A737237C52f852705e6A449cD0',
      priceOracle: '0x56f0b1f80F8cc37f875Be42e2f4D09810514F346',
      lpFeeHarvester: '0xa886B8897814193f99A88701d70b31b4a8E27a1E',
      pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
      pancakeFactory: '0x6725F303b657a9451d8BA641348b6761A6CC7a17',
    },
  },

  localhost: {
    name: 'Localhost',
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    explorerUrl: 'http://localhost:8545',
    subgraphUrl: 'http://localhost:8000/subgraphs/name/safupad-subgraph', // Local Graph Node
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      launchpadManager: '0x0000000000000000000000000000000000000000',
      bondingCurveDEX: '0x0000000000000000000000000000000000000000',
      tokenFactory: '0x0000000000000000000000000000000000000000',
      priceOracle: '0x0000000000000000000000000000000000000000',
      lpFeeHarvester: '0x0000000000000000000000000000000000000000',
      pancakeRouter: '0x0000000000000000000000000000000000000000',
      pancakeFactory: '0x0000000000000000000000000000000000000000',
    },
  },
};

/**
 * Default SDK configuration
 */
export const DEFAULT_CONFIG: Partial<SDKConfig> = {
  gasLimit: 5000000n,
  gasPrice: 3000000000n, // 3 gwei
};

/**
 * Contract constants (LaunchpadManagerV3 - Monad)
 */
export const CONSTANTS = {
  // Launch parameters - MON amounts (Monad native currency)
  MIN_RAISE_MON: '5000000', // 5M MON
  MAX_RAISE_MON: '20000000', // 20M MON
  MAX_CONTRIBUTION_PER_WALLET: '50000', // 50K MON per wallet
  RAISE_DURATION: 72 * 60 * 60, // 72 hours (3 days) in seconds

  // Token allocation percentages
  FOUNDER_ALLOCATION: 60, // 60% to founder
  CONTRIBUTOR_ALLOCATION: 20, // 20% for contributors
  PANCAKESWAP_ALLOCATION: 10, // 10% for PancakeSwap liquidity
  VESTED_ALLOCATION: 10, // 10% vested (conditional - community control)

  // Founder token release
  IMMEDIATE_FOUNDER_RELEASE: 100, // 100% of founder allocation released immediately (no vesting on founder tokens)

  // Liquidity percentages
  LIQUIDITY_TOKEN_PERCENT: 10, // 10% of token supply for liquidity
  LIQUIDITY_MON_PERCENT: 20, // 20% of raised MON for liquidity

  // Vesting (for conditional 10% allocation)
  MIN_VESTING_DURATION: 90 * 24 * 60 * 60, // 90 days
  MAX_VESTING_DURATION: 180 * 24 * 60 * 60, // 180 days
  VESTING_RELEASE_INTERVAL: 30 * 24 * 60 * 60, // 30 days
  MARKET_CAP_CHECK_MONTHS: 3, // 3 consecutive months below starting market cap triggers community control

  // Platform fees
  PLATFORM_FEE_BPS: 100, // 1% platform fee (100 basis points)
  BASIS_POINTS: 10000,

  // LP Harvester
  CLAIM_COOLDOWN: 24 * 60 * 60, // 24 hours
  HARVEST_COOLDOWN: 24 * 60 * 60, // 24 hours
  MIN_HARVEST_AMOUNT: '0.001', // 0.001 MON
  DEFAULT_LOCK_DURATION: 365 * 24 * 60 * 60, // 365 days
  MIN_LOCK_DURATION: 90 * 24 * 60 * 60, // 90 days
  MAX_LOCK_DURATION: 1460 * 24 * 60 * 60, // 4 years

  // Token supply
  TOTAL_TOKEN_SUPPLY: '1000000000', // 1 billion

  // Burn address
  LP_BURN_ADDRESS: '0x000000000000000000000000000000000000dEaD',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NOT_INITIALIZED: 'SDK not initialized. Call initialize() first.',
  NO_SIGNER: 'No signer available. Connect wallet first.',
  INVALID_NETWORK: 'Invalid network configuration.',
  INVALID_ADDRESS: 'Invalid address provided.',
  INVALID_AMOUNT: 'Invalid amount provided.',
  TRANSACTION_FAILED: 'Transaction failed.',
  INSUFFICIENT_BALANCE: 'Insufficient balance.',
  CONTRACT_ERROR: 'Contract call failed.',
  ALREADY_GRADUATED: 'Pool has already graduated.',
  NOT_GRADUATED: 'Pool has not graduated yet.',
  RAISE_NOT_COMPLETED: 'Raise not completed.',
  NOT_FOUNDER: 'Only founder can perform this action.',
  POOL_NOT_ACTIVE: 'Pool is not active.',
};

/**
 * Event names
 */
export const EVENTS = {
  // LaunchpadManager events
  LAUNCH_CREATED: 'LaunchCreated',
  INSTANT_LAUNCH_CREATED: 'InstantLaunchCreated',
  CONTRIBUTION_MADE: 'ContributionMade',
  RAISE_COMPLETED: 'RaiseCompleted',
  FOUNDER_TOKENS_CLAIMED: 'FounderTokensClaimed',
  RAISED_FUNDS_CLAIMED: 'RaisedFundsClaimed',
  GRADUATED_TO_PANCAKESWAP: 'GraduatedToPancakeSwap',
  LP_BURNED: 'LPBurned',
  LP_LOCKED: 'LPLocked',
  TRANSFERS_ENABLED: 'TransfersEnabled',

  // BondingCurveDEX events
  POOL_CREATED: 'PoolCreated',
  TOKENS_BOUGHT: 'TokensBought',
  TOKENS_SOLD: 'TokensSold',
  POOL_GRADUATED: 'PoolGraduated',
  FEES_COLLECTED: 'FeesCollected',
  CREATOR_FEES_CLAIMED: 'CreatorFeesClaimed',
  POST_GRADUATION_SELL: 'PostGraduationSell',
  LP_TOKENS_HANDLED: 'LPTokensHandled',

  // LPFeeHarvester events
  FEES_HARVESTED: 'FeesHarvested',
  FEES_DISTRIBUTED: 'FeesDistributed',
  LP_UNLOCKED: 'LPUnlocked',
  EMERGENCY_UNLOCK: 'EmergencyUnlock',
  LOCK_EXTENDED: 'LockExtended',
};

/**
 * ABI fragments for common operations (used if full ABI not available)
 */
export const ABI_FRAGMENTS = {
  ERC20: [
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
  ],
};

/**
 * Utility constants
 */
export const UTILS = {
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
  DEAD_ADDRESS: '0x000000000000000000000000000000000000dEaD',
  MAX_UINT256: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
};

/**
 * Time constants (in seconds)
 */
export const TIME = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
  MONTH: 30 * 24 * 60 * 60,
  YEAR: 365 * 24 * 60 * 60,
};

/**
 * Block time estimates (in seconds)
 */
export const BLOCK_TIME = {
  bsc: 3,
  bscTestnet: 3,
  ethereum: 12,
};

/**
 * Gas limit estimates for common operations
 */
export const GAS_LIMITS = {
  CREATE_LAUNCH: 5000000n,
  CREATE_INSTANT_LAUNCH: 5000000n,
  CONTRIBUTE: 500000n,
  BUY_TOKENS: 500000n,
  SELL_TOKENS: 500000n,
  CLAIM_FOUNDER_TOKENS: 150000n,
  CLAIM_RAISED_FUNDS: 150000n,
  GRADUATE_TO_PANCAKESWAP: 5000000n,
  HARVEST_FEES: 500000n,
  UNLOCK_LP: 200000n,
  CLAIM_CONTRIBUTOR_TOKENS: 150000n, // Claim tokens after successful raise
  CLAIM_REFUND: 100000n, // Claim refund after failed raise
  BURN_FAILED_RAISE_TOKENS: 100000n, // Burn tokens from failed raise

  // New admin functions
  UPDATE_FALLBACK_PRICE: 50000n, // Update oracle fallback price
  UPDATE_LP_FEE_HARVESTER: 50000n, // Update LP harvester address
  EMERGENCY_WITHDRAW: 100000n,
};
