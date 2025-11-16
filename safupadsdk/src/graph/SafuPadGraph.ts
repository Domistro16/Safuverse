// src/graph/SafuPadGraph.ts

import { GraphQLClient } from './client';
import * as queries from './queries';
import {
  GraphToken,
  GraphLaunch,
  GraphPool,
  GraphTrade,
  GraphContribution,
  GraphTokenHolder,
  GraphCreatorFees,
  GraphPlatformStats,
  GraphDailyStats,
  PaginationParams,
  LaunchFilters,
  TradeFilters,
  PoolFilters,
} from './types';

/**
 * SafuPad subgraph client
 * Provides methods to query indexed data from The Graph
 */
export class SafuPadGraph {
  private client: GraphQLClient;

  constructor(subgraphUrl: string) {
    this.client = new GraphQLClient(subgraphUrl);
  }

  /**
   * Get token by address
   */
  async getToken(tokenAddress: string): Promise<GraphToken | null> {
    const response = await this.client.query<{ token: GraphToken }>(queries.GET_TOKEN, {
      id: tokenAddress.toLowerCase(),
    });

    return response.data?.token || null;
  }

  /**
   * Get launch by token address
   */
  async getLaunch(tokenAddress: string): Promise<GraphLaunch | null> {
    const response = await this.client.query<{ launch: GraphLaunch }>(queries.GET_LAUNCH, {
      id: tokenAddress.toLowerCase(),
    });

    return response.data?.launch || null;
  }

  /**
   * Get all launches with optional filters and pagination
   */
  async getLaunches(
    filters?: LaunchFilters,
    pagination?: PaginationParams
  ): Promise<GraphLaunch[]> {
    const where: Record<string, any> = {};

    if (filters?.launchType) {
      where.launchType = filters.launchType;
    }
    if (filters?.founder) {
      where.founder = filters.founder.toLowerCase();
    }
    if (filters?.raiseCompleted !== undefined) {
      where.raiseCompleted = filters.raiseCompleted;
    }
    if (filters?.graduatedToPancakeSwap !== undefined) {
      where.graduatedToPancakeSwap = filters.graduatedToPancakeSwap;
    }

    const response = await this.client.query<{ launches: GraphLaunch[] }>(queries.GET_LAUNCHES, {
      where,
      first: pagination?.first || 100,
      skip: pagination?.skip || 0,
      orderBy: pagination?.orderBy || 'createdAt',
      orderDirection: pagination?.orderDirection || 'desc',
    });

    return response.data?.launches || [];
  }

  /**
   * Get pool by token address
   */
  async getPool(tokenAddress: string): Promise<GraphPool | null> {
    const response = await this.client.query<{ pool: GraphPool }>(queries.GET_POOL, {
      id: tokenAddress.toLowerCase(),
    });

    return response.data?.pool || null;
  }

  /**
   * Get all pools with optional filters and pagination
   */
  async getPools(filters?: PoolFilters, pagination?: PaginationParams): Promise<GraphPool[]> {
    const where: Record<string, any> = {};

    if (filters?.graduated !== undefined) {
      where.graduated = filters.graduated;
    }
    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    const response = await this.client.query<{ pools: GraphPool[] }>(queries.GET_POOLS, {
      where,
      first: pagination?.first || 100,
      skip: pagination?.skip || 0,
      orderBy: pagination?.orderBy || 'createdAt',
      orderDirection: pagination?.orderDirection || 'desc',
    });

    return response.data?.pools || [];
  }

  /**
   * Get trades with optional filters and pagination
   */
  async getTrades(filters?: TradeFilters, pagination?: PaginationParams): Promise<GraphTrade[]> {
    const where: Record<string, any> = {};

    if (filters?.token) {
      where.token = filters.token.toLowerCase();
    }
    if (filters?.trader) {
      where.trader = filters.trader.toLowerCase();
    }
    if (filters?.isBuy !== undefined) {
      where.isBuy = filters.isBuy;
    }

    const response = await this.client.query<{ trades: GraphTrade[] }>(queries.GET_TRADES, {
      where,
      first: pagination?.first || 100,
      skip: pagination?.skip || 0,
      orderBy: pagination?.orderBy || 'timestamp',
      orderDirection: pagination?.orderDirection || 'desc',
    });

    return response.data?.trades || [];
  }

  /**
   * Get contributions for a launch
   */
  async getContributions(
    launchId: string,
    pagination?: PaginationParams
  ): Promise<GraphContribution[]> {
    const response = await this.client.query<{ contributions: GraphContribution[] }>(
      queries.GET_CONTRIBUTIONS,
      {
        launchId: launchId.toLowerCase(),
        first: pagination?.first || 100,
        skip: pagination?.skip || 0,
      }
    );

    return response.data?.contributions || [];
  }

  /**
   * Get contribution for a specific contributor
   */
  async getContribution(
    launchId: string,
    contributor: string
  ): Promise<GraphContribution | null> {
    const response = await this.client.query<{ contributions: GraphContribution[] }>(
      queries.GET_CONTRIBUTION,
      {
        launchId: launchId.toLowerCase(),
        contributor: contributor.toLowerCase(),
      }
    );

    const contributions = response.data?.contributions || [];
    return contributions.length > 0 ? contributions[0] : null;
  }

