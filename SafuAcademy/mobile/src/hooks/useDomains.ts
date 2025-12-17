import { useState, useCallback } from 'react';
import { domainService } from '@services/domainService';
import { useWeb3 } from '@/contexts/Web3Context';
import { Domain, DomainPrice, DomainStatus, TextRecord, ReferralStats } from '@types/domain';
import { DOMAIN_CONFIG } from '@config/domains';
import { ethers } from 'ethers';

export const useDomainAvailability = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<DomainStatus>(DomainStatus.CHECKING);

  const checkAvailability = useCallback(async (label: string): Promise<DomainStatus> => {
    try {
      setIsChecking(true);

      // Validate label
      if (label.length < DOMAIN_CONFIG.MIN_NAME_LENGTH) {
        setStatus(DomainStatus.TOO_SHORT);
        return DomainStatus.TOO_SHORT;
      }

      if (!/^[a-z0-9-]+$/.test(label)) {
        setStatus(DomainStatus.INVALID);
        return DomainStatus.INVALID;
      }

      const available = await domainService.checkAvailability(label);
      const newStatus = available ? DomainStatus.AVAILABLE : DomainStatus.REGISTERED;
      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      console.error('Error checking availability:', error);
      setStatus(DomainStatus.INVALID);
      return DomainStatus.INVALID;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { checkAvailability, isChecking, status };
};

export const useDomainPrice = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [price, setPrice] = useState<DomainPrice | null>(null);

  const getPrice = useCallback(async (label: string, years: number = 1, lifetime: boolean = false) => {
    try {
      setIsLoading(true);
      const duration = years * 365 * 24 * 60 * 60; // Convert years to seconds
      const priceData = await domainService.getDomainPrice(label, duration, lifetime);
      setPrice(priceData);
      return priceData;
    } catch (error) {
      console.error('Error getting price:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getPrice, isLoading, price };
};

export const useDomainRegistration = () => {
  const { provider, address } = useWeb3();
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const generateSecret = useCallback(() => {
    return ethers.hexlify(ethers.randomBytes(32));
  }, []);

  const commit = useCallback(
    async (
      label: string,
      duration: number,
      secret: string,
      referrer?: string
    ): Promise<string> => {
      if (!provider || !address) {
        throw new Error('Wallet not connected');
      }

      try {
        setIsRegistering(true);
        setCurrentStep(1);

        const signer = await (provider as ethers.BrowserProvider).getSigner();
        const commitment = domainService.generateCommitment(
          label,
          address,
          duration,
          secret,
          '0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357', // Public resolver
          [],
          true,
          0,
          referrer || ethers.ZeroAddress
        );

        await domainService.commitRegistration(commitment, signer);
        return commitment;
      } catch (error) {
        console.error('Error committing:', error);
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [provider, address]
  );

  const register = useCallback(
    async (
      label: string,
      duration: number,
      secret: string,
      priceInBnb: string,
      referrer?: string
    ) => {
      if (!provider || !address) {
        throw new Error('Wallet not connected');
      }

      try {
        setIsRegistering(true);
        setCurrentStep(3);

        const signer = await (provider as ethers.BrowserProvider).getSigner();
        const registrationData = {
          label,
          owner: address,
          duration,
          secret,
          resolver: '0xcAa73Cd19614523F9F3cfCa4A447120ceA8fd357',
          data: [],
          reverseRecord: true,
          ownerControlledFuses: 0,
          referrer,
        };

        const receipt = await domainService.registerDomain(
          registrationData,
          priceInBnb,
          signer
        );

        setCurrentStep(4);
        return receipt;
      } catch (error) {
        console.error('Error registering:', error);
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [provider, address]
  );

  return {
    commit,
    register,
    generateSecret,
    isRegistering,
    currentStep,
    setCurrentStep,
  };
};

export const useDomainDetails = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [domain, setDomain] = useState<Domain | null>(null);

  const getDomain = useCallback(async (label: string) => {
    try {
      setIsLoading(true);
      const domainData = await domainService.getDomainDetails(label);
      setDomain(domainData);
      return domainData;
    } catch (error) {
      console.error('Error getting domain:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getDomain, isLoading, domain };
};

export const useTextRecords = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [records, setRecords] = useState<TextRecord[]>([]);

  const getRecords = useCallback(async (label: string, keys: string[]) => {
    try {
      setIsLoading(true);
      const textRecords = await domainService.getTextRecords(label, keys);
      setRecords(textRecords);
      return textRecords;
    } catch (error) {
      console.error('Error getting text records:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setRecord = useCallback(
    async (label: string, key: string, value: string, signer: ethers.Signer) => {
      try {
        setIsLoading(true);
        const receipt = await domainService.setTextRecord(label, key, value, signer);
        return receipt;
      } catch (error) {
        console.error('Error setting text record:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { getRecords, setRecord, isLoading, records };
};

export const useReferralStats = () => {
  const { address } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);

  const getStats = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    try {
      setIsLoading(true);
      const referralStats = await domainService.getReferralStats(address);
      setStats(referralStats);
      return referralStats;
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return { getStats, isLoading, stats };
};

export const useRecentSearches = () => {
  const [searches, setSearches] = useState<string[]>([]);

  const loadSearches = useCallback(async () => {
    const recent = await domainService.getRecentSearches();
    setSearches(recent);
  }, []);

  const saveSearch = useCallback(async (label: string) => {
    await domainService.saveRecentSearch(label);
    await loadSearches();
  }, [loadSearches]);

  return { searches, loadSearches, saveSearch };
};
