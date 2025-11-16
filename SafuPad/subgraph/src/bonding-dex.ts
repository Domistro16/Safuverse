import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  PoolCreated,
  TokensBought,
  TokensSold,
  PoolGraduated,
  CreatorFeesClaimed,
} from "../generated/BondingDEX/BondingDEX";
import { Pool, Trade, Token, TokenHolder, CreatorFees, PlatformStats } from "../generated/schema";
import { updatePlatformStats, updateDailyStats } from "./helpers";

export function handlePoolCreated(event: PoolCreated): void {
  let tokenAddress = event.params.token.toHexString();
  let pool = new Pool(tokenAddress);

  pool.token = tokenAddress;
  pool.creator = event.params.creator;
  pool.bnbReserve = event.params.initialLiquidity;
  pool.tokenReserve = event.params.tradableTokens;
  pool.reservedTokens = event.params.reservedTokens;
  pool.virtualBnbReserve = event.params.virtualBnbReserve;
  pool.marketCap = BigInt.fromI32(0);
  pool.graduationMarketCap = BigInt.fromI32(0);
  pool.currentPrice = BigInt.fromI32(0);
  pool.active = true;
  pool.graduated = false;
  pool.bnbForPancakeSwap = BigInt.fromI32(0);
  pool.launchBlock = event.params.launchBlock;
  pool.graduationBnbThreshold = event.params.graduationBnbThreshold;
  pool.totalVolume = BigInt.fromI32(0);
  pool.totalBuys = BigInt.fromI32(0);
  pool.totalSells = BigInt.fromI32(0);
  pool.createdAt = event.block.timestamp;

  pool.save();

  // Update token
  let token = Token.load(tokenAddress);
  if (token) {
    token.pool = pool.id;
    token.save();
  }

  // Initialize creator fees
  let creatorFeesId = tokenAddress + "-" + event.params.creator.toHexString();
  let creatorFees = new CreatorFees(creatorFeesId);
  creatorFees.token = tokenAddress;
  creatorFees.creator = event.params.creator;
  creatorFees.accumulatedFees = BigInt.fromI32(0);
  creatorFees.totalClaimed = BigInt.fromI32(0);
  creatorFees.lastClaimTime = event.block.timestamp;
  creatorFees.claimCount = BigInt.fromI32(0);
  creatorFees.save();
}

export function handleTokensBought(event: TokensBought): void {
  let tokenAddress = event.params.token.toHexString();
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  // Create trade
  let trade = new Trade(tradeId);
  trade.pool = tokenAddress;
  trade.token = tokenAddress;
  trade.trader = event.params.buyer;
  trade.isBuy = true;
  trade.bnbAmount = event.params.bnbAmount;
  trade.tokenAmount = event.params.tokensReceived;
  trade.price = event.params.currentPrice;
  trade.feeRate = event.params.feeRate;
  trade.totalFee = event.params.bnbAmount.times(event.params.feeRate).div(BigInt.fromI32(10000));
  trade.timestamp = event.block.timestamp;
  trade.blockNumber = event.block.number;
  trade.transactionHash = event.transaction.hash;
  trade.save();

  // Update pool
  let pool = Pool.load(tokenAddress);
  if (pool) {
    pool.totalVolume = pool.totalVolume.plus(event.params.bnbAmount);
    pool.totalBuys = pool.totalBuys.plus(BigInt.fromI32(1));
    pool.currentPrice = event.params.currentPrice;
    pool.save();
  }

  // Update token
  let token = Token.load(tokenAddress);
  if (token) {
    token.totalVolume = token.totalVolume.plus(event.params.bnbAmount);
    token.totalTrades = token.totalTrades.plus(BigInt.fromI32(1));
    token.save();
  }

  // Update token holder
  updateTokenHolder(
    tokenAddress,
    event.params.buyer,
    event.params.tokensReceived,
    true,
    event.block.timestamp
  );

  // Update platform stats
  updatePlatformStats(event.block.timestamp);
  let stats = PlatformStats.load("platform");
  if (stats) {
    stats.totalVolume = stats.totalVolume.plus(event.params.bnbAmount);
    stats.totalFees = stats.totalFees.plus(trade.totalFee);
    stats.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, event.params.bnbAmount, trade.totalFee, BigInt.fromI32(1));
}

