import { useState, useCallback } from 'react';
import { blockchainService } from '@services/blockchainService';
import { useWeb3 } from '@/contexts/Web3Context';
import { ethers } from 'ethers';

export const useBlockchain = () => {
  const { provider, address, isConnected } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSigner = async (): Promise<ethers.Signer> => {
    if (!provider) {
      throw new Error('Wallet not connected');
    }
    // For BrowserProvider
    if (provider instanceof ethers.BrowserProvider) {
      return await provider.getSigner();
    }
    throw new Error('Invalid provider');
  };

  const enrollInCourse = useCallback(
    async (courseId: string, enrollmentCost: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const signer = await getSigner();
        const receipt = await blockchainService.enrollInCourse(courseId, signer, enrollmentCost);
        return receipt;
      } catch (err: any) {
        setError(err.message || 'Failed to enroll in course');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [provider]
  );

  const updateCourseProgress = useCallback(
    async (courseId: string, progress: number) => {
      try {
        setIsLoading(true);
        setError(null);
        const signer = await getSigner();
        const receipt = await blockchainService.updateCourseProgress(courseId, progress, signer);
        return receipt;
      } catch (err: any) {
        setError(err.message || 'Failed to update progress');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [provider]
  );

  const getUserPoints = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    try {
      setIsLoading(true);
      setError(null);
      const points = await blockchainService.getUserPoints(address);
      return points;
    } catch (err: any) {
      setError(err.message || 'Failed to get user points');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const isCourseCompleted = useCallback(
    async (courseId: string) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }
      try {
        setIsLoading(true);
        setError(null);
        const completed = await blockchainService.isCourseCompleted(address, courseId);
        return completed;
      } catch (err: any) {
        setError(err.message || 'Failed to check course completion');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address]
  );

  return {
    isLoading,
    error,
    enrollInCourse,
    updateCourseProgress,
    getUserPoints,
    isCourseCompleted,
    isConnected,
  };
};
