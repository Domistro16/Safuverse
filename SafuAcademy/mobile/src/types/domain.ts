// Domain Types
export interface Domain {
  label: string;
  name: string; // label.safu
  owner: string;
  manager?: string;
  resolver: string;
  expiryDate: number;
  isWrapped: boolean;
  isAvailable?: boolean;
  isPrimary?: boolean;
  gracePeriodEnds?: number;
}

export interface DomainPrice {
  bnb: string;
  usd: string;
  token?: string; // For CAKE or USD1
}

export interface TextRecord {
  key: string;
  value: string;
}

export interface DomainProfile {
  email?: string;
  twitter?: string;
  github?: string;
  discord?: string;
  telegram?: string;
  reddit?: string;
  youtube?: string;
  website?: string;
  avatar?: string; // IPFS CID
  description?: string;
  phone?: string;
  address?: string;
}

export interface RegistrationData {
  label: string;
  owner: string;
  duration: number; // in seconds
  secret: string;
  resolver: string;
  data: string[]; // encoded resolver data
  reverseRecord: boolean;
  ownerControlledFuses: number;
  referrer?: string;
}

export interface CommitData {
  commitment: string;
  timestamp: number;
}

export interface ReferralStats {
  referralCount: number;
  totalEarnings: string; // in BNB
  tier: 'default' | 'silver' | 'gold';
  percentage: number;
  referralCode?: string;
}

export enum PaymentCurrency {
  BNB = 'BNB',
  CAKE = 'CAKE',
  USD1 = 'USD1',
}

export enum RegistrationStep {
  COMMIT = 1,
  WAIT = 2,
  REGISTER = 3,
  COMPLETE = 4,
}

// Domain availability status
export enum DomainStatus {
  AVAILABLE = 'available',
  REGISTERED = 'registered',
  TOO_SHORT = 'too_short',
  INVALID = 'invalid',
  CHECKING = 'checking',
}
