import { BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { GlobalStats } from "../generated/schema";

export const ZERO_BI = BigInt.fromI32(0);
export const ONE_BI = BigInt.fromI32(1);
export const ZERO_BD = BigDecimal.fromString("0");

export const ENTRYPOINT_ADDRESS =
  "0x0000000071727de22e5e9d8baf0edac6f37da032";

export function toUSDCDecimal(amount: BigInt): BigDecimal {
  let divisor = BigInt.fromI32(10).pow(6).toBigDecimal();
  return amount.toBigDecimal().div(divisor);
}

export function toETHDecimal(amount: BigInt): BigDecimal {
  let divisor = BigInt.fromI32(10).pow(18).toBigDecimal();
  return amount.toBigDecimal().div(divisor);
}

export function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");
  if (stats == null) {
    stats = new GlobalStats("global");
    stats.totalDomains = ZERO_BI;
    stats.totalOwners = ZERO_BI;
    stats.totalVolumeUSDC = ZERO_BD;
    stats.totalVolumeETH = ZERO_BD;
    stats.totalReferralsPaid = ZERO_BD;
    stats.totalAuctions = ZERO_BI;
    stats.totalBids = ZERO_BI;
    stats.totalPointsDistributed = ZERO_BI;
  }
  return stats as GlobalStats;
}

/**
 * Reputation score — weighted factors (0–100).
 *
 *   Transaction count  — 20%  min(txCount / 100, 1) * 20
 *   Success rate       — 25%  (successful / total) * 25
 *   Account age        — 15%  min(daysSinceFirst / 365, 1) * 15
 *   Volume (USDC)      — 20%  min(totalUSDC / 10000, 1) * 20
 *   Contract diversity — 10%  min(uniqueContracts / 20, 1) * 10
 *   Activity recency   — 10%  max(0, 1 − daysSinceLast / 90) * 10
 */
export function calculateReputationScore(
  totalTransactions: BigInt,
  successfulTransactions: BigInt,
  firstTransactionAt: BigInt,
  lastTransactionAt: BigInt,
  totalVolumeUSDC: BigDecimal,
  uniqueContractsInteracted: BigInt,
  currentTimestamp: BigInt
): i32 {
  let total = totalTransactions.toI32();
  if (total == 0) return 0;

  let txRatio = total > 100 ? 1.0 : (total as f64) / 100.0;
  let txScore = txRatio * 20.0;

  let successRate =
    (successfulTransactions.toI32() as f64) / (total as f64);
  let successScore = successRate * 25.0;

  let secondsSinceFirst = currentTimestamp
    .minus(firstTransactionAt)
    .toI32();
  let daysSinceFirst = (secondsSinceFirst as f64) / 86400.0;
  let ageRatio = daysSinceFirst > 365.0 ? 1.0 : daysSinceFirst / 365.0;
  let ageScore = ageRatio * 15.0;

  let volumeF64 = parseFloat(totalVolumeUSDC.toString());
  let volumeRatio = volumeF64 > 10000.0 ? 1.0 : volumeF64 / 10000.0;
  let volumeScore = volumeRatio * 20.0;

  let contracts = uniqueContractsInteracted.toI32();
  let diversityRatio = contracts > 20 ? 1.0 : (contracts as f64) / 20.0;
  let diversityScore = diversityRatio * 10.0;

  let secondsSinceLast = currentTimestamp
    .minus(lastTransactionAt)
    .toI32();
  let daysSinceLast = (secondsSinceLast as f64) / 86400.0;
  let recencyRatio = 1.0 - daysSinceLast / 90.0;
  if (recencyRatio < 0.0) recencyRatio = 0.0;
  let recencyScore = recencyRatio * 10.0;

  let totalScore =
    txScore +
    successScore +
    ageScore +
    volumeScore +
    diversityScore +
    recencyScore;

  let rounded = (totalScore + 0.5) as i32;
  if (rounded > 100) rounded = 100;
  if (rounded < 0) rounded = 0;

  return rounded;
}
