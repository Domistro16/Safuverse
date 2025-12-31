// src/contracts/LaunchpadManager.ts
import { ethers } from 'ethers';
import { BaseContract } from './BaseContract';
import {
  CreateLaunchParams,
  CreateInstantLaunchParams,
  LaunchInfo,
  LaunchInfoWithUSD,
  ClaimableAmounts,
  ContributionInfo,
  TxResult,
  TxOptions,
  EventFilterOptions,
  FounderInfo,
  TeamMember,
  LaunchTeamInfo,
} from '../types';
import { CONSTANTS, GAS_LIMITS } from '../constants';
import { LaunchpadManagerABI } from '../abis';

/**
 * Launch vesting information
 */
export interface LaunchVesting {
  startMarketCap: bigint;
  vestingDuration: bigint;
  vestingStartTime: bigint;
  founderTokens: bigint;
  founderTokensClaimed: bigint;
}

/**
 * LaunchpadManager contract wrapper (LaunchpadManagerV3 - BNBad)
 *
 * Supports two launch types:
 * 1. PROJECT_RAISE: Contribution-based fundraising (72-hour / 3-day raise period)
 *    - Users contribute BNB (BNBad native token) during raise period
 *    - Tokens distributed proportionally after raise completes
 *    - Does NOT use BondingCurveDEX
 *    - Graduates directly to PancakeSwap after successful raise
 *    - Token allocation: 60% founder (immediate), 20% contributors, 10% liquidity, 10% vested (community control)
 *
 * 2. INSTANT_LAUNCH: Bonding curve trading (via BondingCurveDEX)
 *    - Creates pool in BondingCurveDEX for immediate trading
 *    - Uses bonding curve AMM formula
 *    - Graduates to PancakeSwap at market cap threshold
 *
 * ✅ BNBad Migration: All amounts use BNB (BNBad) instead of BNB
 * ✅ Community Control: 10% tokens vest over time, with community control trigger if market cap stays low
 */
export class LaunchpadManager extends BaseContract {
  constructor(
    address: string,
    provider: ethers.Provider,
    signer?: ethers.Signer,
    eventQueryProvider?: ethers.Provider,
    graph?: any // SafuPadGraph type imported in BaseContract
  ) {
    super(address, LaunchpadManagerABI, provider, signer, eventQueryProvider, graph);
  }

