import { CONFIG } from "../constants";
import type {
  SubgraphDomainOwner,
  SubgraphScoreSnapshot,
  SubgraphDomain,
} from "../types/reputation";

async function query<T>(gql: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(CONFIG.GOLDSKY_SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables }),
  });

  if (!res.ok) {
    throw new Error(`Goldsky query failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Goldsky GraphQL error: ${json.errors[0].message}`);
  }

  return json.data as T;
}

// ─── Queries ──────────────────────────────────────────────────────

export async function getDomainOwner(
  address: string
): Promise<SubgraphDomainOwner | null> {
  const data = await query<{ domainOwner: SubgraphDomainOwner | null }>(
    `query GetDomainOwner($address: ID!) {
      domainOwner(id: $address) {
        id
        ownerType
        totalTransactions
        successfulTransactions
        failedTransactions
        totalVolumeUSDC
        totalVolumeETH
        firstTransactionAt
        lastTransactionAt
        uniqueContractsInteracted
        reputationScore
        lastScoreUpdate
        domains {
          id
          ownerType
          registeredAt
          expiresAt
          isActive
          cost
        }
      }
    }`,
    { address: address.toLowerCase() }
  );

  return data.domainOwner;
}

export async function getScoreHistory(
  address: string,
  limit: number = 30
): Promise<SubgraphScoreSnapshot[]> {
  const data = await query<{ scoreSnapshots: SubgraphScoreSnapshot[] }>(
    `query GetScoreHistory($owner: String!, $limit: Int!) {
      scoreSnapshots(
        where: { owner: $owner }
        orderBy: timestamp
        orderDirection: desc
        first: $limit
      ) {
        id
        score
        timestamp
      }
    }`,
    { owner: address.toLowerCase(), limit }
  );

  return data.scoreSnapshots;
}

export interface LeaderboardOwner {
  id: string;
  ownerType: string;
  reputationScore: number;
  domains: { id: string }[];
}

export async function getLeaderboard(
  ownerType: string | null,
  limit: number = 50
): Promise<LeaderboardOwner[]> {
  const whereClause = ownerType ? `where: { ownerType: ${ownerType} }` : "";

  const data = await query<{ domainOwners: LeaderboardOwner[] }>(
    `query GetLeaderboard($limit: Int!) {
      domainOwners(
        ${whereClause}
        orderBy: reputationScore
        orderDirection: desc
        first: $limit
      ) {
        id
        ownerType
        reputationScore
        domains(first: 1) {
          id
        }
      }
    }`,
    { limit }
  );

  return data.domainOwners;
}

export async function getAggregateStats(): Promise<{
  allOwners: { id: string; reputationScore: number; ownerType: string }[];
  allDomains: { id: string; ownerType: string }[];
}> {
  const data = await query<{
    domainOwners: { id: string; reputationScore: number; ownerType: string }[];
    domains: { id: string; ownerType: string }[];
  }>(
    `query GetStats {
      domainOwners(first: 1000) {
        id
        reputationScore
        ownerType
      }
      domains(first: 1000) {
        id
        ownerType
      }
    }`
  );

  return { allOwners: data.domainOwners, allDomains: data.domains };
}
