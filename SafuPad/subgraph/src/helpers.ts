import { BigInt } from "@graphprotocol/graph-ts";
import { PlatformStats, DailyStats } from "../generated/schema";

export function updatePlatformStats(timestamp: BigInt): void {
  let stats = PlatformStats.load("platform");
  if (!stats) {
    stats = new PlatformStats("platform");
    stats.totalLaunches = BigInt.fromI32(0);
    stats.totalProjectRaises = BigInt.fromI32(0);
    stats.totalInstantLaunches = BigInt.fromI32(0);
    stats.totalGraduated = BigInt.fromI32(0);
    stats.totalVolume = BigInt.fromI32(0);
    stats.totalFees = BigInt.fromI32(0);
    stats.totalRaised = BigInt.fromI32(0);
  }
  stats.lastUpdated = timestamp;
  stats.save();
}

export function updateDailyStats(
  timestamp: BigInt,
  volume: BigInt,
  fees: BigInt,
  trades: BigInt
): void {
  // Get day timestamp (timestamp / 86400 * 86400)
  let dayTimestamp = timestamp.div(BigInt.fromI32(86400)).times(BigInt.fromI32(86400));
  let dayId = dayTimestamp.toString();

  let dailyStats = DailyStats.load(dayId);
  if (!dailyStats) {
    dailyStats = new DailyStats(dayId);
    dailyStats.date = dayTimestamp;
    dailyStats.launches = BigInt.fromI32(0);
    dailyStats.volume = BigInt.fromI32(0);
    dailyStats.fees = BigInt.fromI32(0);
    dailyStats.trades = BigInt.fromI32(0);
    dailyStats.uniqueTraders = BigInt.fromI32(0);
  }

  dailyStats.volume = dailyStats.volume.plus(volume);
  dailyStats.fees = dailyStats.fees.plus(fees);
  dailyStats.trades = dailyStats.trades.plus(trades);
  dailyStats.save();
}