export function handleTokensSold(event: TokensSold): void {
  let tokenAddress = event.params.token.toHexString();
  let tradeId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();

  // Create trade
  let trade = new Trade(tradeId);
  trade.pool = tokenAddress;
  trade.token = tokenAddress;
  trade.trader = event.params.seller;
  trade.isBuy = false;
  trade.bnbAmount = event.params.bnbReceived;
  trade.tokenAmount = event.params.tokensAmount;
  trade.price = event.params.currentPrice;
  trade.feeRate = event.params.feeRate;
  trade.totalFee = event.params.bnbReceived.times(event.params.feeRate).div(BigInt.fromI32(10000));
  trade.timestamp = event.block.timestamp;
  trade.blockNumber = event.block.number;
  trade.transactionHash = event.transaction.hash;
  trade.save();

  // Update pool
  let pool = Pool.load(tokenAddress);
  if (pool) {
    pool.totalVolume = pool.totalVolume.plus(event.params.bnbReceived);
    pool.totalSells = pool.totalSells.plus(BigInt.fromI32(1));
    pool.currentPrice = event.params.currentPrice;
    pool.save();
  }

  // Update token
  let token = Token.load(tokenAddress);
  if (token) {
    token.totalVolume = token.totalVolume.plus(event.params.bnbReceived);
    token.totalTrades = token.totalTrades.plus(BigInt.fromI32(1));
    token.save();
  }

  // Update token holder
  updateTokenHolder(
    tokenAddress,
    event.params.seller,
    event.params.tokensAmount,
    false,
    event.block.timestamp
  );

  // Update platform stats
  updatePlatformStats(event.block.timestamp);
  let stats = PlatformStats.load("platform");
  if (stats) {
    stats.totalVolume = stats.totalVolume.plus(event.params.bnbReceived);
    stats.totalFees = stats.totalFees.plus(trade.totalFee);
    stats.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, event.params.bnbReceived, trade.totalFee, BigInt.fromI32(1));
}

export function handlePoolGraduated(event: PoolGraduated): void {
  let tokenAddress = event.params.token.toHexString();
  let pool = Pool.load(tokenAddress);

  if (pool) {
    pool.graduated = true;
    pool.active = false;
    pool.graduationMarketCap = event.params.finalMarketCap;
    pool.bnbForPancakeSwap = event.params.bnbForPancakeSwap;
    pool.graduatedAt = event.block.timestamp;
    pool.save();
  }
}

export function handleCreatorFeesClaimed(event: CreatorFeesClaimed): void {
  let tokenAddress = event.params.token.toHexString();
  let creatorAddress = event.params.creator.toHexString();
  let creatorFeesId = tokenAddress + "-" + creatorAddress;

  let creatorFees = CreatorFees.load(creatorFeesId);
  if (creatorFees) {
    creatorFees.totalClaimed = creatorFees.totalClaimed.plus(event.params.amount);
    creatorFees.lastClaimTime = event.block.timestamp;
    creatorFees.claimCount = creatorFees.claimCount.plus(BigInt.fromI32(1));
    creatorFees.accumulatedFees = BigInt.fromI32(0); // Reset accumulated fees
    creatorFees.save();
  }
}

function updateTokenHolder(
  tokenAddress: string,
  holder: Bytes,
  amount: BigInt,
  isBuy: boolean,
  timestamp: BigInt
): void {
  let holderId = tokenAddress + "-" + holder.toHexString();
  let tokenHolder = TokenHolder.load(holderId);

  if (!tokenHolder) {
    tokenHolder = new TokenHolder(holderId);
    tokenHolder.token = tokenAddress;
    tokenHolder.holder = holder;
    tokenHolder.balance = BigInt.fromI32(0);
    tokenHolder.totalBought = BigInt.fromI32(0);
    tokenHolder.totalSold = BigInt.fromI32(0);
    tokenHolder.firstBuyTimestamp = isBuy ? timestamp : null;
  }

  if (isBuy) {
    tokenHolder.balance = tokenHolder.balance.plus(amount);
    tokenHolder.totalBought = tokenHolder.totalBought.plus(amount);
    if (!tokenHolder.firstBuyTimestamp) {
      tokenHolder.firstBuyTimestamp = timestamp;
    }
  } else {
    tokenHolder.balance = tokenHolder.balance.minus(amount);
    tokenHolder.totalSold = tokenHolder.totalSold.plus(amount);
  }

  tokenHolder.lastActivityTimestamp = timestamp;
  tokenHolder.save();
}
