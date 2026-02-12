import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the goldsky service before importing the router
vi.mock("../src/services/goldsky", () => ({
  getDomainOwner: vi.fn(),
  getScoreHistory: vi.fn(),
  getLeaderboard: vi.fn(),
  getAggregateStats: vi.fn(),
}));

import express from "express";
import request from "supertest";
import reputationRoutes from "../src/routes/reputation";
import * as goldsky from "../src/services/goldsky";
import type { SubgraphDomainOwner } from "../src/types/reputation";

const app = express();
app.use(express.json());
app.use("/api/reputation", reputationRoutes);

const mockOwner: SubgraphDomainOwner = {
  id: "0x1234567890abcdef1234567890abcdef12345678",
  ownerType: "HUMAN",
  totalTransactions: "100",
  successfulTransactions: "95",
  failedTransactions: "5",
  totalVolumeUSDC: "5000",
  totalVolumeETH: "1.5",
  firstTransactionAt: String(Math.floor(Date.now() / 1000) - 180 * 86400),
  lastTransactionAt: String(Math.floor(Date.now() / 1000) - 86400),
  uniqueContractsInteracted: "10",
  reputationScore: 72,
  lastScoreUpdate: "0",
  domains: [
    {
      id: "alice.id",
      ownerType: "HUMAN",
      registeredAt: String(Math.floor(Date.now() / 1000) - 180 * 86400),
      expiresAt: "0",
      isActive: true,
      cost: "5",
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/reputation/:walletAddress", () => {
  it("returns 400 for invalid address", async () => {
    const res = await request(app).get("/api/reputation/invalid");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid wallet address");
  });

  it("returns 404 when owner not found", async () => {
    vi.mocked(goldsky.getDomainOwner).mockResolvedValue(null);
    const res = await request(app).get(
      "/api/reputation/0x1234567890abcdef1234567890abcdef12345678"
    );
    expect(res.status).toBe(404);
  });

  it("returns reputation data for valid owner", async () => {
    vi.mocked(goldsky.getDomainOwner).mockResolvedValue(mockOwner);
    const res = await request(app).get(
      "/api/reputation/0x1234567890abcdef1234567890abcdef12345678"
    );
    expect(res.status).toBe(200);
    expect(res.body.address).toBe(mockOwner.id);
    expect(res.body.ownerType).toBe("HUMAN");
    expect(res.body.reputationScore).toBeGreaterThan(0);
    expect(res.body.tier).toBeDefined();
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.stats).toBeDefined();
  });
});

describe("GET /api/reputation/:walletAddress/history", () => {
  it("returns score history", async () => {
    vi.mocked(goldsky.getDomainOwner).mockResolvedValue(mockOwner);
    vi.mocked(goldsky.getScoreHistory).mockResolvedValue([
      { id: "snap1", score: 70, timestamp: String(Math.floor(Date.now() / 1000) - 86400) },
      { id: "snap2", score: 65, timestamp: String(Math.floor(Date.now() / 1000) - 7 * 86400) },
    ]);

    const res = await request(app).get(
      "/api/reputation/0x1234567890abcdef1234567890abcdef12345678/history"
    );
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(2);
    expect(res.body.history[0].score).toBe(70);
  });
});

describe("POST /api/reputation/:walletAddress/refresh", () => {
  it("recalculates and returns old + new score", async () => {
    vi.mocked(goldsky.getDomainOwner).mockResolvedValue(mockOwner);

    const res = await request(app)
      .post("/api/reputation/0x1234567890abcdef1234567890abcdef12345678/refresh")
      .send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.previousScore).toBe(72);
    expect(res.body.newScore).toBeGreaterThan(0);
  });
});
