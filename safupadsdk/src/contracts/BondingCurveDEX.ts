// src/contracts/BondingCurveDEX.ts
import { ethers } from 'ethers';
import { BaseContract } from './BaseContract';
import {
  PoolInfo,
  FeeInfo,
  Quote,
  CreatorFeeInfo,
  PostGraduationStats,
  TxResult,
  TxOptions,
  EventFilterOptions,
} from '../types';
import { GAS_LIMITS } from '../constants';
import { BondingCurveDEXABI } from '../abis';

/**
 * Volume data structure
 */
export interface VolumeData {
  totalBuyVolumeBNB: bigint;
  totalSellVolumeBNB: bigint;
  totalVolumeBNB: bigint;
  totalBuyVolumeTokens: bigint;
  totalSellVolumeTokens: bigint;
  buyCount: number;
  sellCount: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  uniqueTraders: number;
}

/**
 * Trade data structure
 */
export interface TradeData {
  type: 'buy' | 'sell';
  trader: string;
  tokenAddress: string;
  bnbAmount: bigint;
  tokenAmount: bigint;
  price: bigint;
  feeRate: bigint;
  blockNumber: number;
  timestamp: number;
  txHash: string;
}

/**
 * BondingCurveDEX contract wrapper
 */
export class BondingCurveDEX extends BaseContract {
  constructor(
    address: string,
    provider: ethers.Provider,
    signer?: ethers.Signer,
    eventQueryProvider?: ethers.Provider
  ) {
    super(address, BondingCurveDEXABI, provider, signer, eventQueryProvider);
  }

  /**
   * Safely parse ether amount and handle edge cases
   */
  private safeParseEther(amount: string): bigint {
    // Convert scientific notation to decimal string
    const numValue = Number(amount);

    // Check if value is too small (less than 1 wei)
    if (numValue < 1e-18) {
      throw new Error(`Amount too small: ${amount} (minimum is 1 wei = 1e-18 ETH)`);
    }

    // Convert to fixed decimal string to avoid scientific notation
    const decimalString = numValue.toFixed(18);

    return ethers.parseEther(decimalString);
  }

  /**
   * Safely format ether amount and handle very small values
   * Prevents scientific notation in output
   */
  private safeFormatEther(amount: bigint): string {
    const formatted = ethers.formatEther(amount);
    const numValue = Number(formatted);

    // If the number is very small and would be in scientific notation
    if (numValue > 0 && numValue < 0.000001) {
      // Convert to fixed decimal string without scientific notation
      return numValue.toFixed(18).replace(/\.?0+$/, '');
    }

    return formatted;
  }

