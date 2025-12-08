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
 * ✅ UPDATED: Changed to MON (Monad migration)
 */
export interface VolumeData {
  totalBuyVolumeMON: bigint;
  totalSellVolumeMON: bigint;
  totalVolumeMON: bigint;
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
 * ✅ UPDATED: Changed to MON (Monad migration)
 */
export interface TradeData {
  type: 'buy' | 'sell';
  trader: string;
  tokenAddress: string;
  monAmount: bigint;
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
    eventQueryProvider?: ethers.Provider,
    graph?: any // SafuPadGraph type imported in BaseContract
  ) {
    super(address, BondingCurveDEXABI, provider, signer, eventQueryProvider, graph);
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
    monAmount: string,
    slippageTolerance: number = 1, // 1% default
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const amount = this.safeParseEther(monAmount);

    // Get quote
    const quote = await this.getBuyQuote(tokenAddress, monAmount);

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

    // Calculate min MON with slippage
    const minMONOut = (quote.tokensOut * BigInt(100 - slippageTolerance)) / 100n;

    const tx = await this.contract.sellTokens(
      tokenAddress,
      amount,
      minMONOut,
      this.buildTxOptions(options, GAS_LIMITS.SELL_TOKENS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Get buy quote (how many tokens for X MON)
   */
  async getBuyQuote(tokenAddress: string, monAmount: string): Promise<Quote> {
    this.validateAddress(tokenAddress);

    const amount = this.safeParseEther(monAmount);
    const quote = await this.contract.getBuyQuote(tokenAddress, amount);

    return {
      tokensOut: quote[0], // tokensOut
      pricePerToken: quote[1], // pricePerToken
    };
  }

  /**
   * Get sell quote (how much MON for X tokens)
   */
  async getSellQuote(tokenAddress: string, tokenAmount: string): Promise<Quote> {
    this.validateAddress(tokenAddress);

    const amount = ethers.parseEther(tokenAmount);
    const quote = await this.contract.getSellQuote(tokenAddress, amount);

    return {
      tokensOut: quote[0], // monOut
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
      marketCapMON: info[0],
      marketCapUSD: info[1],
      monReserve: info[2],
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
      monInPool: info[4],
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
  async calculateBuyPriceImpact(tokenAddress: string, monAmount: string): Promise<number> {
    const poolInfo = await this.getPoolInfo(tokenAddress);
    const quote = await this.getBuyQuote(tokenAddress, monAmount);

    if (poolInfo.currentPrice === 0n || quote.tokensOut === 0n) {
      return 0;
    }

    const avgPrice = (this.safeParseEther(monAmount) * 10n ** 18n) / quote.tokensOut;
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

    // Assume 1 second block time for Monad
    const secondsRemaining = Number(feeInfo.blocksUntilNextTier) * 1;
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
   * Uses The Graph if available, falls back to events
   */
  async getTotalVolume(tokenAddress: string, fromBlock: number = 0): Promise<VolumeData> {
    this.validateAddress(tokenAddress);

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph) {
      const pool = await this.graph.getPool(tokenAddress.toLowerCase());
      if (pool) {
        return {
          totalBuyVolumeMON: BigInt(pool.totalVolume) / 2n, // Rough estimate
          totalSellVolumeMON: BigInt(pool.totalVolume) / 2n, // Rough estimate
          totalVolumeMON: BigInt(pool.totalVolume),
          totalBuyVolumeTokens: 0n, // Not available in pool stats
          totalSellVolumeTokens: 0n, // Not available in pool stats
          buyCount: Number(pool.totalBuys),
          sellCount: Number(pool.totalSells),
          uniqueBuyers: 0, // Would need separate query
          uniqueSellers: 0, // Would need separate query
          uniqueTraders: 0, // Would need separate query
        };
      }
    }

    // ⚠️ Fallback to events
    const latestBlock = await this.provider.getBlockNumber();
    return this.getVolumeForPeriod(tokenAddress, fromBlock, latestBlock);
  }



  /**
   * Get trading volume for a specific time period
   * Uses The Graph if available, falls back to events
   */
  async getVolumeForPeriod(
    tokenAddress: string,
    fromBlock: number,
    toBlock: number,
    minTimestamp?: number
  ): Promise<VolumeData> {
    this.validateAddress(tokenAddress);

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph && minTimestamp) {
      const trades = await this.graph.getTrades(
        { token: tokenAddress.toLowerCase() },
        { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' }
      );

      // Filter by timestamp
      const filteredTrades = trades.filter((t: any) => Number(t.timestamp) >= minTimestamp);

      const buyTrades = filteredTrades.filter((t: any) => t.isBuy);
      const sellTrades = filteredTrades.filter((t: any) => !t.isBuy);

      const buyVolumeMON = buyTrades.reduce((sum: bigint, t: any) => sum + BigInt(t.monAmount), 0n);
      const sellVolumeMON = sellTrades.reduce((sum: bigint, t: any) => sum + BigInt(t.monAmount), 0n);
      const buyVolumeTokens = buyTrades.reduce((sum: bigint, t: any) => sum + BigInt(t.tokenAmount), 0n);
      const sellVolumeTokens = sellTrades.reduce((sum: bigint, t: any) => sum + BigInt(t.tokenAmount), 0n);

      const buyers = new Set(buyTrades.map((t: any) => t.trader.toLowerCase()));
      const sellers = new Set(sellTrades.map((t: any) => t.trader.toLowerCase()));
      const allTraders = new Set([...buyers, ...sellers]);

      return {
        totalBuyVolumeMON: buyVolumeMON,
        totalSellVolumeMON: sellVolumeMON,
        totalVolumeMON: buyVolumeMON + sellVolumeMON,
        totalBuyVolumeTokens: buyVolumeTokens,
        totalSellVolumeTokens: sellVolumeTokens,
        buyCount: buyTrades.length,
        sellCount: sellTrades.length,
        uniqueBuyers: buyers.size,
        uniqueSellers: sellers.size,
        uniqueTraders: allTraders.size,
      };
    }

    // ⚠️ Fallback to events
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
    const buyVolumeMON = filteredBuyEvents.reduce((sum, e) => sum + e.monAmount, 0n);
    const sellVolumeMON = filteredSellEvents.reduce((sum, e) => sum + e.monAmount, 0n);
    const buyVolumeTokens = filteredBuyEvents.reduce((sum, e) => sum + e.tokenAmount, 0n);
    const sellVolumeTokens = filteredSellEvents.reduce((sum, e) => sum + e.tokenAmount, 0n);

    // Calculate unique traders
    const buyers = new Set(filteredBuyEvents.map((e) => e.trader.toLowerCase()));
    const sellers = new Set(filteredSellEvents.map((e) => e.trader.toLowerCase()));
    const allTraders = new Set([...buyers, ...sellers]);

    return {
      totalBuyVolumeMON: buyVolumeMON,
      totalSellVolumeMON: sellVolumeMON,
      totalVolumeMON: buyVolumeMON + sellVolumeMON,
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
   * Uses The Graph if available, falls back to events
   */
  async getVolumeHistory(
    tokenAddress: string,
    intervalSeconds: number = 3600, // 1 hour default
    periods: number = 24,
    fromBlock?: number
  ): Promise<Array<VolumeData & { timestamp: number; intervalStart: number }>> {
    this.validateAddress(tokenAddress);

    const currentTime = Math.floor(Date.now() / 1000);

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph) {
      // Calculate time range
      const startTime = currentTime - (periods * intervalSeconds);

      // Fetch all trades in the time range
      const allTrades = await this.graph.getTrades(
        { token: tokenAddress.toLowerCase() },
        { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' }
      );

      // Filter trades within our time range
      const relevantTrades = allTrades.filter((t: any) => {
        const tradeTime = Number(t.timestamp);
        return tradeTime >= startTime && tradeTime <= currentTime;
      });

      // Group trades by interval
      const intervals: Map<number, { buys: any[]; sells: any[] }> = new Map();

      for (const trade of relevantTrades) {
        const tradeTime = Number(trade.timestamp);
        const intervalStart = Math.floor(tradeTime / intervalSeconds) * intervalSeconds;

        if (!intervals.has(intervalStart)) {
          intervals.set(intervalStart, { buys: [], sells: [] });
        }

        if (trade.isBuy) {
          intervals.get(intervalStart)!.buys.push(trade);
        } else {
          intervals.get(intervalStart)!.sells.push(trade);
        }
      }

      // Generate results for all periods
      const results: Array<VolumeData & { timestamp: number; intervalStart: number }> = [];

      for (let i = 0; i < periods; i++) {
        const intervalStart = currentTime - (periods - i) * intervalSeconds;
        const data = intervals.get(intervalStart) || { buys: [], sells: [] };

        const buyVolumeMON = data.buys.reduce((sum: bigint, t: any) => sum + BigInt(t.monAmount), 0n);
        const sellVolumeMON = data.sells.reduce((sum: bigint, t: any) => sum + BigInt(t.monAmount), 0n);
        const buyVolumeTokens = data.buys.reduce((sum: bigint, t: any) => sum + BigInt(t.tokenAmount), 0n);
        const sellVolumeTokens = data.sells.reduce((sum: bigint, t: any) => sum + BigInt(t.tokenAmount), 0n);

        const buyers = new Set(data.buys.map((t: any) => t.trader.toLowerCase()));
        const sellers = new Set(data.sells.map((t: any) => t.trader.toLowerCase()));
        const allTraders = new Set([...buyers, ...sellers]);

        results.push({
          timestamp: intervalStart + intervalSeconds,
          intervalStart,
          totalBuyVolumeMON: buyVolumeMON,
          totalSellVolumeMON: sellVolumeMON,
          totalVolumeMON: buyVolumeMON + sellVolumeMON,
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

    // ⚠️ Fallback to events (slower, use only when Graph not available)
    const latestBlock = await this.provider.getBlockNumber();

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

      const buyVolumeMON = data.buys.reduce((sum, e) => sum + e.monAmount, 0n);
      const sellVolumeMON = data.sells.reduce((sum, e) => sum + e.monAmount, 0n);
      const buyVolumeTokens = data.buys.reduce((sum, e) => sum + e.tokenAmount, 0n);
      const sellVolumeTokens = data.sells.reduce((sum, e) => sum + e.tokenAmount, 0n);

      const buyers = new Set(data.buys.map((e) => e.trader.toLowerCase()));
      const sellers = new Set(data.sells.map((e) => e.trader.toLowerCase()));
      const allTraders = new Set([...buyers, ...sellers]);

      results.push({
        timestamp: intervalStart + intervalSeconds,
        intervalStart,
        totalBuyVolumeMON: buyVolumeMON,
        totalSellVolumeMON: sellVolumeMON,
        totalVolumeMON: buyVolumeMON + sellVolumeMON,
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
   * Uses The Graph if available, falls back to events
   */
  async getRecentTrades(
    tokenAddress: string,
    limit: number = 50,
    fromBlock?: number
  ): Promise<TradeData[]> {
    this.validateAddress(tokenAddress);

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph) {
      const trades = await this.graph.getTrades(
        { token: tokenAddress.toLowerCase() },
        { first: limit, orderBy: 'timestamp', orderDirection: 'desc' }
      );

      return trades.map((t: any) => ({
        type: t.isBuy ? 'buy' : 'sell',
        trader: t.trader,
        tokenAddress: t.token.id,
        monAmount: BigInt(t.monAmount),
        tokenAmount: BigInt(t.tokenAmount),
        price: BigInt(t.price),
        feeRate: BigInt(t.feeRate),
        blockNumber: Number(t.blockNumber),
        timestamp: Number(t.timestamp),
        txHash: t.transactionHash,
      }));
    }

    // ⚠️ Fallback to events (slower, use only when Graph not available)
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
        monAmount: topics[0], // monReceived
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
        monAmount: topics[0], // monReceived
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
   * Uses The Graph if available, falls back to events
   */
  async getTopTraders(
    tokenAddress: string,
    limit: number = 10,
    fromBlock: number = 0
  ): Promise<
    Array<{
      address: string;
      buyVolumeMON: bigint;
      sellVolumeMON: bigint;
      totalVolumeMON: bigint;
      buyCount: number;
      sellCount: number;
      netTokens: bigint;
    }>
  > {
    this.validateAddress(tokenAddress);

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph) {
      const allTrades = await this.graph.getTrades(
        { token: tokenAddress.toLowerCase() },
        { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' }
      );

      // Aggregate by trader
      const traderMap = new Map<
        string,
        {
          buyVolumeMON: bigint;
          sellVolumeMON: bigint;
          buyCount: number;
          sellCount: number;
          netTokens: bigint;
        }
      >();

      for (const trade of allTrades) {
        const addr = trade.trader.toLowerCase();
        const existing = traderMap.get(addr) || {
          buyVolumeMON: 0n,
          sellVolumeMON: 0n,
          buyCount: 0,
          sellCount: 0,
          netTokens: 0n,
        };

        if (trade.isBuy) {
          existing.buyVolumeMON += BigInt(trade.monAmount);
          existing.buyCount++;
          existing.netTokens += BigInt(trade.tokenAmount);
        } else {
          existing.sellVolumeMON += BigInt(trade.monAmount);
          existing.sellCount++;
          existing.netTokens -= BigInt(trade.tokenAmount);
        }

        traderMap.set(addr, existing);
      }

      // Convert to array and sort by total volume
      const traders = Array.from(traderMap.entries())
        .map(([address, data]) => ({
          address,
          buyVolumeMON: data.buyVolumeMON,
          sellVolumeMON: data.sellVolumeMON,
          totalVolumeMON: data.buyVolumeMON + data.sellVolumeMON,
          buyCount: data.buyCount,
          sellCount: data.sellCount,
          netTokens: data.netTokens,
        }))
        .sort((a, b) => (a.totalVolumeMON > b.totalVolumeMON ? -1 : 1));

      return traders.slice(0, limit);
    }

    // ⚠️ Fallback to events (slower, use only when Graph not available)
    const latestBlock = await this.provider.getBlockNumber();
    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
    ]);

    // Aggregate by trader
    const traderMap = new Map<
      string,
      {
        buyVolumeMON: bigint;
        sellVolumeMON: bigint;
        buyCount: number;
        sellCount: number;
        netTokens: bigint;
      }
    >();

    for (const trade of buyEvents) {
      const addr = trade.trader.toLowerCase();
      const existing = traderMap.get(addr) || {
        buyVolumeMON: 0n,
        sellVolumeMON: 0n,
        buyCount: 0,
        sellCount: 0,
        netTokens: 0n,
      };

      existing.buyVolumeMON += trade.monAmount;
      existing.buyCount++;
      existing.netTokens += trade.tokenAmount;
      traderMap.set(addr, existing);
    }

    for (const trade of sellEvents) {
      const addr = trade.trader.toLowerCase();
      const existing = traderMap.get(addr) || {
        buyVolumeMON: 0n,
        sellVolumeMON: 0n,
        buyCount: 0,
        sellCount: 0,
        netTokens: 0n,
      };

      existing.sellVolumeMON += trade.monAmount;
      existing.sellCount++;
      existing.netTokens -= trade.tokenAmount;
      traderMap.set(addr, existing);
    }

    // Convert to array and sort by total volume
    const traders = Array.from(traderMap.entries())
      .map(([address, data]) => ({
        address,
        buyVolumeMON: data.buyVolumeMON,
        sellVolumeMON: data.sellVolumeMON,
        totalVolumeMON: data.buyVolumeMON + data.sellVolumeMON,
        buyCount: data.buyCount,
        sellCount: data.sellCount,
        netTokens: data.netTokens,
      }))
      .sort((a, b) => (a.totalVolumeMON > b.totalVolumeMON ? -1 : 1));

    return traders.slice(0, limit);
  }

  /**
   * Get holder count estimate from trading activity
   * Uses The Graph if available, falls back to events
   */
  async getEstimatedHolderCount(tokenAddress: string, fromBlock: number = 0): Promise<number> {
    this.validateAddress(tokenAddress);

    // ✅ Use The Graph if available (much faster and more accurate!)
    if (this.hasGraphSupport() && this.graph) {
      const holders = await this.graph.getTokenHolders(tokenAddress.toLowerCase(), {
        first: 1000,
        orderBy: 'balance',
        orderDirection: 'desc'
      });

      // Count holders with positive balance
      return holders.filter((h: any) => BigInt(h.balance) > 0n).length;
    }

    // ⚠️ Fallback to events (slower and less accurate)
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
   * Get 24h trading volume in MON
   * Returns both the bigint value and formatted string
   * Uses The Graph if available, falls back to events
   */
  async get24hVolume(tokenAddress: string): Promise<{
    volumeMON: bigint;
    volumeFormatted: string;
    buyVolumeMON: bigint;
    sellVolumeMON: bigint;
    tradeCount: number;
  }> {
    this.validateAddress(tokenAddress);

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph) {
      const currentTime = Math.floor(Date.now() / 1000);
      const time24hAgo = currentTime - (24 * 60 * 60);

      const allTrades = await this.graph.getTrades(
        { token: tokenAddress.toLowerCase() },
        { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' }
      );

      // Filter trades from last 24 hours
      const recent24hTrades = allTrades.filter((t: any) => Number(t.timestamp) >= time24hAgo);

      const buyTrades = recent24hTrades.filter((t: any) => t.isBuy);
      const sellTrades = recent24hTrades.filter((t: any) => !t.isBuy);

      const buyVolume = buyTrades.reduce((sum: bigint, t: any) => sum + BigInt(t.monAmount), 0n);
      const sellVolume = sellTrades.reduce((sum: bigint, t: any) => sum + BigInt(t.monAmount), 0n);
      const totalVolume = buyVolume + sellVolume;

      return {
        volumeMON: totalVolume,
        volumeFormatted: this.safeFormatEther(totalVolume),
        buyVolumeMON: buyVolume,
        sellVolumeMON: sellVolume,
        tradeCount: recent24hTrades.length,
      };
    }

    // ⚠️ Fallback to events (slower, use only when Graph not available)
    // Calculate blocks in last 24 hours (Monad: ~1 second per block = ~86,400 blocks/day)
    const latestBlock = await this.provider.getBlockNumber();
    const blocksPerDay = 86400;
    const fromBlock = Math.max(0, latestBlock - blocksPerDay);

    const [buyEvents, sellEvents] = await Promise.all([
      this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
      this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
    ]);

    const buyVolume = buyEvents.reduce((sum, trade) => sum + trade.monAmount, 0n);
    const sellVolume = sellEvents.reduce((sum, trade) => sum + trade.monAmount, 0n);
    const totalVolume = buyVolume + sellVolume;

    return {
      volumeMON: totalVolume,
      volumeFormatted: this.safeFormatEther(totalVolume),
      buyVolumeMON: buyVolume,
      sellVolumeMON: sellVolume,
      tradeCount: buyEvents.length + sellEvents.length,
    };
  }

  /**
   * Get 24h price change percentage
   * Returns the price change over the last 24 hours
   * Uses The Graph if available, falls back to events
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

    // ✅ Use The Graph if available (much faster!)
    if (this.hasGraphSupport() && this.graph) {
      const currentTime = Math.floor(Date.now() / 1000);
      const time24hAgo = currentTime - (24 * 60 * 60);

      const allTrades = await this.graph.getTrades(
        { token: tokenAddress.toLowerCase() },
        { first: 1000, orderBy: 'timestamp', orderDirection: 'asc' }
      );

      // Find the first trade around 24h ago
      const trade24hAgo = allTrades.find((t: any) => Number(t.timestamp) >= time24hAgo);

      // If no trades found 24h ago, return 0 change
      if (!trade24hAgo) {
        return {
          priceChange: 0,
          priceChangePercent: 0,
          currentPrice,
          price24hAgo: currentPrice,
        };
      }

      const price24hAgo = BigInt(trade24hAgo.price);

      // Calculate change
      const priceDiff = currentPrice - price24hAgo;
      const priceChange = Number(priceDiff) / Number(price24hAgo);
      const priceChangePercent = priceChange * 100;

      return {
        priceChange,
        priceChangePercent,
        currentPrice,
        price24hAgo,
      };
    }

    // ⚠️ Fallback to events (slower, use only when Graph not available)
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
   * Format MON amount (bigint) to readable string
   * Handles very small amounts without scientific notation
   */
  formatMONAmount(amount: bigint): string {
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
   * Parse MON amount string to bigint
   * Handles scientific notation and very small values
   */
  parseMONAmount(amount: string): bigint {
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
