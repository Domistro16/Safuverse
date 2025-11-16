// src/graph/types.ts

/**
 * The Graph API response types based on SafuPad subgraph schema
 */

export interface GraphToken {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  creator: string;
  createdAt: string;
  createdAtBlock: string;
  logoURI?: string;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  launch?: GraphLaunch;
  pool?: GraphPool;
  totalVolume: string;
  totalTrades: string;
}

export interface GraphLaunch {
  id: string;
  token: GraphToken;
  founder: string;
  launchType: 'PROJECT_RAISE' | 'INSTANT_LAUNCH';
  totalSupply: string;
  raiseTarget?: string;
  raiseMax?: string;
  raiseDeadline?: string;
  totalRaised: string;
  raiseCompleted: boolean;
  liquidityAdded: boolean;
  graduatedToPancakeSwap: boolean;
  burnLP: boolean;
  vestingDuration?: string;
  vestingStartTime?: string;
  founderTokens?: string;
  founderTokensClaimed?: string;
  liquidityBNB?: string;
  liquidityTokens?: string;
  raisedFundsVesting?: string;
  raisedFundsClaimed?: string;
  createdAt: string;
  createdAtBlock: string;
  contributions?: GraphContribution[];
}

export interface GraphPool {
  id: string;
  token: GraphToken;
  creator: string;
  bnbReserve: string;
  tokenReserve: string;
  reservedTokens: string;
  virtualBnbReserve: string;
  marketCap: string;
  graduationMarketCap: string;
  currentPrice: string;
  active: boolean;
  graduated: boolean;
  burnLP: boolean;
  lpToken?: string;
  bnbForPancakeSwap: string;
  launchBlock: string;
  graduationBnbThreshold: string;
  totalVolume: string;
  totalBuys: string;
  totalSells: string;
  createdAt: string;
  graduatedAt?: string;
  trades?: GraphTrade[];
}

export interface GraphTrade {
  id: string;
  pool: GraphPool;
  token: GraphToken;
  trader: string;
  isBuy: boolean;
  bnbAmount: string;
  tokenAmount: string;
  price: string;
  feeRate: string;
  totalFee: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
}

export interface GraphContribution {
  id: string;
  launch: GraphLaunch;
  contributor: string;
  amount: string;
  claimed: boolean;
  timestamp: string;
  transactionHash: string;
}

export interface GraphTokenHolder {
  id: string;
  token: GraphToken;
  holder: string;
  balance: string;
  totalBought: string;
  totalSold: string;
  firstBuyTimestamp?: string;
  lastActivityTimestamp?: string;
}

export interface GraphCreatorFees {
  id: string;
  token: GraphToken;
  creator: string;
  accumulatedFees: string;
  totalClaimed: string;
  lastClaimTime: string;
  claimCount: string;
}

export interface GraphPlatformStats {
  id: string;
  totalLaunches: string;
  totalProjectRaises: string;
  totalInstantLaunches: string;
  totalGraduated: string;
  totalVolume: string;
  totalFees: string;
  totalRaised: string;
  lastUpdated: string;
}

export interface GraphDailyStats {
  id: string;
  date: string;
  launches: string;
  volume: string;
  fees: string;
  trades: string;
  uniqueTraders: string;
}

/**
 * Graph query response wrapper
 */
export interface GraphResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * Filter parameters for launches
 */
export interface LaunchFilters {
  launchType?: 'PROJECT_RAISE' | 'INSTANT_LAUNCH';
  founder?: string;
  raiseCompleted?: boolean;
  graduatedToPancakeSwap?: boolean;
}

/**
 * Filter parameters for trades
 */
export interface TradeFilters {
  token?: string;
  trader?: string;
  isBuy?: boolean;
}

/**
 * Filter parameters for pools
 */
export interface PoolFilters {
  graduated?: boolean;
  active?: boolean;
}
