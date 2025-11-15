// src/types/index.ts
import { ethers } from 'ethers';

/**
 * Network names supported by the SDK
 */
export type NetworkName = 'bsc' | 'bscTestnet' | 'localhost';

/**
 * Launch type enum
 */
export enum LaunchType {
  PROJECT_RAISE = 0,
  INSTANT_LAUNCH = 1,
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  alchemyRpcUrlTemplate?: string; // Template for Alchemy RPC URL (use {apiKey} placeholder)
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    launchpadManager: string;
    bondingCurveDEX: string;
    tokenFactory: string;
    priceOracle: string;
    lpFeeHarvester: string;
    pancakeRouter: string;
    pancakeFactory: string;
  };
}

/**
 * SDK configuration
 */
export interface SDKConfig {
  network?: NetworkName | NetworkConfig;
  provider?: string | ethers.Provider | any; // any for browser wallet
  privateKey?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  alchemyApiKey?: string; // Optional Alchemy API key for event log queries
}

/**
 * Token metadata structure
 */
export interface TokenMetadata {
  logoURI: string;
  description: string;
  website: string;
  twitter: string;
  telegram: string;
  discord: string;
}

/**
 * Launch creation parameters
 * ✅ UPDATED: Removed projectInfoFiWallet, changed to BNB amounts
 */
export interface CreateLaunchParams {
  name: string;
  symbol: string;
  totalSupply: number;
  raiseTargetBNB: string; // ✅ Changed from raiseTargetUSD to raiseTargetBNB
  raiseMaxBNB: string; // ✅ Changed from raiseMaxUSD to raiseMaxBNB
  vestingDuration: number; // in days
  metadata: TokenMetadata;
  burnLP: boolean;
  vanitySalt?: string;
}

/**
 * Instant launch creation parameters
 */
export interface CreateInstantLaunchParams {
  name: string;
  symbol: string;
  totalSupply: number;
  metadata: TokenMetadata;
  initialBuyBNB: string;
  burnLP: boolean;
  vanitySalt?: string;
}

/**
 * Launch information
 * ✅ UPDATED: Removed projectInfoFiWallet
 */
export interface LaunchInfo {
  founder: string;
  raiseTarget: bigint;
  raiseMax: bigint;
  totalRaised: bigint;
  raiseDeadline: bigint;
  raiseCompleted: boolean;
  graduatedToPancakeSwap: boolean;
  raisedFundsVesting: bigint;
  raisedFundsClaimed: bigint;
  launchType: LaunchType;
  burnLP: boolean;
}

/**
 * Launch information with USD values
 * ✅ UPDATED: Removed projectInfoFiWallet
 */
export interface LaunchInfoWithUSD {
  founder: string;
  raiseTargetBNB: bigint;
  raiseTargetUSD: bigint;
  raiseMaxBNB: bigint;
  raiseMaxUSD: bigint;
  totalRaisedBNB: bigint;
  totalRaisedUSD: bigint;
  raiseDeadline: bigint;
  raiseCompleted: boolean;
  launchType: LaunchType;
  burnLP: boolean;
}

/**
 * Pool information from bonding curve
 */
export interface PoolInfo {
  marketCapBNB: bigint;
  marketCapUSD: bigint;
  bnbReserve: bigint;
  tokenReserve: bigint;
  reservedTokens: bigint;
  currentPrice: bigint;
  priceMultiplier: bigint;
  graduationProgress: bigint;
  graduated: boolean;
}

/**
 * Fee information
 */
export interface FeeInfo {
  currentFeeRate: bigint;
  finalFeeRate: bigint;
  blocksSinceLaunch: bigint;
  blocksUntilNextTier: bigint;
  feeStage: string;
}

/**
 * Buy/Sell quote
 */
export interface Quote {
  tokensOut: bigint;
  pricePerToken: bigint;
}

/**
 * Post-graduation statistics
 */
export interface PostGraduationStats {
  totalTokensSold: bigint;
  totalLiquidityAdded: bigint;
  lpTokensGenerated: bigint;
}

/**
 * Creator fee information
 */
export interface CreatorFeeInfo {
  accumulatedFees: bigint;
  lastClaimTime: bigint;
  graduationMarketCap: bigint;
  currentMarketCap: bigint;
  bnbInPool: bigint;
  canClaim: boolean;
}

/**
 * LP lock information
 * Note: projectInfoFi is still used in LPFeeHarvester contract
 */
export interface LPLockInfo {
  lpToken: string;
  creator: string;
  projectInfoFi: string; // This is the global InfoFi address
  lpAmount: bigint;
  initialLPAmount: bigint;
  lockTime: bigint;
  unlockTime: bigint;
  active: boolean;
  totalFeesHarvested: bigint;
  harvestCount: bigint;
  timeUntilUnlock: bigint;
  estimatedValue: bigint;
  lastHarvestTime: bigint;
}

/**
 * Harvest statistics
 */
export interface HarvestStats {
  bnbAmount: bigint;
  token0Amount: bigint;
  token1Amount: bigint;
  timestamp: bigint;
  lpBurned: bigint;
}

/**
 * Platform statistics
 */
export interface PlatformStats {
  totalValueLocked: bigint;
  totalFeesDistributed: bigint;
  totalHarvests: bigint;
  activeLocksCount: bigint;
}

/**
 * Transaction options
 */
export interface TxOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
  nonce?: number;
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  fromBlock?: number | string;
  toBlock?: number | string;
}

/**
 * Formatted launch information (for display)
 */
export interface FormattedLaunchInfo {
  founder: string;
  raiseTarget: string;
  raiseMax: string;
  totalRaised: string;
  raiseDeadline: Date;
  raiseCompleted: boolean;
  graduatedToPancakeSwap: boolean;
  progressPercent: number;
  launchType: 'PROJECT_RAISE' | 'INSTANT_LAUNCH';
  burnLP: boolean;
}

/**
 * Formatted pool information (for display)
 */
export interface FormattedPoolInfo {
  marketCapUSD: string;
  marketCapBNB: string;
  bnbReserve: string;
  tokenReserve: string;
  currentPrice: string;
  priceMultiplier: string;
  graduationProgress: number;
  graduated: boolean;
  currentFee: string;
  feeStage: string;
}

/**
 * Token information
 */
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  metadata: TokenMetadata;
}

/**
 * Contribution information
 */
export interface ContributionInfo {
  amount: bigint;
  claimed: boolean;
}

/**
 * Claimable amounts
 */
export interface ClaimableAmounts {
  claimableTokens: bigint;
  claimableFunds: bigint;
}

/**
 * Transaction result
 */
export interface TxResult {
  hash: string;
  wait: () => Promise<ethers.TransactionReceipt | null>;
}

/**
 * Error types
 */
export class SafuPadError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SafuPadError';
  }
}

export class NetworkError extends SafuPadError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ContractError extends SafuPadError {
  constructor(message: string, details?: any) {
    super(message, 'CONTRACT_ERROR', details);
    this.name = 'ContractError';
  }
}

export class ValidationError extends SafuPadError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
