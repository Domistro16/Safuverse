export type OwnerType = "HUMAN" | "AGENT";

export type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface ScoreBreakdown {
  transactionScore: number;
  successRate: number;
  accountAge: number;
  volumeScore: number;
  diversityScore: number;
  recencyScore: number;
}

export interface OwnerStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalVolumeUSDC: number;
  uniqueContracts: number;
  accountAgeDays: number;
  lastActiveAt: string;
}

export interface ReputationResponse {
  address: string;
  ownerType: OwnerType;
  reputationScore: number;
  breakdown: ScoreBreakdown;
  stats: OwnerStats;
  tier: Tier;
}

export interface ScoreHistoryEntry {
  date: string;
  score: number;
}

export interface ScoreHistoryResponse {
  address: string;
  ownerType: OwnerType;
  history: ScoreHistoryEntry[];
}

export interface LeaderboardEntry {
  domain: string;
  address: string;
  ownerType: OwnerType;
  score: number;
}

export type LeaderboardFilter = "all" | "human" | "agent";

export interface LeaderboardResponse {
  filter: LeaderboardFilter;
  leaderboard: LeaderboardEntry[];
}

export interface AggregateStatsResponse {
  totalDomains: number;
  humanDomains: number;
  agentDomains: number;
  averageScore: number;
  averageHumanScore: number;
  averageAgentScore: number;
}

export interface RefreshResponse {
  success: boolean;
  previousScore: number;
  newScore: number;
}

// Goldsky subgraph entity shapes (raw GraphQL responses)

export interface SubgraphDomainOwner {
  id: string;
  ownerType: string;
  totalTransactions: string;
  successfulTransactions: string;
  failedTransactions: string;
  totalVolumeUSDC: string;
  totalVolumeETH: string;
  firstTransactionAt: string;
  lastTransactionAt: string;
  uniqueContractsInteracted: string;
  reputationScore: number;
  lastScoreUpdate: string;
  domains: SubgraphDomain[];
}

export interface SubgraphDomain {
  id: string;
  ownerType: string;
  registeredAt: string;
  expiresAt: string;
  isActive: boolean;
  cost: string;
}

export interface SubgraphScoreSnapshot {
  id: string;
  score: number;
  timestamp: string;
}
