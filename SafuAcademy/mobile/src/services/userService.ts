import { apiClient } from './api';
import { User, UserStats, PointsTransaction, Certificate, ApiResponse } from '@types/index';

export interface UserProfile extends User {
  stats: UserStats;
}

export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/api/user/profile');
    if (!response.data) {
      throw new Error('Failed to get profile');
    }
    return response.data;
  },

  /**
   * Get user points
   */
  async getPoints(): Promise<number> {
    const response = await apiClient.get<ApiResponse<{ points: number }>>('/api/user/points');
    return response.data?.points || 0;
  },

  /**
   * Get user stats
   */
  async getStats(): Promise<UserStats> {
    const response = await apiClient.get<ApiResponse<UserStats>>('/api/user/stats');
    if (!response.data) {
      throw new Error('Failed to get stats');
    }
    return response.data;
  },

  /**
   * Get points transaction history
   */
  async getTransactions(): Promise<PointsTransaction[]> {
    const response = await apiClient.get<ApiResponse<PointsTransaction[]>>(
      '/api/user/transactions'
    );
    return response.data || [];
  },

  /**
   * Get user certificates
   */
  async getCertificates(): Promise<Certificate[]> {
    const response = await apiClient.get<ApiResponse<Certificate[]>>('/api/user/certificates');
    return response.data || [];
  },

  /**
   * Check domain status
   */
  async getDomainStatus(): Promise<{ hasDomain: boolean; domain?: string }> {
    const response = await apiClient.get<
      ApiResponse<{ hasDomain: boolean; domain?: string }>
    >('/api/user/domain-status');
    return response.data || { hasDomain: false };
  },

  /**
   * Get blockchain status
   */
  async getBlockchainStatus(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/api/user/blockchain-status');
    return response.data || {};
  },
};
