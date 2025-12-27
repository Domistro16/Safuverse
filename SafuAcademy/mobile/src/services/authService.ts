import { apiClient } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@config/constants';
import { User, LoginResponse, ApiResponse } from '@types/index';

export interface NonceResponse {
  nonce: string;
  message: string;
  timestamp: number;
}

export interface VerifySignatureRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export const authService = {
  /**
   * Get a nonce and message for wallet authentication
   */
  async getNonce(walletAddress: string): Promise<NonceResponse> {
    // apiClient.post already returns response.data, so we get the object directly
    const response = await apiClient.post<NonceResponse>('/api/auth/nonce', {
      walletAddress,
    });
    if (!response?.nonce || !response?.message) {
      throw new Error('Failed to get nonce');
    }
    return response;
  },

  /**
   * Verify signature and get JWT token
   */
  async verifySignature(
    walletAddress: string,
    signature: string,
    message: string
  ): Promise<LoginResponse> {
    // apiClient.post already returns response.data
    const response = await apiClient.post<LoginResponse>('/api/auth/verify', {
      walletAddress,
      signature,
      message,
    });

    if (!response) {
      throw new Error('Failed to verify signature');
    }

    // Store token and user data
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
    await AsyncStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, walletAddress);

    return response;
  },

  /**
   * Get current authenticated user
   */
  async getMe(): Promise<User> {
    // apiClient.get already returns response.data
    const response = await apiClient.get<User>('/api/auth/me');
    if (!response) {
      throw new Error('Failed to get user data');
    }
    return response;
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