  /**
   * Buy tokens from bonding curve
   */
  async buyTokens(
    tokenAddress: string,
    bnbAmount: string,
    slippageTolerance: number = 1, // 1% default
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const amount = this.safeParseEther(bnbAmount);

    // Get quote
    const quote = await this.getBuyQuote(tokenAddress, bnbAmount);

    // Calculate min tokens with slippage
    const minTokensOut = (quote.tokensOut * BigInt(100 - slippageTolerance)) / 100n;

    // Build transaction
    const txOptions = this.buildTxOptions(options, GAS_LIMITS.BUY_TOKENS);
    txOptions.value = amount;

    const tx = await this.contract.buyTokens(tokenAddress, minTokensOut, txOptions);

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Sell tokens to bonding curve
   */
  async sellTokens(
    tokenAddress: string,
    tokenAmount: string,
    slippageTolerance: number = 1, // 1% default
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const amount = ethers.parseEther(tokenAmount);

    // Get quote
    const quote = await this.getSellQuote(tokenAddress, tokenAmount);

    // Calculate min BNB with slippage
    const minBNBOut = (quote.tokensOut * BigInt(100 - slippageTolerance)) / 100n;

    const tx = await this.contract.sellTokens(
      tokenAddress,
      amount,
      minBNBOut,
      this.buildTxOptions(options, GAS_LIMITS.SELL_TOKENS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Get buy quote (how many tokens for X BNB)
   */
  async getBuyQuote(tokenAddress: string, bnbAmount: string): Promise<Quote> {
    this.validateAddress(tokenAddress);

    const amount = this.safeParseEther(bnbAmount);
    const quote = await this.contract.getBuyQuote(tokenAddress, amount);

    return {
      tokensOut: quote[0], // tokensOut
      pricePerToken: quote[1], // pricePerToken
    };
  }

  /**
   * Get sell quote (how much BNB for X tokens)
   */
  async getSellQuote(tokenAddress: string, tokenAmount: string): Promise<Quote> {
    this.validateAddress(tokenAddress);

    const amount = ethers.parseEther(tokenAmount);
    const quote = await this.contract.getSellQuote(tokenAddress, amount);

    return {
      tokensOut: quote[0], // bnbOut
      pricePerToken: quote[1], // pricePerToken
    };
  }

  /**
   * Get pool information
   */
  async getPoolInfo(tokenAddress: string): Promise<PoolInfo> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getPoolInfo(tokenAddress);

    return {
      marketCapBNB: info[0],
      marketCapUSD: info[1],
      bnbReserve: info[2],
      tokenReserve: info[3],
      reservedTokens: info[4],
      currentPrice: info[5],
      priceMultiplier: info[6],
      graduationProgress: info[7],
      graduated: info[8],
    };
  }

  /**
   * Get current fee rate for a token
   */
  async getCurrentFeeRate(tokenAddress: string): Promise<bigint> {
    this.validateAddress(tokenAddress);
    return await this.contract.getCurrentFeeRate(tokenAddress);
  }

  /**
   * Get detailed fee information
   */
  async getFeeInfo(tokenAddress: string): Promise<FeeInfo> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getFeeInfo(tokenAddress);

    return {
      currentFeeRate: info[0],
      finalFeeRate: info[1],
      blocksSinceLaunch: info[2],
      blocksUntilNextTier: info[3],
      feeStage: info[4],
    };
  }

  /**
   * Get creator fee information
   */
  async getCreatorFeeInfo(tokenAddress: string): Promise<CreatorFeeInfo> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getCreatorFeeInfo(tokenAddress);

    return {
      accumulatedFees: info[0],
      lastClaimTime: info[1],
      graduationMarketCap: info[2],
      currentMarketCap: info[3],
      bnbInPool: info[4],
      canClaim: info[5],
    };
  }

  /**
   * Claim creator fees
   */
  async claimCreatorFees(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.claimCreatorFees(tokenAddress, this.buildTxOptions(options));

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Get post-graduation statistics
   */
  async getPostGraduationStats(tokenAddress: string): Promise<PostGraduationStats> {
    this.validateAddress(tokenAddress);

    const stats = await this.contract.getPostGraduationStats(tokenAddress);

    return {
      totalTokensSold: stats[0],
      totalLiquidityAdded: stats[1],
      lpTokensGenerated: stats[2],
    };
  }

  /**
   * Get all active tokens
   */
  async getActiveTokens(): Promise<string[]> {
    return await this.contract.getActiveTokens();
  }

  /**
   * Check if pool is graduated
   */
  async isGraduated(tokenAddress: string): Promise<boolean> {
    const info = await this.getPoolInfo(tokenAddress);
    return info.graduated;
  }

  /**
   * Calculate price impact for buy
   */
  async calculateBuyPriceImpact(tokenAddress: string, bnbAmount: string): Promise<number> {
    const poolInfo = await this.getPoolInfo(tokenAddress);
    const quote = await this.getBuyQuote(tokenAddress, bnbAmount);

    if (poolInfo.currentPrice === 0n || quote.tokensOut === 0n) {
      return 0;
    }

    const avgPrice = (this.safeParseEther(bnbAmount) * 10n ** 18n) / quote.tokensOut;
    const priceImpact =
      Number(((avgPrice - poolInfo.currentPrice) * 10000n) / poolInfo.currentPrice) / 100;

    return priceImpact;
  }

  /**
   * Calculate price impact for sell
   */
  async calculateSellPriceImpact(tokenAddress: string, tokenAmount: string): Promise<number> {
    const poolInfo = await this.getPoolInfo(tokenAddress);
    const quote = await this.getSellQuote(tokenAddress, tokenAmount);

    if (poolInfo.currentPrice === 0n || quote.tokensOut === 0n) {
      return 0;
    }

    const avgPrice = (quote.tokensOut * 10n ** 18n) / ethers.parseEther(tokenAmount);
    const priceImpact =
      Number(((poolInfo.currentPrice - avgPrice) * 10000n) / poolInfo.currentPrice) / 100;

    return priceImpact;
  }

  /**
   * Estimate time until fee tier changes
   */
  async estimateTimeUntilFeeTierChange(tokenAddress: string): Promise<number> {
    const feeInfo = await this.getFeeInfo(tokenAddress);

    if (feeInfo.blocksUntilNextTier === 0n) {
      return 0;
    }

    // Assume 3 second block time for BSC
    const secondsRemaining = Number(feeInfo.blocksUntilNextTier) * 3;
    return secondsRemaining;
  }

  /**
   * Get formatted fee percentage
   */
  async getCurrentFeePercentage(tokenAddress: string): Promise<string> {
    const feeRate = await this.getCurrentFeeRate(tokenAddress);
    return `${Number(feeRate) / 100}%`;
  }

  // ==================== VOLUME TRACKING METHODS ====================

  /**
   * Get total trading volume for a token (all time)
   */
  async getTotalVolume(tokenAddress: string, fromBlock: number = 0): Promise<VolumeData> {
    this.validateAddress(tokenAddress);

    const latestBlock = await this.provider.getBlockNumber();
    return this.getVolumeForPeriod(tokenAddress, fromBlock, latestBlock);
  }



  /**
   * Get trading volume for a specific time period
   */
  async getVolumeForPeriod(
    tokenAddress: string,
    fromBlock: number,
    toBlock: number,
    minTimestamp?: number
  ): Promise<VolumeData> {
    this.validateAddress(tokenAddress);

    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, fromBlock, toBlock),
      this.getTokensSoldEvents(tokenAddress, fromBlock, toBlock),
    ]);

