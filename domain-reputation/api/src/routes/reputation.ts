import { Router, Request, Response } from "express";
import {
  getDomainOwner,
  getScoreHistory,
  getLeaderboard,
  getAggregateStats,
} from "../services/goldsky";
import {
  buildReputationResponse,
  calculateBreakdown,
  calculateScore,
  getTier,
} from "../services/reputationCalculator";
import type {
  LeaderboardFilter,
  LeaderboardResponse,
  ScoreHistoryResponse,
  AggregateStatsResponse,
  RefreshResponse,
  OwnerType,
} from "../types/reputation";

const router = Router();

// ─── GET /api/reputation/:walletAddress ──────────────────────────

router.get("/:walletAddress", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const owner = await getDomainOwner(walletAddress);
    if (!owner) {
      return res.status(404).json({ error: "Address not found or has no domains" });
    }

    const response = buildReputationResponse(owner);
    return res.json(response);
  } catch (err) {
    console.error("Error fetching reputation:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reputation/:walletAddress/history ──────────────────

router.get("/:walletAddress/history", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const owner = await getDomainOwner(walletAddress);
    if (!owner) {
      return res.status(404).json({ error: "Address not found or has no domains" });
    }

    const snapshots = await getScoreHistory(walletAddress);
    const history = snapshots.map((s) => ({
      date: new Date(parseInt(s.timestamp, 10) * 1000)
        .toISOString()
        .split("T")[0],
      score: s.score,
    }));

    const response: ScoreHistoryResponse = {
      address: walletAddress.toLowerCase(),
      ownerType: owner.ownerType as OwnerType,
      history,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error fetching history:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reputation/leaderboard ─────────────────────────────

router.get("/leaderboard", async (req: Request, res: Response) => {
  try {
    const filterParam = (req.query.type as string) || "all";
    const validFilters: LeaderboardFilter[] = ["all", "human", "agent"];
    const filter: LeaderboardFilter = validFilters.includes(
      filterParam as LeaderboardFilter
    )
      ? (filterParam as LeaderboardFilter)
      : "all";

    const ownerType =
      filter === "human" ? "HUMAN" : filter === "agent" ? "AGENT" : null;
    const owners = await getLeaderboard(ownerType);

    const leaderboard = owners
      .filter((o) => o.domains.length > 0)
      .map((o) => ({
        domain: o.domains[0]?.id || "unknown",
        address: o.id,
        ownerType: o.ownerType as OwnerType,
        score: o.reputationScore,
      }));

    const response: LeaderboardResponse = { filter, leaderboard };
    return res.json(response);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── GET /api/reputation/stats ───────────────────────────────────

router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const { allOwners, allDomains } = await getAggregateStats();

    const humanDomains = allDomains.filter((d) => d.ownerType === "HUMAN").length;
    const agentDomains = allDomains.filter((d) => d.ownerType === "AGENT").length;

    const humanOwners = allOwners.filter((o) => o.ownerType === "HUMAN");
    const agentOwners = allOwners.filter((o) => o.ownerType === "AGENT");

    const avgScore =
      allOwners.length > 0
        ? Math.round(
            allOwners.reduce((sum, o) => sum + o.reputationScore, 0) /
              allOwners.length
          )
        : 0;

    const avgHumanScore =
      humanOwners.length > 0
        ? Math.round(
            humanOwners.reduce((sum, o) => sum + o.reputationScore, 0) /
              humanOwners.length
          )
        : 0;

    const avgAgentScore =
      agentOwners.length > 0
        ? Math.round(
            agentOwners.reduce((sum, o) => sum + o.reputationScore, 0) /
              agentOwners.length
          )
        : 0;

    const response: AggregateStatsResponse = {
      totalDomains: allDomains.length,
      humanDomains,
      agentDomains,
      averageScore: avgScore,
      averageHumanScore: avgHumanScore,
      averageAgentScore: avgAgentScore,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error fetching stats:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/reputation/:walletAddress/refresh ─────────────────

router.post("/:walletAddress/refresh", async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    const owner = await getDomainOwner(walletAddress);
    if (!owner) {
      return res.status(404).json({ error: "Address not found or has no domains" });
    }

    const previousScore = owner.reputationScore;
    const breakdown = calculateBreakdown(owner);
    const newScore = calculateScore(breakdown);

    const response: RefreshResponse = {
      success: true,
      previousScore,
      newScore,
    };

    return res.json(response);
  } catch (err) {
    console.error("Error refreshing score:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
