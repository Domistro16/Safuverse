// src/utils/index.ts
import { ethers } from 'ethers';
import {
  LaunchInfo,
  PoolInfo,
  FormattedLaunchInfo,
  FormattedPoolInfo,
  LaunchType,
} from '../types';

/**
 * Format utilities
 */
export class Formatter {
  /**
   * Format BNB amount to string (BSC native token)
   */
  static formatBNB(amount: bigint | string): string {
    return ethers.formatEther(amount);
  }

  /**
   * Format token amount to string
   */
  static formatToken(amount: bigint | string, decimals: number = 18): string {
    return ethers.formatUnits(amount, decimals);
  }

  /**
   * Format USD amount to string
   */
  static formatUSD(amount: bigint | string, decimals: number = 18): string {
    const formatted = ethers.formatUnits(amount, decimals);
    const num = parseFloat(formatted);
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  /**
   * Format percentage
   */
  static formatPercent(value: number | bigint, decimals: number = 2): string {
    const num = typeof value === 'bigint' ? Number(value) : value;
    return `${num.toFixed(decimals)}%`;
  }

  /**
   * Format timestamp to date
   */
  static formatDate(timestamp: bigint | number): Date {
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(ts * 1000);
  }

  /**
   * Format duration in seconds to human readable
   */
  static formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format address (shorten)
   */
  static formatAddress(
    address: string,
    startChars: number = 6,
    endChars: number = 4
  ): string {
    if (!ethers.isAddress(address)) {
      return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  }

  /**
   * Format launch info for display
   */
  static formatLaunchInfo(info: LaunchInfo): FormattedLaunchInfo {
    const totalRaised = parseFloat(ethers.formatEther(info.totalRaised));
    const raiseTarget = parseFloat(ethers.formatEther(info.raiseTarget));
    const progressPercent = raiseTarget > 0 ? (totalRaised / raiseTarget) * 100 : 0;

    return {
      founder: info.founder,
      raiseTarget: ethers.formatEther(info.raiseTarget),
      raiseMax: ethers.formatEther(info.raiseMax),
      totalRaised: ethers.formatEther(info.totalRaised),
      raiseDeadline: Formatter.formatDate(info.raiseDeadline),
      raiseCompleted: info.raiseCompleted,
      graduatedToPancakeSwap: info.graduatedToPancakeSwap,
      progressPercent: Math.min(progressPercent, 100),
      launchType: info.launchType === LaunchType.PROJECT_RAISE ? 'PROJECT_RAISE' : 'INSTANT_LAUNCH',
      burnLP: info.burnLP,
    };
  }

  /**
   * Format pool info for display
   */
  static formatPoolInfo(info: PoolInfo): FormattedPoolInfo {
    return {
      marketCapUSD: Formatter.formatUSD(info.marketCapUSD),
      marketCapBNB: Formatter.formatBNB(info.marketCapBNB),
      bnbReserve: Formatter.formatBNB(info.bnbReserve),
      tokenReserve: Formatter.formatToken(info.tokenReserve),
      currentPrice: Formatter.formatBNB(info.currentPrice),
      priceMultiplier: `${Number(info.priceMultiplier) / 100}x`,
      graduationProgress: Number(info.graduationProgress),
      graduated: info.graduated,
      currentFee: '', // Will be filled by caller
      feeStage: '', // Will be filled by caller
    };
  }
}

/**
 * Validation utilities
 */
export class Validator {
  /**
   * Validate Ethereum address
   */
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Validate amount
   */
  static isValidAmount(amount: string): boolean {
    try {
      const parsed = ethers.parseEther(amount);
      return parsed > 0n;
    } catch {
      return false;
    }
  }

  /**
   * Validate token symbol
   */
  static isValidSymbol(symbol: string): boolean {
    return /^[A-Z0-9]{2,10}$/.test(symbol);
  }

  /**
   * Validate token name
   */
  static isValidName(name: string): boolean {
    return name.length >= 2 && name.length <= 50;
  }

  /**
   * Validate URL
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate private key
   */
  static isValidPrivateKey(key: string): boolean {
    try {
      new ethers.Wallet(key);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Calculation utilities
 */
export class Calculator {
  /**
   * Calculate price impact
   */
  static calculatePriceImpact(
    inputAmount: bigint,
    outputAmount: bigint,
    currentPrice: bigint
  ): number {
    if (outputAmount === 0n || currentPrice === 0n) {
      return 0;
    }

    const avgPrice = (inputAmount * 10n ** 18n) / outputAmount;
    const impact = Number((avgPrice - currentPrice) * 10000n / currentPrice) / 100;

    return impact;
  }

  /**
   * Calculate slippage amount
   */
  static calculateSlippage(
    amount: bigint,
    slippagePercent: number
  ): bigint {
    const slippageBps = BigInt(Math.floor(slippagePercent * 100));
    return (amount * (10000n - slippageBps)) / 10000n;
  }

  /**
   * Calculate percentage
   */
  static calculatePercent(part: bigint, total: bigint): number {
    if (total === 0n) return 0;
    return Number((part * 10000n) / total) / 100;
  }

  /**
   * Calculate vested amount
   */
  static calculateVestedAmount(
    totalAmount: bigint,
    startTime: bigint,
    duration: bigint,
    currentTime?: bigint
  ): bigint {
    const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
    const elapsed = now - startTime;

    if (elapsed <= 0n) {
      return 0n;
    }

    if (elapsed >= duration) {
      return totalAmount;
    }

    return (totalAmount * elapsed) / duration;
  }

  /**
   * Calculate APY from fees
   */
  static calculateAPY(
    totalFees: bigint,
    lockedValue: bigint,
    lockDuration: number
  ): number {
    if (lockedValue === 0n) return 0;

    const feesNum = Number(ethers.formatEther(totalFees));
    const valueNum = Number(ethers.formatEther(lockedValue));
    const yearFraction = lockDuration / (365 * 24 * 60 * 60);

    return (feesNum / valueNum / yearFraction) * 100;
  }
}

/**
 * Time utilities
 */
export class TimeHelper {
  /**
   * Get current timestamp
   */
  static now(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Convert days to seconds
   */
  static daysToSeconds(days: number): number {
    return days * 24 * 60 * 60;
  }

  /**
   * Convert seconds to days
   */
  static secondsToDays(seconds: number): number {
    return seconds / (24 * 60 * 60);
  }

  /**
   * Check if deadline has passed
   */
  static hasDeadlinePassed(deadline: bigint | number): boolean {
    const deadlineNum = typeof deadline === 'bigint' ? Number(deadline) : deadline;
    return TimeHelper.now() > deadlineNum;
  }

  /**
   * Get time remaining
   */
  static getTimeRemaining(deadline: bigint | number): number {
    const deadlineNum = typeof deadline === 'bigint' ? Number(deadline) : deadline;
    const remaining = deadlineNum - TimeHelper.now();
    return Math.max(remaining, 0);
  }

  /**
   * Sleep (for testing/delays)
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Gas utilities
 */
export class GasHelper {
  /**
   * Estimate gas cost in BNB (BSC native token)
   */
  static estimateCostBNB(gasLimit: bigint, gasPrice: bigint): string {
    const cost = gasLimit * gasPrice;
    return ethers.formatEther(cost);
  }

  /**
   * Convert gwei to wei
   */
  static gweiToWei(gwei: string): bigint {
    return ethers.parseUnits(gwei, 'gwei');
  }

  /**
   * Convert wei to gwei
   */
  static weiToGwei(wei: bigint): string {
    return ethers.formatUnits(wei, 'gwei');
  }

  /**
   * Add gas buffer (increase by percentage)
   */
  static addBuffer(gasLimit: bigint, bufferPercent: number = 10): bigint {
    const buffer = (gasLimit * BigInt(bufferPercent)) / 100n;
    return gasLimit + buffer;
  }
}

/**
 * Event utilities
 */
export class EventHelper {
  /**
   * Parse event logs
   */
  static parseEventLog(log: ethers.Log, contract: ethers.Contract): any {
    try {
      return contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
    } catch {
      return null;
    }
  }

  /**
   * Filter events by name
   */
  static filterEventsByName(events: any[], eventName: string): any[] {
    return events.filter((e) => e.name === eventName);
  }

  /**
   * Get event argument
   */
  static getEventArg(event: any, argName: string): any {
    return event.args?.[argName];
  }
}

/**
 * Token utilities
 */
export class TokenHelper {
  /**
   * Get token contract instance
   */
  static getTokenContract(
    address: string,
    provider: ethers.Provider
  ): ethers.Contract {
    return new ethers.Contract(
      address,
      [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)',
        'function transfer(address, uint256) returns (bool)',
        'function approve(address, uint256) returns (bool)',
        'function allowance(address, address) view returns (uint256)',
      ],
      provider
    );
  }

  /**
   * Get token balance
   */
  static async getBalance(
    tokenAddress: string,
    userAddress: string,
    provider: ethers.Provider
  ): Promise<bigint> {
    const contract = TokenHelper.getTokenContract(tokenAddress, provider);
    return await contract.balanceOf(userAddress);
  }

  /**
   * Get token allowance
   */
  static async getAllowance(
    tokenAddress: string,
    owner: string,
    spender: string,
    provider: ethers.Provider
  ): Promise<bigint> {
    const contract = TokenHelper.getTokenContract(tokenAddress, provider);
    return await contract.allowance(owner, spender);
  }

  /**
   * Check if approval needed
   */
  static async needsApproval(
    tokenAddress: string,
    owner: string,
    spender: string,
    amount: bigint,
    provider: ethers.Provider
  ): Promise<boolean> {
    const allowance = await TokenHelper.getAllowance(
      tokenAddress,
      owner,
      spender,
      provider
    );
    return allowance < amount;
  }
}

/**
 * URL utilities
 */
export class URLHelper {
  /**
   * Build explorer URL
   */
  static getExplorerURL(
    baseURL: string,
    type: 'address' | 'tx' | 'token' | 'block',
    value: string
  ): string {
    return `${baseURL}/${type}/${value}`;
  }

  /**
   * Parse transaction hash from URL
   */
  static parseTxHash(url: string): string | null {
    const match = url.match(/tx\/(0x[a-fA-F0-9]{64})/);
    return match ? match[1] : null;
  }

  /**
   * Parse address from URL
   */
  static parseAddress(url: string): string | null {
    const match = url.match(/address\/(0x[a-fA-F0-9]{40})/);
    return match ? match[1] : null;
  }
}

// Re-export all utilities
export const utils = {
  Formatter,
  Validator,
  Calculator,
  TimeHelper,
  GasHelper,
  EventHelper,
  TokenHelper,
  URLHelper,
};

export default utils;