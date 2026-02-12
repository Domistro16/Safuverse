import { describe, it, expect } from "vitest";
import {
  calculateBreakdown,
  calculateScore,
  getTier,
  buildReputationResponse,
} from "../src/services/reputationCalculator";
import type { SubgraphDomainOwner } from "../src/types/reputation";

function makeOwner(overrides: Partial<SubgraphDomainOwner> = {}): SubgraphDomainOwner {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: "0x1234567890abcdef1234567890abcdef12345678",
    ownerType: "HUMAN",
    totalTransactions: "100",
    successfulTransactions: "95",
    failedTransactions: "5",
    totalVolumeUSDC: "5000",
    totalVolumeETH: "1.5",
    firstTransactionAt: String(now - 180 * 86400), // 180 days ago
    lastTransactionAt: String(now - 2 * 86400), // 2 days ago
    uniqueContractsInteracted: "10",
    reputationScore: 0,
    lastScoreUpdate: "0",
    domains: [],
    ...overrides,
  };
}

describe("calculateBreakdown", () => {
  it("returns all zeros for an owner with no transactions", () => {
    const owner = makeOwner({ totalTransactions: "0", successfulTransactions: "0" });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.transactionScore).toBe(0);
    expect(breakdown.successRate).toBe(0);
    expect(breakdown.accountAge).toBe(0);
    expect(breakdown.volumeScore).toBe(0);
    expect(breakdown.diversityScore).toBe(0);
    expect(breakdown.recencyScore).toBe(0);
  });

  it("caps transaction score at 20 for 100+ transactions", () => {
    const owner = makeOwner({ totalTransactions: "500", successfulTransactions: "500" });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.transactionScore).toBe(20);
  });

  it("scales transaction score linearly below 100", () => {
    const owner = makeOwner({ totalTransactions: "50", successfulTransactions: "50" });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.transactionScore).toBe(10);
  });

  it("gives max success rate for 100% success", () => {
    const owner = makeOwner({
      totalTransactions: "100",
      successfulTransactions: "100",
    });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.successRate).toBe(25);
  });

  it("scales success rate proportionally", () => {
    const owner = makeOwner({
      totalTransactions: "100",
      successfulTransactions: "80",
    });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.successRate).toBe(20);
  });

  it("caps volume score at 20 for 10000+ USDC", () => {
    const owner = makeOwner({ totalVolumeUSDC: "50000" });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.volumeScore).toBe(20);
  });

  it("gives max diversity score for 20+ contracts", () => {
    const owner = makeOwner({ uniqueContractsInteracted: "30" });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.diversityScore).toBe(10);
  });

  it("gives high recency score for recently active owner", () => {
    const now = Math.floor(Date.now() / 1000);
    const owner = makeOwner({ lastTransactionAt: String(now - 3600) }); // 1 hour ago
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.recencyScore).toBeGreaterThan(9);
  });

  it("gives zero recency for 90+ days inactive", () => {
    const now = Math.floor(Date.now() / 1000);
    const owner = makeOwner({ lastTransactionAt: String(now - 100 * 86400) });
    const breakdown = calculateBreakdown(owner);
    expect(breakdown.recencyScore).toBe(0);
  });
});

describe("calculateScore", () => {
  it("sums all breakdown components", () => {
    const score = calculateScore({
      transactionScore: 20,
      successRate: 25,
      accountAge: 15,
      volumeScore: 20,
      diversityScore: 10,
      recencyScore: 10,
    });
    expect(score).toBe(100);
  });

  it("rounds correctly", () => {
    const score = calculateScore({
      transactionScore: 10.4,
      successRate: 12.3,
      accountAge: 7.5,
      volumeScore: 10.1,
      diversityScore: 5.2,
      recencyScore: 5.0,
    });
    expect(score).toBe(51);
  });
});

describe("getTier", () => {
  it("returns Bronze for 0-39", () => {
    expect(getTier(0)).toBe("Bronze");
    expect(getTier(20)).toBe("Bronze");
    expect(getTier(39)).toBe("Bronze");
  });

  it("returns Silver for 40-69", () => {
    expect(getTier(40)).toBe("Silver");
    expect(getTier(55)).toBe("Silver");
    expect(getTier(69)).toBe("Silver");
  });

  it("returns Gold for 70-89", () => {
    expect(getTier(70)).toBe("Gold");
    expect(getTier(80)).toBe("Gold");
    expect(getTier(89)).toBe("Gold");
  });

  it("returns Platinum for 90-100", () => {
    expect(getTier(90)).toBe("Platinum");
    expect(getTier(95)).toBe("Platinum");
    expect(getTier(100)).toBe("Platinum");
  });
});

describe("buildReputationResponse", () => {
  it("returns a complete response object", () => {
    const owner = makeOwner();
    const response = buildReputationResponse(owner);

    expect(response.address).toBe(owner.id);
    expect(response.ownerType).toBe("HUMAN");
    expect(response.reputationScore).toBeGreaterThan(0);
    expect(response.reputationScore).toBeLessThanOrEqual(100);
    expect(response.tier).toBeDefined();
    expect(response.breakdown).toBeDefined();
    expect(response.stats.totalTransactions).toBe(100);
    expect(response.stats.successfulTransactions).toBe(95);
    expect(response.stats.failedTransactions).toBe(5);
    expect(response.stats.totalVolumeUSDC).toBe(5000);
    expect(response.stats.accountAgeDays).toBeGreaterThan(0);
    expect(response.stats.lastActiveAt).toBeTruthy();
  });

  it("handles AGENT owner type", () => {
    const owner = makeOwner({ ownerType: "AGENT" });
    const response = buildReputationResponse(owner);
    expect(response.ownerType).toBe("AGENT");
  });

  it("produces consistent score from breakdown", () => {
    const owner = makeOwner();
    const response = buildReputationResponse(owner);
    const breakdown = response.breakdown;
    const expectedScore = Math.round(
      breakdown.transactionScore +
        breakdown.successRate +
        breakdown.accountAge +
        breakdown.volumeScore +
        breakdown.diversityScore +
        breakdown.recencyScore
    );
    expect(response.reputationScore).toBe(expectedScore);
  });
});