  /**
   * Create a new PROJECT_RAISE launch
   *
   * PROJECT_RAISE launches:
   * - 72-hour (3-day) contribution period
   * - Tokens distributed after raise completes
   * - Does NOT use BondingCurveDEX
   * - Token allocation: 60% founder (immediate), 20% contributors, 10% PancakeSwap liquidity, 10% vested (community control)
   * - 20% of raised BNB goes to liquidity
   * - Vesting duration is fixed at 180 days (contract overrides parameter)
   *
   * ✅ Uses BNB (BNBad) for all amounts
   * ✅ Includes team information (founder + up to 2 team members)
   * ⚠️  NOTE: vanitySalt parameter is ignored - vanity addresses not supported in current contract version
   */
  async createLaunch(params: CreateLaunchParams, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();

    // Validate params
    this.validateLaunchParams(params);

    // ✅ Parse BNB amounts (BNBad native token)
    const raiseTargetBNB = ethers.parseEther(params.raiseTargetBNB);
    const raiseMaxBNB = ethers.parseEther(params.raiseMaxBNB);
    const vestingDuration = params.vestingDuration * 24 * 60 * 60; // days to seconds

    // Prepare metadata
    const metadata = [
      params.metadata.logoURI,
      params.metadata.description,
      params.metadata.website,
      params.metadata.twitter,
      params.metadata.telegram,
      params.metadata.discord,
    ];

    // Prepare team info struct for contract
    const teamInfo = [
      // FounderInfo
      [
        params.teamInfo.founder.name,
        params.teamInfo.founder.walletAddress,
        params.teamInfo.founder.bio,
      ],
      // TeamMember1
      [
        params.teamInfo.teamMember1.name,
        params.teamInfo.teamMember1.role,
        params.teamInfo.teamMember1.twitter,
        params.teamInfo.teamMember1.linkedin,
      ],
      // TeamMember2
      [
        params.teamInfo.teamMember2.name,
        params.teamInfo.teamMember2.role,
        params.teamInfo.teamMember2.twitter,
        params.teamInfo.teamMember2.linkedin,
      ],
      // teamMemberCount
      params.teamInfo.teamMemberCount,
    ];

    // ⚠️  Vanity salt is ignored - contract doesn't support createLaunchWithVanity
    // Only createLaunch() function exists in current contract version
    const tx: ethers.ContractTransactionResponse = await this.contract.createLaunch(
      params.name,
      params.symbol,
      params.totalSupply,
      raiseTargetBNB,
      raiseMaxBNB,
      vestingDuration,
      metadata,
      params.burnLP,
      teamInfo,
      this.buildTxOptions(options, GAS_LIMITS.CREATE_LAUNCH)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Create a new INSTANT_LAUNCH
   *
   * INSTANT_LAUNCH:
   * - Creates pool in BondingCurveDEX immediately
   * - Bonding curve trading with dynamic fees
   * - Graduates to PancakeSwap at market cap threshold
   * - Must send BNB with transaction for initial buy
   *
   * ✅ Uses BNB (BNBad) for all amounts
   * ⚠️  NOTE: vanitySalt parameter is ignored - vanity addresses not supported in current contract version
   */
  async createInstantLaunch(
    params: CreateInstantLaunchParams,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();

    // Validate params
    if (params.totalSupply !== 1000000000) {
      throw new Error('Total supply must be 1 billion for instant launch');
    }

    // Convert initial buy amount (BNB)
    const initialBuyBNB = ethers.parseEther(params.initialBuyBNB);

    // Prepare metadata
    const metadata = [
      params.metadata.logoURI,
      params.metadata.description,
      params.metadata.website,
      params.metadata.twitter,
      params.metadata.telegram,
      params.metadata.discord,
    ];

    // Must send BNB with transaction
    const txOptions = this.buildTxOptions(options, GAS_LIMITS.CREATE_INSTANT_LAUNCH);
    txOptions.value = initialBuyBNB;

    // ⚠️  Vanity salt is ignored - contract doesn't support createInstantLaunchWithVanity
    // Only createInstantLaunch() function exists in current contract version
    const tx: ethers.ContractTransactionResponse = await this.contract.createInstantLaunch(
      params.name,
      params.symbol,
      params.totalSupply,
      metadata,
      initialBuyBNB,
      params.burnLP,
      txOptions
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Contribute BNB to a PROJECT_RAISE launch
   *
   * Note: Only works for PROJECT_RAISE tokens (not INSTANT_LAUNCH)
   * INSTANT_LAUNCH tokens trade on bonding curve instead via BondingCurveDEX
   *
   * ✅ Uses BNB (BNBad) for contribution
   */
  async contribute(
    tokenAddress: string,
    BNBAmount: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const amount = ethers.parseEther(BNBAmount);
    const txOptions = this.buildTxOptions(options, GAS_LIMITS.CONTRIBUTE);
    txOptions.value = amount;

    const tx = await this.contract.contribute(tokenAddress, txOptions);

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Claim founder tokens
   *
   * For PROJECT_RAISE: Founder gets 60% of tokens immediately (no vesting)
   * Works for both PROJECT_RAISE and INSTANT_LAUNCH
   */
  async claimFounderTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.claimFounderTokens(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.CLAIM_FOUNDER_TOKENS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Claim raised funds (BNB from raise, 80% available immediately)
   *
   * Note: Only for PROJECT_RAISE tokens
   * INSTANT_LAUNCH tokens don't have raised funds to claim
   */
  async claimRaisedFunds(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.claimRaisedFunds(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.CLAIM_RAISED_FUNDS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Graduate pool to PancakeSwap
   *
   * For PROJECT_RAISE:
   * - Adds liquidity to PancakeSwap with 20% of raised BNB
   * - Uses 10% of tokens reserved for PancakeSwap liquidity
   *
   * For INSTANT_LAUNCH:
   * - Withdraws graduated pool from BondingCurveDEX
   * - Adds liquidity with BNB + 20% of tokens
   */
  async graduateToPancakeSwap(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.graduateToPancakeSwap(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.GRADUATE_TO_PANCAKESWAP)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Handle post-graduation selling for PROJECT_RAISE tokens
   *
   * Allows users to sell their tokens after a PROJECT_RAISE has graduated to PancakeSwap.
   * The function:
   * - Takes 1% platform fee on tokens
   * - Swaps half the tokens for BNB
   * - Adds the other half + BNB back to liquidity pool
   * - Burns the LP tokens
   * - Pays seller 70% of the BNB from swap
   * - Remaining 30% goes back to liquidity
   *
   * Note: Only works for PROJECT_RAISE tokens that have graduated
   *
   * @param tokenAddress Address of the PROJECT_RAISE token
   * @param tokenAmount Amount of tokens to sell (in wei)
   * @param minBNBOut Minimum BNB to receive (slippage protection)
   */
  async handlePostGraduationSell(
    tokenAddress: string,
    tokenAmount: string,
    minBNBOut: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const amount = ethers.parseEther(tokenAmount);
    const minOut = ethers.parseEther(minBNBOut);

    const tx = await this.contract.handlePostGraduationSell(
      tokenAddress,
      amount,
      minOut,
      this.buildTxOptions(options, GAS_LIMITS.CONTRIBUTE) // Similar gas to contribute
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Handle post-graduation buying for PROJECT_RAISE tokens
   *
   * Allows users to buy tokens after a PROJECT_RAISE has graduated to PancakeSwap.
   * The function:
   * - Takes 1% platform fee on BNB
   * - Swaps remaining BNB for tokens via PancakeSwap
   * - Sends tokens directly to buyer
   *
   * Note: Only works for PROJECT_RAISE tokens that have graduated
   *
   * @param tokenAddress Address of the PROJECT_RAISE token
   * @param BNBAmount Amount of BNB to spend (in ether string)
   * @param minTokensOut Minimum tokens to receive (slippage protection, in ether string)
   * @param options Transaction options
   */
  async handlePostGraduationBuy(
    tokenAddress: string,
    BNBAmount: string,
    minTokensOut: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const amount = ethers.parseEther(BNBAmount);
    const minOut = ethers.parseEther(minTokensOut);

    const txOptions = this.buildTxOptions(options, GAS_LIMITS.CONTRIBUTE); // Similar gas to contribute
    txOptions.value = amount; // Must send BNB with transaction

    const tx = await this.contract.handlePostGraduationBuy(
      tokenAddress,
      minOut,
      txOptions
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Get launch information
   * ✅ UPDATED: No longer returns projectInfoFiWallet
   */
  async getLaunchInfo(tokenAddress: string): Promise<LaunchInfo> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getLaunchInfo(tokenAddress);

    return {
      founder: info[0],
      raiseTarget: info[1],
      raiseMax: info[2],
      totalRaised: info[3],
      raiseDeadline: info[4],
      raiseCompleted: info[5],
      graduatedToPancakeSwap: info[6],
      raisedFundsVesting: info[7],
      raisedFundsClaimed: info[8],
      launchType: info[9], // 0 = PROJECT_RAISE, 1 = INSTANT_LAUNCH
      burnLP: info[10],
    };
  }

  /**
   * Get launch information with USD values
   * ✅ UPDATED: Returns BNB amounts (BNBad native token) + USD equivalents
   */
  async getLaunchInfoWithUSD(tokenAddress: string): Promise<LaunchInfoWithUSD> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getLaunchInfoWithUSD(tokenAddress);

    return {
      founder: info[0],
      raiseTargetBNB: info[1],
      raiseTargetUSD: info[2],
      raiseMaxBNB: info[3],
      raiseMaxUSD: info[4],
      totalRaisedBNB: info[5],
      totalRaisedUSD: info[6],
      raiseDeadline: info[7],
      raiseCompleted: info[8],
      launchType: info[9], // 0 = PROJECT_RAISE, 1 = INSTANT_LAUNCH
      burnLP: info[10],
    };
  }

  /**
   * Get claimable amounts for founder
   */
  async getClaimableAmounts(tokenAddress: string): Promise<ClaimableAmounts> {
    this.validateAddress(tokenAddress);

    const amounts = await this.contract.getClaimableAmounts(tokenAddress);

    return {
      claimableTokens: amounts[0],
      claimableFunds: amounts[1],
    };
  }

  /**
   * Get launch vesting information
   * Returns details about the vesting schedule for founder tokens
   */
  async getLaunchVesting(tokenAddress: string): Promise<LaunchVesting> {
    this.validateAddress(tokenAddress);

    const vesting = await this.contract.launchVesting(tokenAddress);

    return {
      startMarketCap: vesting.startMarketCap,
      vestingDuration: vesting.vestingDuration,
      vestingStartTime: vesting.vestingStartTime,
      founderTokens: vesting.founderTokens,
      founderTokensClaimed: vesting.founderTokensClaimed,
    };
  }

  /**
   * Get vesting progress percentage (0-100)
   */
  async getVestingProgress(tokenAddress: string): Promise<number> {
    const vesting = await this.getLaunchVesting(tokenAddress);

    if (vesting.founderTokens === 0n) {
      return 0;
    }

    const progress = Number((vesting.founderTokensClaimed * 10000n) / vesting.founderTokens) / 100;
    return Math.min(progress, 100);
  }

  /**
   * Get time-based vesting progress (0-100)
   * Based on how much time has passed in the vesting period
   */
  async getTimeBasedVestingProgress(tokenAddress: string): Promise<number> {
    const vesting = await this.getLaunchVesting(tokenAddress);

    if (vesting.vestingDuration === 0n) {
      return 100;
    }

    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const vestingStartTime = vesting.vestingStartTime;
    const vestingEndTime = vestingStartTime + vesting.vestingDuration;

    if (currentTime >= vestingEndTime) {
      return 100;
    }

    if (currentTime <= vestingStartTime) {
      return 0;
    }

    const elapsed = currentTime - vestingStartTime;
    const progress = Number((elapsed * 10000n) / vesting.vestingDuration) / 100;
    return Math.min(progress, 100);
  }

  /**
   * Get remaining vesting time in seconds
   */
  async getRemainingVestingTime(tokenAddress: string): Promise<number> {
    const vesting = await this.getLaunchVesting(tokenAddress);

    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const vestingEndTime = vesting.vestingStartTime + vesting.vestingDuration;

    if (currentTime >= vestingEndTime) {
      return 0;
    }

    return Number(vestingEndTime - currentTime);
  }

  /**
   * Get contribution info for an address
   *
   * Note: Only relevant for PROJECT_RAISE tokens
   */
  async getContribution(tokenAddress: string, contributor: string): Promise<ContributionInfo> {
    this.validateAddress(tokenAddress);
    this.validateAddress(contributor);

    const info = await this.contract.getContribution(tokenAddress, contributor);

    return {
      amount: info[0],
      claimed: info[1],
    };
  }

  /**
   * Get all launches (both PROJECT_RAISE and INSTANT_LAUNCH)
   */
  async getAllLaunches(): Promise<string[]> {
    return await this.contract.getAllLaunches();
  }

  /**
   * Check if address is a valid launch
   */
  async isValidLaunch(tokenAddress: string): Promise<boolean> {
    try {
      const info = await this.getLaunchInfo(tokenAddress);
      return info.founder !== ethers.ZeroAddress;
    } catch {
      return false;
    }
  }

  /**
   * Get launch progress percentage
   *
   * Note: Only meaningful for PROJECT_RAISE tokens
   * For INSTANT_LAUNCH, check BondingCurveDEX graduation progress instead
   */
  async getLaunchProgress(tokenAddress: string): Promise<number> {
    const info = await this.getLaunchInfo(tokenAddress);

    if (info.raiseTarget === 0n) {
      return 100;
    }

    const progress = Number((info.totalRaised * 10000n) / info.raiseTarget) / 100;
    return Math.min(progress, 100);
  }

  /**
   * Check if launch deadline has passed
   *
   * Note: Only relevant for PROJECT_RAISE tokens (72-hour / 3-day deadline)
   * INSTANT_LAUNCH tokens have no deadline
   */
  async hasLaunchDeadlinePassed(tokenAddress: string): Promise<boolean> {
    const info = await this.getLaunchInfo(tokenAddress);
    const currentTime = Math.floor(Date.now() / 1000);
    return Number(info.raiseDeadline) < currentTime;
  }

  /**
   * Get time remaining until deadline
   *
   * Note: Only relevant for PROJECT_RAISE tokens
   * Returns 0 for INSTANT_LAUNCH tokens
   */
  async getTimeUntilDeadline(tokenAddress: string): Promise<number> {
    const info = await this.getLaunchInfo(tokenAddress);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = Number(info.raiseDeadline) - currentTime;
    return Math.max(timeRemaining, 0);
  }

  /**
   * Listen to LaunchCreated events (PROJECT_RAISE)
   */
  onLaunchCreated(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('LaunchCreated', callback, filter);
  }

  /**
   * Listen to InstantLaunchCreated events (INSTANT_LAUNCH)
   */
  onInstantLaunchCreated(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('InstantLaunchCreated', callback, filter);
  }

  /**
   * Listen to ContributionMade events (PROJECT_RAISE only)
   */
  onContributionMade(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('ContributionMade', callback, filter);
  }

  /**
   * Listen to RaiseCompleted events (PROJECT_RAISE only)
   */
  onRaiseCompleted(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('RaiseCompleted', callback, filter);
  }

  /**
   * Listen to GraduatedToPancakeSwap events (both launch types)
   */
  onGraduatedToPancakeSwap(
    callback: (event: any) => void,
    filter?: EventFilterOptions
  ): () => void {
    return this.addEventListener('GraduatedToPancakeSwap', callback, filter);
  }

  /**
   * ✅ NEW: Claim contributor tokens after successful PROJECT_RAISE
   *
   * After a successful PROJECT_RAISE, contributors can claim their proportional
   * share of tokens from the 70% contributor allocation.
   *
   * Note: Only works for PROJECT_RAISE tokens after successful raise
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async claimContributorTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.claimContributorTokens(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.CLAIM_CONTRIBUTOR_TOKENS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Claim refund after failed PROJECT_RAISE
   *
   * If a PROJECT_RAISE fails to meet its target after the 72-hour (3-day) deadline,
   * contributors can claim their BNB refunds.
   *
   * Note: Only works for PROJECT_RAISE tokens that failed to meet target
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async claimRefund(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.claimRefund(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.CLAIM_REFUND)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Burn tokens from failed PROJECT_RAISE
   *
   * Burns all tokens if a PROJECT_RAISE fails to meet its target.
   * Can be called by anyone after the deadline passes.
   *
   * Note: This is a cleanup function that can be called by anyone
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async burnFailedRaiseTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.burnFailedRaiseTokens(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.BURN_FAILED_RAISE_TOKENS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Update fallback BNB price (admin only, BNBad native token)
   *
   * Updates the fallback price used when the oracle fails.
   * Only callable by contract owner.
   *
   * @param price - New fallback price (in 8 decimals format, e.g., "120000000000" for $1200)
   * @param options - Transaction options
   */
  async updateFallbackPrice(price: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();

    const tx = await this.contract.updateFallbackPrice(
      price,
      this.buildTxOptions(options, GAS_LIMITS.UPDATE_FALLBACK_PRICE)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Update LP fee harvester address (admin only)
   *
   * Updates the LP fee harvester contract address.
   * Only callable by contract owner.
   *
   * @param lpFeeHarvesterAddress - New LP fee harvester contract address
   * @param options - Transaction options
   */
  async updateLPFeeHarvester(
    lpFeeHarvesterAddress: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(lpFeeHarvesterAddress);

    const tx = await this.contract.updateLPFeeHarvester(
      lpFeeHarvesterAddress,
      this.buildTxOptions(options, GAS_LIMITS.UPDATE_LP_FEE_HARVESTER)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Emergency withdraw tokens (admin only)
   *
   * Emergency function to withdraw tokens from failed PROJECT_RAISE.
   * Only callable by contract owner after deadline if raise failed.
   *
   * @param tokenAddress - Address of the token to withdraw
   * @param options - Transaction options
   */
  async emergencyWithdraw(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.emergencyWithdraw(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.EMERGENCY_WITHDRAW)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Check if contributor can claim tokens
   *
   * Helper method to check if a contributor is eligible to claim their tokens
   */
  async canClaimContributorTokens(
    tokenAddress: string,
    contributorAddress: string
  ): Promise<boolean> {
    try {
      const info = await this.getLaunchInfo(tokenAddress);
      const contribution = await this.getContribution(tokenAddress, contributorAddress);

      return (
        info.launchType === 1 && // PROJECT_RAISE
        info.raiseCompleted &&
        info.totalRaised >= info.raiseTarget &&
        contribution.amount > 0n &&
        !contribution.claimed
      );
    } catch {
      return false;
    }
  }

  /**
   * ✅ NEW: Check if contributor can claim refund
   *
   * Helper method to check if a contributor is eligible to claim a refund
   */
  async canClaimRefund(tokenAddress: string, contributorAddress: string): Promise<boolean> {
    try {
      const info = await this.getLaunchInfo(tokenAddress);
      const contribution = await this.getContribution(tokenAddress, contributorAddress);
      const currentTime = Math.floor(Date.now() / 1000);

      return (
        info.launchType === 1 && // PROJECT_RAISE
        currentTime > Number(info.raiseDeadline) &&
        info.totalRaised < info.raiseTarget &&
        !info.raiseCompleted &&
        contribution.amount > 0n &&
        !contribution.claimed
      );
    } catch {
      return false;
    }
  }

  /**
   * ✅ NEW: Get contributor's token allocation
   *
   * Calculate how many tokens a contributor would receive after successful raise
   */
  async getContributorTokenAllocation(
    tokenAddress: string,
    contributorAddress: string
  ): Promise<bigint> {
    const info = await this.getLaunchInfo(tokenAddress);
    const contribution = await this.getContribution(tokenAddress, contributorAddress);

    if (contribution.amount === 0n || info.totalRaised === 0n) {
      return 0n;
    }

    // Get total supply from token contract or use 1 billion default
    const totalSupply = 1_000_000_000n * 10n ** 18n;
    const contributorPool = (totalSupply * 70n) / 100n; // 70% for contributors

    return (contribution.amount * contributorPool) / info.totalRaised;
  }

  /**
   * ✅ NEW: Listen to ContributorTokensClaimed events
   */
  onContributorTokensClaimed(
    callback: (event: any) => void,
    filter?: EventFilterOptions
  ): () => void {
    return this.addEventListener('ContributorTokensClaimed', callback, filter);
  }

  /**
   * ✅ NEW: Listen to RefundClaimed events
   */
  onRefundClaimed(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('RefundClaimed', callback, filter);
  }

  /**
   * ✅ NEW: Listen to RaiseFailed events
   */
  onRaiseFailed(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('RaiseFailed', callback, filter);
  }

  /**
   * ✅ NEW: Listen to PlatformFeePaid events
   */
  onPlatformFeePaid(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('PlatformFeePaid', callback, filter);
  }

  /**
   * ✅ NEW: Listen to PostGraduationBuy events
   */
  onPostGraduationBuy(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('PostGraduationBuy', callback, filter);
  }

  /**
   * ✅ NEW: Listen to VestedTokensBurnedByCommunityControl events
   */
  onVestedTokensBurned(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('VestedTokensBurnedByCommunityControl', callback, filter);
  }

  /**
   * ✅ NEW: Listen to CommunityControlTriggered events
   */
  onCommunityControlTriggered(callback: (event: any) => void, filter?: EventFilterOptions): () => void {
    return this.addEventListener('CommunityControlTriggered', callback, filter);
  }

  // ==================== VESTING & COMMUNITY CONTROL METHODS ====================

  /**
   * ✅ NEW: Claim vested tokens (10% allocation vested over 6 BNBths)
   *
   * Vesting is conditional on token maintaining starting market cap.
   * Tokens ONLY release if current market cap is above starting market cap.
   * If community control triggered, claims are blocked.
   *
   * Note: Only for PROJECT_RAISE tokens after graduation
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async claimVestedTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.claimVestedTokens(
      tokenAddress,
      this.buildTxOptions(options, GAS_LIMITS.CLAIM_FOUNDER_TOKENS)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Update market cap tracking (called BNBthly)
   *
   * Tracks consecutive BNBths below starting market cap.
   * Triggers community control after 3 consecutive BNBths below start.
   *
   * Note: Only for PROJECT_RAISE tokens after graduation
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async updateMarketCap(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.updateMarketCap(
      tokenAddress,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Transfer raised funds to timelock when community control is triggered
   *
   * Only callable when 3 consecutive BNBths below starting market cap.
   * Funds locked for 48 hours for platform team to review community input.
   * Requires owner role.
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async transferFundsToTimelock(tokenAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.transferFundsToTimelock(
      tokenAddress,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Burn remaining vested tokens when community control is triggered
   *
   * Only owner (platform) can call - per governance model.
   * Called after community consultation and decision.
   *
   * @param tokenAddress - Address of the launched token
   * @param options - Transaction options
   */
  async burnVestedTokensOnCommunityControl(
    tokenAddress: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.burnVestedTokensOnCommunityControl(
      tokenAddress,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Update timelock beneficiary based on community decision
   *
   * Only owner can call (platform team).
   * Updates beneficiary address based on community input.
   *
   * @param tokenAddress - Token address
   * @param newBeneficiary - New beneficiary address based on community input
   * @param options - Transaction options
   */
  async updateTimelockBeneficiary(
    tokenAddress: string,
    newBeneficiary: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);
    this.validateAddress(newBeneficiary);

    const tx = await this.contract.updateTimelockBeneficiary(
      tokenAddress,
      newBeneficiary,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Get information about community control status
   *
   * Useful for frontend to display community governance state.
   *
   * @param tokenAddress - Address of the launched token
   * @returns Community control information
   */
  async getCommunityControlInfo(tokenAddress: string): Promise<{
    communityControlActive: boolean;
    consecutiveBNBthsBelowStart: bigint;
    currentMarketCap: bigint;
    startMarketCap: bigint;
    remainingFunds: bigint;
    remainingVestedTokens: bigint;
  }> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getCommunityControlInfo(tokenAddress);

    return {
      communityControlActive: info[0],
      consecutiveBNBthsBelowStart: info[1],
      currentMarketCap: info[2],
      startMarketCap: info[3],
      remainingFunds: info[4],
      remainingVestedTokens: info[5],
    };
  }

  /**
   * ✅ NEW: Get claimable vested tokens amount
   *
   * Returns 0 if community control is active.
   *
   * @param tokenAddress - Address of the launched token
   * @returns Amount of vested tokens that can be claimed
   */
  async getClaimableVestedTokens(tokenAddress: string): Promise<bigint> {
    this.validateAddress(tokenAddress);
    return await this.contract.getClaimableVestedTokens(tokenAddress);
  }

  /**
   * ✅ NEW: Get BNBthly market cap history
   *
   * Useful for frontend to display market cap trends.
   *
   * @param tokenAddress - Address of the launched token
   * @returns Array of BNBthly market cap values
   */
  async getMarketCapHistory(tokenAddress: string): Promise<bigint[]> {
    this.validateAddress(tokenAddress);
    const history = await this.contract.getMarketCapHistory(tokenAddress);
    return history.map((cap: any) => BigInt(cap.toString()));
  }

  /**
   * ✅ NEW: Update InfoFi address (admin only)
   *
   * Updates the global InfoFi fee address.
   * Only callable by contract owner.
   *
   * @param infoFiAddress - New InfoFi address
   * @param options - Transaction options
   */
  async updateInfoFiAddress(infoFiAddress: string, options?: TxOptions): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(infoFiAddress);

    const tx = await this.contract.updateInfoFiAddress(
      infoFiAddress,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  // ==================== TEAM INFO METHODS ====================

  /**
   * ✅ NEW: Get founder information for a launch
   *
   * Returns the founder's name, wallet address, and bio.
   *
   * @param tokenAddress - Address of the launched token
   * @returns Founder information
   */
  async getFounderInfo(tokenAddress: string): Promise<FounderInfo> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getFounderInfo(tokenAddress);

    return {
      name: info[0],
      walletAddress: info[1],
      bio: info[2],
    };
  }

  /**
   * ✅ NEW: Get team members for a launch
   *
   * Returns up to 2 team members with their details.
   *
   * @param tokenAddress - Address of the launched token
   * @returns Team members and count
   */
  async getTeamMembers(tokenAddress: string): Promise<{
    teamMember1: TeamMember;
    teamMember2: TeamMember;
    teamMemberCount: number;
  }> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getTeamMembers(tokenAddress);

    return {
      teamMember1: {
        name: info[0].name,
        role: info[0].role,
        twitter: info[0].twitter,
        linkedin: info[0].linkedin,
      },
      teamMember2: {
        name: info[1].name,
        role: info[1].role,
        twitter: info[1].twitter,
        linkedin: info[1].linkedin,
      },
      teamMemberCount: Number(info[2]),
    };
  }

  /**
   * ✅ NEW: Get complete team info for a launch
   *
   * Returns founder info and all team members.
   *
   * @param tokenAddress - Address of the launched token
   * @returns Complete team information
   */
  async getLaunchTeamInfo(tokenAddress: string): Promise<LaunchTeamInfo> {
    this.validateAddress(tokenAddress);

    const info = await this.contract.getLaunchTeamInfo(tokenAddress);

    return {
      founder: {
        name: info.founder.name,
        walletAddress: info.founder.walletAddress,
        bio: info.founder.bio,
      },
      teamMember1: {
        name: info.teamMember1.name,
        role: info.teamMember1.role,
        twitter: info.teamMember1.twitter,
        linkedin: info.teamMember1.linkedin,
      },
      teamMember2: {
        name: info.teamMember2.name,
        role: info.teamMember2.role,
        twitter: info.teamMember2.twitter,
        linkedin: info.teamMember2.linkedin,
      },
      teamMemberCount: Number(info.teamMemberCount),
    };
  }

  /**
   * ✅ NEW: Update founder info (only founder can update, only before graduation)
   *
   * Allows the founder to update their name and bio before the token graduates.
   *
   * @param tokenAddress - Address of the launched token
   * @param name - New founder name
   * @param bio - New founder bio
   * @param options - Transaction options
   */
  async updateFounderInfo(
    tokenAddress: string,
    name: string,
    bio: string,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    const tx = await this.contract.updateFounderInfo(
      tokenAddress,
      name,
      bio,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * ✅ NEW: Update team members (only founder can update, only before graduation)
   *
   * Allows the founder to update team member information before the token graduates.
   *
   * @param tokenAddress - Address of the launched token
   * @param teamMember1 - First team member info
   * @param teamMember2 - Second team member info
   * @param teamMemberCount - Number of team members (0, 1, or 2)
   * @param options - Transaction options
   */
  async updateTeamMembers(
    tokenAddress: string,
    teamMember1: TeamMember,
    teamMember2: TeamMember,
    teamMemberCount: number,
    options?: TxOptions
  ): Promise<TxResult> {
    this.requireSigner();
    this.validateAddress(tokenAddress);

    if (teamMemberCount > 2) {
      throw new Error('Maximum 2 team members allowed');
    }

    // Prepare team member structs for contract
    const member1 = [
      teamMember1.name,
      teamMember1.role,
      teamMember1.twitter,
      teamMember1.linkedin,
    ];
    const member2 = [
      teamMember2.name,
      teamMember2.role,
      teamMember2.twitter,
      teamMember2.linkedin,
    ];

    const tx = await this.contract.updateTeamMembers(
      tokenAddress,
      member1,
      member2,
      teamMemberCount,
      this.buildTxOptions(options)
    );

    return {
      hash: tx.hash,
      wait: () => tx.wait(),
    };
  }

  /**
   * Validate launch parameters
   * ✅ UPDATED: Validates BNB amounts (BNBad native token)
   * Note: Contract enforces actual validation, this is for client-side UX
   */
  private validateLaunchParams(params: CreateLaunchParams): void {
    const minRaiseBNB = parseFloat(CONSTANTS.MIN_RAISE_BNB); // 5M BNB
    const maxRaiseBNB = parseFloat(CONSTANTS.MAX_RAISE_BNB); // 20M BNB
    const minVesting = CONSTANTS.MIN_VESTING_DURATION / (24 * 60 * 60); // 90 days
    const maxVesting = CONSTANTS.MAX_VESTING_DURATION / (24 * 60 * 60); // 180 days

    const raiseTarget = parseFloat(params.raiseTargetBNB);
    const raiseMax = parseFloat(params.raiseMaxBNB);

    if (raiseTarget < minRaiseBNB || raiseTarget > maxRaiseBNB) {
      throw new Error(`Raise target must be between ${minRaiseBNB.toLocaleString()} and ${maxRaiseBNB.toLocaleString()} BNB`);
    }

    if (raiseMax < raiseTarget || raiseMax > maxRaiseBNB) {
      throw new Error(`Raise max must be between raise target and ${maxRaiseBNB.toLocaleString()} BNB`);
    }

    if (params.vestingDuration < minVesting || params.vestingDuration > maxVesting) {
      throw new Error(`Vesting duration must be between ${minVesting} and ${maxVesting} days (Note: Contract overrides to 180 days)`);
    }
  }
}

