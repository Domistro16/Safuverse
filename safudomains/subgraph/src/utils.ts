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
