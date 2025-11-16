// src/graph/client.ts

import { GraphResponse } from './types';

/**
 * GraphQL client for The Graph API
 */
export class GraphQLClient {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<GraphResponse<T>> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: variables || {},
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GraphResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        const error = result.errors[0];
        throw new Error(`GraphQL error: ${error.message}`);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to query subgraph: ${error.message}`);
      }
      throw new Error('Failed to query subgraph: Unknown error');
    }
  }

  /**
   * Update the endpoint URL
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  /**
   * Get current endpoint
   */
  getEndpoint(): string {
    return this.endpoint;
  }
}
