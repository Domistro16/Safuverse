// src/contracts/BondingCurveDEX.ts - Graph-based methods
// This file contains replacement methods using The Graph

import { GraphTrade } from '../graph/types';

/**
 * Get recent trades for a token using The Graph (replaces event-based method)
 * @deprecated Use graph version below when The Graph is available
 */
export async function getRecentTradesGraph(
  graph: any, // SafuPadGraph
  tokenAddress: string,
  limit: number = 50
): Promise<Array<{
  type: 'buy' | 'sell';
  trader: string;
  tokenAddress: string;
  monAmount: bigint;
  tokenAmount: bigint;
  price: bigint;
  feeRate: bigint;
  blockNumber: number;
  timestamp: number;
  txHash: string;
}>> {
  const trades = await graph.getTrades(
    { token: tokenAddress.toLowerCase() },
    { first: limit, orderBy: 'timestamp', orderDirection: 'desc' }
  );

  return trades.map((t: GraphTrade) => ({
    type: t.isBuy ? 'buy' as const : 'sell' as const,
    trader: t.trader,
    tokenAddress: t.token.id,
    monAmount: BigInt(t.monAmount),
    tokenAmount: BigInt(t.tokenAmount),
    price: BigInt(t.price),
    feeRate: BigInt(t.feeRate),
    blockNumber: Number(t.blockNumber),
    timestamp: Number(t.timestamp),
    txHash: t.transactionHash,
  }));
}