    // Filter by timestamp if provided
    let filteredBuyEvents = buyEvents;
    let filteredSellEvents = sellEvents;

    if (minTimestamp) {
      filteredBuyEvents = buyEvents.filter((e) => e.timestamp >= minTimestamp);
      filteredSellEvents = sellEvents.filter((e) => e.timestamp >= minTimestamp);
    }

    // Calculate volumes
    const buyVolumeBNB = filteredBuyEvents.reduce((sum, e) => sum + e.bnbAmount, 0n);
    const sellVolumeBNB = filteredSellEvents.reduce((sum, e) => sum + e.bnbAmount, 0n);
    const buyVolumeTokens = filteredBuyEvents.reduce((sum, e) => sum + e.tokenAmount, 0n);
    const sellVolumeTokens = filteredSellEvents.reduce((sum, e) => sum + e.tokenAmount, 0n);

    // Calculate unique traders
    const buyers = new Set(filteredBuyEvents.map((e) => e.trader.toLowerCase()));
    const sellers = new Set(filteredSellEvents.map((e) => e.trader.toLowerCase()));
    const allTraders = new Set([...buyers, ...sellers]);

    return {
      totalBuyVolumeBNB: buyVolumeBNB,
      totalSellVolumeBNB: sellVolumeBNB,
      totalVolumeBNB: buyVolumeBNB + sellVolumeBNB,
      totalBuyVolumeTokens: buyVolumeTokens,
      totalSellVolumeTokens: sellVolumeTokens,
      buyCount: filteredBuyEvents.length,
      sellCount: filteredSellEvents.length,
      uniqueBuyers: buyers.size,
      uniqueSellers: sellers.size,
      uniqueTraders: allTraders.size,
    };
  }

  /**
   * Get trading volume grouped by time intervals (hourly, daily, etc.)
   */
  async getVolumeHistory(
    tokenAddress: string,
    intervalSeconds: number = 3600, // 1 hour default
    periods: number = 24,
    fromBlock?: number
  ): Promise<Array<VolumeData & { timestamp: number; intervalStart: number }>> {
    this.validateAddress(tokenAddress);

    const latestBlock = await this.provider.getBlockNumber();
    const currentTime = Math.floor(Date.now() / 1000);

    // Calculate blocks to fetch (estimate)
    const totalSeconds = intervalSeconds * periods;
    const estimatedBlocks = Math.floor(totalSeconds / 3);
    const startBlock = fromBlock || Math.max(0, latestBlock - estimatedBlocks);

    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, startBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, startBlock, latestBlock),
    ]);

    // Group events by interval
    const intervals: Map<number, { buys: TradeData[]; sells: TradeData[] }> = new Map();

    for (const event of buyEvents) {
      const intervalStart = Math.floor(event.timestamp / intervalSeconds) * intervalSeconds;
      if (!intervals.has(intervalStart)) {
        intervals.set(intervalStart, { buys: [], sells: [] });
      }
      intervals.get(intervalStart)!.buys.push(event);
    }

    for (const event of sellEvents) {
      const intervalStart = Math.floor(event.timestamp / intervalSeconds) * intervalSeconds;
      if (!intervals.has(intervalStart)) {
        intervals.set(intervalStart, { buys: [], sells: [] });
      }
      intervals.get(intervalStart)!.sells.push(event);
    }

    // Convert to array and calculate volumes for each interval
    const results: Array<VolumeData & { timestamp: number; intervalStart: number }> = [];

    for (let i = 0; i < periods; i++) {
      const intervalStart = currentTime - (periods - i) * intervalSeconds;
      const data = intervals.get(intervalStart) || { buys: [], sells: [] };

      const buyVolumeBNB = data.buys.reduce((sum, e) => sum + e.bnbAmount, 0n);
      const sellVolumeBNB = data.sells.reduce((sum, e) => sum + e.bnbAmount, 0n);
      const buyVolumeTokens = data.buys.reduce((sum, e) => sum + e.tokenAmount, 0n);
      const sellVolumeTokens = data.sells.reduce((sum, e) => sum + e.tokenAmount, 0n);

      const buyers = new Set(data.buys.map((e) => e.trader.toLowerCase()));
      const sellers = new Set(data.sells.map((e) => e.trader.toLowerCase()));
      const allTraders = new Set([...buyers, ...sellers]);

      results.push({
        timestamp: intervalStart + intervalSeconds,
        intervalStart,
        totalBuyVolumeBNB: buyVolumeBNB,
        totalSellVolumeBNB: sellVolumeBNB,
        totalVolumeBNB: buyVolumeBNB + sellVolumeBNB,
        totalBuyVolumeTokens: buyVolumeTokens,
        totalSellVolumeTokens: sellVolumeTokens,
        buyCount: data.buys.length,
        sellCount: data.sells.length,
        uniqueBuyers: buyers.size,
        uniqueSellers: sellers.size,
        uniqueTraders: allTraders.size,
      });
    }

    return results;
  }

  /**
   * Get recent trades for a token
   */
  async getRecentTrades(
    tokenAddress: string,
    limit: number = 50,
    fromBlock?: number
  ): Promise<TradeData[]> {
    this.validateAddress(tokenAddress);

    const latestBlock = await this.provider.getBlockNumber();
    const startBlock = fromBlock || Math.max(0, latestBlock - 10000); // Last ~8 hours

    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, startBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, startBlock, latestBlock),
    ]);

    // Combine and sort by timestamp (descending)
    const allTrades = [...buyEvents, ...sellEvents].sort((a, b) => b.timestamp - a.timestamp);

    return allTrades.slice(0, limit);
  }

  /**
   * Get TokensBought events with detailed trade data
   * ✅ FIXED: Use event.args instead of event.topics
   * Uses eventQueryProvider (Alchemy if configured) for better performance
   */
  private async getTokensBoughtEvents(
    tokenAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<TradeData[]> {
    // Create contract instance using eventQueryProvider for event queries
    const eventContract = new ethers.Contract(
      this.address,
      this.contract.interface,
      this.eventQueryProvider
    );
    const filter = eventContract.filters.TokensBought(null, tokenAddress);
    const events = await eventContract.queryFilter(filter, fromBlock, toBlock);

    const trades: TradeData[] = [];
    const abiCoder = new ethers.AbiCoder();
    for (const event of events) {
      const block = await event.getBlock();
      const args = event.topics;
      const data = event.data;

      const topics = abiCoder.decode(['uint256', 'uint256', 'uint256', 'uint256'], data);

      trades.push({
        type: 'buy',
        trader: args[1], // buyer
        tokenAddress: args[2], // token
        bnbAmount: topics[0], // bnbReceived
        tokenAmount: topics[1], // tokensAmount
        price: topics[2], // currentPrice
        feeRate: topics[3], // feeRate
        blockNumber: event.blockNumber,
        timestamp: block.timestamp,
        txHash: event.transactionHash,
      });
    }

    return trades;
  }

  /**
   * Get TokensSold events with detailed trade data
   * ✅ FIXED: Use event.args instead of event.topics
   * Uses eventQueryProvider (Alchemy if configured) for better performance
   */
  private async getTokensSoldEvents(
    tokenAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<TradeData[]> {
    // Create contract instance using eventQueryProvider for event queries
    const eventContract = new ethers.Contract(
      this.address,
      this.contract.interface,
      this.eventQueryProvider
    );
    const filter = eventContract.filters.TokensSold(null, tokenAddress);
    const events = await eventContract.queryFilter(filter, fromBlock, toBlock);

    const trades: TradeData[] = [];
    const abiCoder = new ethers.AbiCoder();
    for (const event of events) {
      const block = await event.getBlock();
      const args = event.topics;

      const data = event.data;

      const topics = abiCoder.decode(['uint256', 'uint256', 'uint256', 'uint256'], data);

      trades.push({
        type: 'sell',
        trader: args[0], // seller
        tokenAddress: args[1], // token
        bnbAmount: topics[0], // bnbReceived
        tokenAmount: topics[1], // tokensAmount
        price: topics[2], // currentPrice
        feeRate: topics[3], // feeRate
        blockNumber: event.blockNumber,
        timestamp: block.timestamp,
        txHash: event.transactionHash,
      });
    }

    return trades;
  }

  /**
   * Get top traders by volume
   */
  async getTopTraders(
    tokenAddress: string,
    limit: number = 10,
    fromBlock: number = 0
  ): Promise<
    Array<{
      address: string;
      buyVolumeBNB: bigint;
      sellVolumeBNB: bigint;
      totalVolumeBNB: bigint;
      buyCount: number;
      sellCount: number;
      netTokens: bigint;
    }>
  > {
    this.validateAddress(tokenAddress);

    const latestBlock = await this.provider.getBlockNumber();
    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
    ]);

    // Aggregate by trader
    const traderMap = new Map<
      string,
      {
        buyVolumeBNB: bigint;
        sellVolumeBNB: bigint;
        buyCount: number;
        sellCount: number;
        netTokens: bigint;
      }
    >();

    for (const trade of buyEvents) {
      const addr = trade.trader.toLowerCase();
      const existing = traderMap.get(addr) || {
        buyVolumeBNB: 0n,
        sellVolumeBNB: 0n,
        buyCount: 0,
        sellCount: 0,
        netTokens: 0n,
      };

      existing.buyVolumeBNB += trade.bnbAmount;
      existing.buyCount++;
      existing.netTokens += trade.tokenAmount;
      traderMap.set(addr, existing);
    }

    for (const trade of sellEvents) {
      const addr = trade.trader.toLowerCase();
      const existing = traderMap.get(addr) || {
        buyVolumeBNB: 0n,
        sellVolumeBNB: 0n,
        buyCount: 0,
        sellCount: 0,
        netTokens: 0n,
      };

      existing.sellVolumeBNB += trade.bnbAmount;
      existing.sellCount++;
      existing.netTokens -= trade.tokenAmount;
      traderMap.set(addr, existing);
    }

    // Convert to array and sort by total volume
    const traders = Array.from(traderMap.entries())
      .map(([address, data]) => ({
        address,
        buyVolumeBNB: data.buyVolumeBNB,
        sellVolumeBNB: data.sellVolumeBNB,
        totalVolumeBNB: data.buyVolumeBNB + data.sellVolumeBNB,
        buyCount: data.buyCount,
        sellCount: data.sellCount,
        netTokens: data.netTokens,
      }))
      .sort((a, b) => (a.totalVolumeBNB > b.totalVolumeBNB ? -1 : 1));

    return traders.slice(0, limit);
  }

  /**
   * Get holder count estimate from trading activity
   */
  async getEstimatedHolderCount(tokenAddress: string, fromBlock: number = 0): Promise<number> {
    this.validateAddress(tokenAddress);

    const latestBlock = await this.provider.getBlockNumber();
    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
    ]);

    // Track net token balances
    const balances = new Map<string, bigint>();

    for (const trade of buyEvents) {
      const addr = trade.trader.toLowerCase();
      balances.set(addr, (balances.get(addr) || 0n) + trade.tokenAmount);
    }

    for (const trade of sellEvents) {
      const addr = trade.trader.toLowerCase();
      balances.set(addr, (balances.get(addr) || 0n) - trade.tokenAmount);
    }

    // Count holders with positive balance
    let holderCount = 0;
    for (const balance of balances.values()) {
      if (balance > 0n) {
        holderCount++;
      }
    }

    return holderCount;
  }

  /**
   * Get 24h trading volume in BNB
   * Returns both the bigint value and formatted string
   */
  async get24hVolume(tokenAddress: string): Promise<{
    volumeBNB: bigint;
    volumeFormatted: string;
    buyVolumeBNB: bigint;
    sellVolumeBNB: bigint;
    tradeCount: number;
  }> {
    this.validateAddress(tokenAddress);

    // Calculate blocks in last 24 hours (BSC: ~3 seconds per block = ~28,800 blocks/day)
    const latestBlock = await this.provider.getBlockNumber();
    const blocksPerDay = 28800;
    const fromBlock = Math.max(0, latestBlock - blocksPerDay);

    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
    ]);

    const buyVolume = buyEvents.reduce((sum, trade) => sum + trade.bnbAmount, 0n);
    const sellVolume = sellEvents.reduce((sum, trade) => sum + trade.bnbAmount, 0n);
    const totalVolume = buyVolume + sellVolume;

    return {
      volumeBNB: totalVolume,
      volumeFormatted: this.safeFormatEther(totalVolume),
      buyVolumeBNB: buyVolume,
      sellVolumeBNB: sellVolume,
      tradeCount: buyEvents.length + sellEvents.length,
    };
  }

  /**
   * Get 24h price change percentage
   * Returns the price change over the last 24 hours
   */
  async get24hPriceChange(tokenAddress: string): Promise<{
    priceChange: number;
    priceChangePercent: number;
    currentPrice: bigint;
    price24hAgo: bigint;
  }> {
    this.validateAddress(tokenAddress);

    // Get current price
    const poolInfo = await this.getPoolInfo(tokenAddress);
    const currentPrice = poolInfo.currentPrice;

    // Calculate blocks in last 24 hours
    const latestBlock = await this.provider.getBlockNumber();
    const blocksPerDay = 28800;
    const targetBlock = Math.max(0, latestBlock - blocksPerDay);

    // Get trades around 24h ago to find the price
    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, Math.max(0, targetBlock - 100), targetBlock),
      this.getTokensSoldEvents(tokenAddress, Math.max(0, targetBlock - 100), targetBlock),
    ]);

    // Combine and sort by block number to get the last trade around 24h ago
    const allTrades = [...buyEvents, ...sellEvents].sort((a, b) => b.blockNumber - a.blockNumber);

    // If no trades found 24h ago, return 0 change
    if (allTrades.length === 0) {
      return {
        priceChange: 0,
        priceChangePercent: 0,
        currentPrice,
        price24hAgo: currentPrice,
      };
    }

    const price24hAgo = allTrades[0].price;

    // Calculate change
    const priceDiff = currentPrice - price24hAgo;
    const priceChangePercent =
      price24hAgo > 0n ? Number((priceDiff * 10000n) / price24hAgo) / 100 : 0;

    return {
      priceChange: Number(ethers.formatEther(priceDiff)),
      priceChangePercent,
      currentPrice,
      price24hAgo,
    };
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format BNB amount (bigint) to readable string
   * Handles very small amounts without scientific notation
   */
  formatBNBAmount(amount: bigint): string {
    return this.safeFormatEther(amount);
  }

  /**
   * Format token amount (bigint) to readable string
   * Handles very small amounts without scientific notation
   */
  formatTokenAmount(amount: bigint, decimals: number = 18): string {
    const formatted = ethers.formatUnits(amount, decimals);
    const numValue = Number(formatted);

    // If the number is very small and would be in scientific notation
    if (numValue > 0 && numValue < 0.000001) {
      return numValue.toFixed(decimals).replace(/\.?0+$/, '');
    }

    return formatted;
  }

  /**
   * Parse BNB amount string to bigint
   * Handles scientific notation and very small values
   */
  parseBNBAmount(amount: string): bigint {
    return this.safeParseEther(amount);
  }

  // ==================== EVENT LISTENERS ====================

  /**
   * Listen to TokensBought events
   */
  onTokensBought(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('TokensBought', callback, filter);
  }

  /**
   * Listen to TokensSold events
   */
  onTokensSold(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('TokensSold', callback, filter);
  }

  /**
   * Listen to PoolGraduated events
   */
  onPoolGraduated(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('PoolGraduated', callback, filter);
  }

  /**
   * Listen to PostGraduationSell events
   */
  onPostGraduationSell(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('PostGraduationSell', callback, filter);
  }

  /**
   * Listen to CreatorFeesClaimed events
   */
  onCreatorFeesClaimed(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('CreatorFeesClaimed', callback, filter);
  }
}