  /**
   * Get token holders
   */
  async getTokenHolders(
    tokenId: string,
    pagination?: PaginationParams
  ): Promise<GraphTokenHolder[]> {
    const response = await this.client.query<{ tokenHolders: GraphTokenHolder[] }>(
      queries.GET_TOKEN_HOLDERS,
      {
        tokenId: tokenId.toLowerCase(),
        first: pagination?.first || 100,
        skip: pagination?.skip || 0,
        orderBy: pagination?.orderBy || 'balance',
        orderDirection: pagination?.orderDirection || 'desc',
      }
    );

    return response.data?.tokenHolders || [];
  }

  /**
   * Get creator fees
   */
  async getCreatorFees(tokenId: string, creator: string): Promise<GraphCreatorFees | null> {
    const response = await this.client.query<{ creatorFees: GraphCreatorFees[] }>(
      queries.GET_CREATOR_FEES,
      {
        tokenId: tokenId.toLowerCase(),
        creator: creator.toLowerCase(),
      }
    );

    const fees = response.data?.creatorFees || [];
    return fees.length > 0 ? fees[0] : null;
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<GraphPlatformStats | null> {
    const response = await this.client.query<{ platformStats: GraphPlatformStats }>(
      queries.GET_PLATFORM_STATS
    );

    return response.data?.platformStats || null;
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(days: number = 30): Promise<GraphDailyStats[]> {
    const response = await this.client.query<{ dailyStats: GraphDailyStats[] }>(
      queries.GET_DAILY_STATS,
      {
        first: days,
      }
    );

    return response.data?.dailyStats || [];
  }

  /**
   * Search tokens by name or symbol
   */
  async searchTokens(searchText: string, limit: number = 10): Promise<GraphToken[]> {
    const response = await this.client.query<{ tokens: GraphToken[] }>(queries.SEARCH_TOKENS, {
      searchText,
      first: limit,
    });

    return response.data?.tokens || [];
  }

  /**
   * Get user's trading history
   */
  async getUserTrades(trader: string, pagination?: PaginationParams): Promise<GraphTrade[]> {
    const response = await this.client.query<{ trades: GraphTrade[] }>(queries.GET_USER_TRADES, {
      trader: trader.toLowerCase(),
      first: pagination?.first || 100,
      skip: pagination?.skip || 0,
    });

    return response.data?.trades || [];
  }

  /**
   * Get user's contributions
   */
  async getUserContributions(
    contributor: string,
    pagination?: PaginationParams
  ): Promise<GraphContribution[]> {
    const response = await this.client.query<{ contributions: GraphContribution[] }>(
      queries.GET_USER_CONTRIBUTIONS,
      {
        contributor: contributor.toLowerCase(),
        first: pagination?.first || 100,
        skip: pagination?.skip || 0,
      }
    );

    return response.data?.contributions || [];
  }

  /**
   * Get trending tokens
   */
  async getTrendingTokens(limit: number = 10): Promise<GraphToken[]> {
    const response = await this.client.query<{ tokens: GraphToken[] }>(
      queries.GET_TRENDING_TOKENS,
      {
        first: limit,
      }
    );

    return response.data?.tokens || [];
  }

  /**
   * Get active pools (not graduated)
   */
  async getActivePools(pagination?: PaginationParams): Promise<GraphPool[]> {
    return this.getPools({ graduated: false, active: true }, pagination);
  }

  /**
   * Get graduated pools
   */
  async getGraduatedPools(pagination?: PaginationParams): Promise<GraphPool[]> {
    return this.getPools({ graduated: true }, pagination);
  }

  /**
   * Get active launches (not graduated)
   */
  async getActiveLaunches(pagination?: PaginationParams): Promise<GraphLaunch[]> {
    return this.getLaunches({ graduatedToPancakeSwap: false }, pagination);
  }

  /**
   * Get graduated launches
   */
  async getGraduatedLaunches(pagination?: PaginationParams): Promise<GraphLaunch[]> {
    return this.getLaunches({ graduatedToPancakeSwap: true }, pagination);
  }

  /**
   * Get Project Raise launches
   */
  async getProjectRaises(pagination?: PaginationParams): Promise<GraphLaunch[]> {
    return this.getLaunches({ launchType: 'PROJECT_RAISE' }, pagination);
  }

  /**
   * Get Instant Launch tokens
   */
  async getInstantLaunches(pagination?: PaginationParams): Promise<GraphLaunch[]> {
    return this.getLaunches({ launchType: 'INSTANT_LAUNCH' }, pagination);
  }

  /**
   * Update subgraph endpoint
   */
  setSubgraphUrl(url: string): void {
    this.client.setEndpoint(url);
  }

  /**
   * Get current subgraph endpoint
   */
  getSubgraphUrl(): string {
    return this.client.getEndpoint();
  }
}
