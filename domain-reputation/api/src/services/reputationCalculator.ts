import type {
  OwnerType,
  Tier,
  ScoreBreakdown,
  OwnerStats,
  ReputationResponse,
  SubgraphDomainOwner,
} from "../types/reputation";
import { CONFIG } from "../constants";

function getDaysSince(unixTimestamp: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, (now - unixTimestamp) / 86400);
}

export function calculateBreakdown(owner: SubgraphDomainOwner): ScoreBreakdown {
  const totalTx = parseInt(owner.totalTransactions, 10);
  const successfulTx = parseInt(owner.successfulTransactions, 10);
  const firstAt = parseInt(owner.firstTransactionAt, 10);
  const lastAt = parseInt(owner.lastTransactionAt, 10);
  const volumeUSDC = parseFloat(owner.totalVolumeUSDC);
  const uniqueContracts = parseInt(owner.uniqueContractsInteracted, 10);

  if (totalTx === 0) {
    return {
      transactionScore: 0,
      successRate: 0,
      accountAge: 0,
      volumeScore: 0,
      diversityScore: 0,
      recencyScore: 0,
    };
  }

  const transactionScore = Math.round(Math.min(totalTx / 100, 1) * 20 * 100) / 100;
  const successRate = Math.round((successfulTx / totalTx) * 25 * 100) / 100;
  const accountAge =
    Math.round(Math.min(getDaysSince(firstAt) / 365, 1) * 15 * 100) / 100;
  const volumeScore =
    Math.round(Math.min(volumeUSDC / 10000, 1) * 20 * 100) / 100;
  const diversityScore =
    Math.round(Math.min(uniqueContracts / 20, 1) * 10 * 100) / 100;
  const recencyScore =
    Math.round(
      Math.max(0, 1 - getDaysSince(lastAt) / 90) * 10 * 100
    ) / 100;

  return {
    transactionScore,
    successRate,
    accountAge,
    volumeScore,
    diversityScore,
    recencyScore,
  };
}

export function calculateScore(breakdown: ScoreBreakdown): number {
  return Math.round(
    breakdown.transactionScore +
      breakdown.successRate +
      breakdown.accountAge +
      breakdown.volumeScore +
      breakdown.diversityScore +
      breakdown.recencyScore
  );
}

export function getTier(score: number): Tier {
  if (score >= CONFIG.TIERS.PLATINUM.min) return "Platinum";
  if (score >= CONFIG.TIERS.GOLD.min) return "Gold";
  if (score >= CONFIG.TIERS.SILVER.min) return "Silver";
  return "Bronze";
}

export function buildReputationResponse(
  owner: SubgraphDomainOwner
): ReputationResponse {
  const breakdown = calculateBreakdown(owner);
  const score = calculateScore(breakdown);
  const tier = getTier(score);

  const firstAt = parseInt(owner.firstTransactionAt, 10);
  const lastAt = parseInt(owner.lastTransactionAt, 10);

  const stats: OwnerStats = {
    totalTransactions: parseInt(owner.totalTransactions, 10),
    successfulTransactions: parseInt(owner.successfulTransactions, 10),
    failedTransactions: parseInt(owner.failedTransactions, 10),
    totalVolumeUSDC: parseFloat(owner.totalVolumeUSDC),
    uniqueContracts: parseInt(owner.uniqueContractsInteracted, 10),
    accountAgeDays: Math.floor(getDaysSince(firstAt)),
    lastActiveAt: new Date(lastAt * 1000).toISOString(),
  };

  return {
    address: owner.id,
    ownerType: owner.ownerType as OwnerType,
    reputationScore: score,
    breakdown,
    stats,
    tier,
  };
}
