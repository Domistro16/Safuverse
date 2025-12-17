import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@config/constants';
import { User, LoginResponse, ApiResponse } from '@types/index';

export interface NonceResponse {
  nonce: string;
}

export interface VerifySignatureRequest {
  walletAddress: string;
  signature: string;
}

export const authService = {
  /**
   * Get a nonce for wallet authentication
   */
  async getNonce(walletAddress: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<NonceResponse>>('/api/auth/nonce', {
      walletAddress,
    });
    if (!response.data?.nonce) {
      throw new Error('Failed to get nonce');
    }
    return response.data.nonce;
  },

  /**
   * Verify signature and get JWT token
   */
  async verifySignature(
    walletAddress: string,
    signature: string
  ): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/verify', {
      walletAddress,
      signature,
    });

    if (!response.data) {
      throw new Error('Failed to verify signature');
    }

    // Store token and user data
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.data.token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
    await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, walletAddress);

    return response.data;
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/api/auth/me');
    if (!response.data) {
      throw new Error('Failed to get user data');
    }
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.WALLET_ADDRESS,
    ]);
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!token;
  },

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Get stored user data
   */
  async getUserData(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },
};
