// src/abis/index.ts

/**
 * Contract ABIs
 *
 * These are minimal ABIs containing only the functions used by the SDK.
 * For full ABIs, import from your compiled contracts.
 *
 * ✅ UPDATED: Removed projectInfoFiWallet parameters and updated signatures
 * ✅ UPDATED: BondingCurveDEX no longer has LaunchType (INSTANT_LAUNCH only)
 * ✅ UPDATED: Added missing functions from LaunchpadManagerV3 contract
 */

export const LaunchpadManagerABI = [
  // Create functions - ✅ UPDATED: Removed address parameter for projectInfoFiWallet
  'function createLaunch(string,string,uint256,uint256,uint256,uint256,tuple(string,string,string,string,string,string,string),bool) returns (address)',
  'function createLaunchWithVanity(string,string,uint256,uint256,uint256,uint256,tuple(string,string,string,string,string,string,string),bytes32,bool) returns (address)',
  'function createInstantLaunch(string,string,uint256,tuple(string,string,string,string,string,string,string),uint256,bool) payable returns (address)',
  'function createInstantLaunchWithVanity(string,string,uint256,tuple(string,string,string,string,string,string,string),uint256,bytes32,bool) payable returns (address)',

  // Core functions
  'function contribute(address) payable',
  'function claimFounderTokens(address)',
  'function claimRaisedFunds(address)',
  'function graduateToPancakeSwap(address)',
  'function launchVesting(address) view returns (uint256 startMarketCap, uint256 vestingDuration, uint256 vestingStartTime, uint256 founderTokens, uint256 founderTokensClaimed)',

  // ✅ NEW: Critical functions for Project Raise flow (FIX #2, #3, #6)
  'function claimContributorTokens(address)',
  'function claimRefund(address)',
  'function burnFailedRaiseTokens(address)',

  // View functions - ✅ UPDATED: Removed projectInfoFiWallet from return values
  'function getLaunchInfo(address) view returns (address,uint256,uint256,uint256,uint256,bool,bool,uint256,uint256,uint8,bool)',
  'function getLaunchInfoWithUSD(address) view returns (address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,uint8,bool)',
  'function getClaimableAmounts(address) view returns (uint256,uint256)',
  'function getContribution(address,address) view returns (uint256,bool)',
  'function getAllLaunches() view returns (address[])',

  // Admin functions
  'function updateInfoFiAddress(address)',
  'function handlePostGraduationSell(address token, uint256 tokenAmount,uint256 minBNBOut)',
  'function handlePostGraduationBuy(address token, uint256 minTokensOut) payable',

  // ✅ NEW: Additional admin functions
  'function updateFallbackPrice(uint256)',
  'function updateLPFeeHarvester(address)',
  'function emergencyWithdraw(address)',

  // ✅ NEW: Vesting and Community Control Functions
  'function claimVestedTokens(address)',
  'function updateMarketCap(address)',
  'function transferFundsToTimelock(address)',
  'function burnVestedTokensOnCommunityControl(address)',
  'function updateTimelockBeneficiary(address, address)',
  'function getCommunityControlInfo(address) view returns (bool, uint256, uint256, uint256, uint256, uint256)',
  'function getClaimableVestedTokens(address) view returns (uint256)',
  'function getMarketCapHistory(address) view returns (uint256[])',

  // Events - ✅ UPDATED: Removed projectInfoFiWallet parameter
  'event LaunchCreated(address indexed,address indexed,uint256,uint8,uint256,uint256,uint256,bool,bool)',
  'event InstantLaunchCreated(address indexed,address indexed,uint256,uint256,uint256,bool)',
  'event ContributionMade(address indexed,address indexed,uint256)',
  'event RaiseCompleted(address indexed,uint256)',
  'event GraduatedToPancakeSwap(address indexed,uint256,uint256)',
  'event FounderTokensClaimed(address indexed,address indexed,uint256)',
  'event RaisedFundsClaimed(address indexed,address indexed,uint256)',
  'event RaisedFundsSentToInfoFi(address indexed,uint256)',
  'event TokensBurned(address indexed,uint256)',
  'event LPBurned(address indexed,address indexed,uint256)',
  'event LPLocked(address indexed,address indexed,uint256)',
  'event TransfersEnabled(address indexed,uint256)',
  'event InfoFiAddressUpdated(address indexed)',

  // ✅ NEW: Critical events for Project Raise flow
  'event ContributorTokensClaimed(address indexed,address indexed,uint256)',
  'event RefundClaimed(address indexed,address indexed,uint256)',
  'event RaiseFailed(address indexed,uint256)',
  'event PlatformFeePaid(address indexed,uint256,string)',

  // ✅ NEW: Additional events
  'event PostGraduationSell(address indexed,address indexed,uint256,uint256,uint256,uint256)',
  'event PostGraduationBuy(address indexed,address indexed,uint256,uint256,uint256)',
  'event LPTokensHandled(address indexed,address indexed,uint256,bool)',
  'event PriceFeedUpdated(address indexed)',
  'event FallbackPriceUpdated(uint256)',
  'event OracleModeChanged(bool)',

  // ✅ NEW: Community Control Events
  'event VestedTokensBurnedByCommunityControl(address indexed, uint256)',
  'event CommunityControlTriggered(address indexed, uint256, uint256, uint256)',
];

/**
 * BondingCurveDEX ABI - INSTANT_LAUNCH Only
 * ✅ UPDATED: Removed LaunchType parameters - all pools are INSTANT_LAUNCH
 */
export const BondingCurveDEXABI = [
  // Pool creation (only INSTANT_LAUNCH)
  'function createInstantLaunchPool(address,uint256,address,bool) payable',

  // Trading functions
  'function buyTokens(address,uint256) payable',
  'function sellTokens(address,uint256,uint256)',

  // Pool management
  'function withdrawGraduatedPool(address) returns (uint256,uint256,uint256,address)',
  'function setLPToken(address)',
  'function graduatePool(address)',

  // View functions
  'function getBuyQuote(address,uint256) view returns (uint256,uint256)',
  'function getSellQuote(address,uint256) view returns (uint256,uint256)',
  'function getPoolInfo(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool)',
  'function getCurrentFeeRate(address) view returns (uint256)',
  'function getFeeInfo(address) view returns (uint256,uint256,uint256,uint256,string)',
  'function getCreatorFeeInfo(address) view returns (uint256,uint256,uint256,uint256,uint256,bool)',
  'function getPostGraduationStats(address) view returns (uint256,uint256,uint256)',
  'function getActiveTokens() view returns (address[])',
  'function getPoolDebugInfo(address) view returns (uint256,uint256,uint256,uint256)',

  // Claim functions
  'function claimCreatorFees(address)',

  // Events - ✅ UPDATED: Removed LaunchType parameter from PoolCreated
  'event PoolCreated(address indexed,uint256,uint256,uint256,address indexed,uint256,uint256,uint256)',
  'event TokensBought(address indexed,address indexed,uint256,uint256,uint256,uint256)',
  'event TokensSold(address indexed,address indexed,uint256,uint256,uint256,uint256)',
  'event PoolGraduated(address indexed,uint256,uint256,uint256,uint256)',
  'event CreatorFeesClaimed(address indexed,address indexed,uint256)',
  'event CreatorFeesRedirectedToInfoFi(address indexed,uint256)',
  'event PostGraduationSell(address indexed,address indexed,uint256,uint256,uint256,uint256)',
  'event LPTokensHandled(address indexed,address indexed,uint256,bool)',
  'event FeesCollected(address indexed,uint256,uint256,uint256)',
  'event LiquidityIncreased(address indexed,uint256)',
  'event Paused(address indexed)',
  'event Unpaused(address indexed)',
];

export const TokenFactoryABI = [
  'function getTotalTokens() view returns (uint256)',
  'function getTokenAtIndex(uint256) view returns (address)',
  'function getCreatorTokens(address) view returns (address[])',
  'function computeAddress(string,string,uint256,uint8,address,tuple(string,string,string,string,string,string,string),bytes32) view returns (address)',
];

export const PriceOracleABI = [
  'function getBNBPrice() view returns (uint256)', // Returns BNB price in USD
  'function usdToBNB(uint256) view returns (uint256)', // Converts USD to BNB
  'function bnbToUSD(uint256) view returns (uint256)', // Converts BNB to USD
  'function priceFeed() view returns (address)',
];

export const LPFeeHarvesterABI = [
  'function getLockInfo(address) view returns (address,address,address,uint256,uint256,uint256,uint256,bool,uint256,uint256,uint256,uint256,uint256)',
  'function getHarvestHistory(address) view returns (tuple(uint256,uint256,uint256,uint256,uint256)[])',
  'function getPlatformStats() view returns (uint256,uint256,uint256,uint256)',
  'function canHarvest(address) view returns (bool,uint256)',
  'function harvestFees(address)',
  'function unlockLP(address)',
  'function extendLock(address,uint256)',
  'function getAllLockedProjects() view returns (address[])',
  'function getActiveLocksCount() view returns (uint256)',
  'function getLPValue(address) view returns (uint256,uint256,address,address)',

  'event FeesHarvested(address indexed,uint256,uint256,uint256,uint256,uint256)',
  'event FeesDistributed(address indexed,address indexed,uint256,uint256,uint256)',
  'event LPUnlocked(address indexed,address indexed,uint256,uint256)',
  'event LockExtended(address indexed,uint256,uint256)',
  'event LPLocked(address indexed,address indexed,address indexed,address,uint256,uint256)',
];
