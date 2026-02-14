import { BigInt, BigDecimal, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

// ── Generated types ──────────────────────────────────────────────
import {
  NameRegistered as AgentNameRegistered,
  BatchRegistered,
  AgentWalletDeployed,
  PointsAwarded,
  CommitmentMade,
} from "../generated/AgentRegistrarController/AgentRegistrarController";

import {
  NameRegistered as ETHNameRegistered,
  NameRenewed,
} from "../generated/ETHRegistrarController/ETHRegistrarController";

import { Transfer as DomainTransferEvent } from "../generated/BaseRegistrar/BaseRegistrar";

import {
  NewOwner,
  NewResolver,
  Transfer as RegistryTransferEvent,
} from "../generated/ENSRegistry/ENSRegistry";

import {
  ReferralPaid,
  RenewalReferralPaid,
} from "../generated/ReferralVerifier/ReferralVerifier";

import {
  AuctionCreated,
  BidPlaced,
  AuctionExtended,
  AuctionSettled,
  AuctionCancelled,
} from "../generated/IDDomainAuction/IDDomainAuction";

import {
  PremiumNameAdded,
  PremiumNameRemoved,
} from "../generated/PremiumNameRegistry/PremiumNameRegistry";

import { Transfer as USDCTransfer } from "../generated/USDC/ERC20";
import { UserOperationEvent } from "../generated/EntryPoint/EntryPoint";

import {
  DomainOwner,
  Domain,
  Transaction,
  ScoreSnapshot,
  Referral,
  Auction,
  Bid,
  PremiumName,
  PointsEvent,
  RegistryEvent,
} from "../generated/schema";

import {
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ENTRYPOINT_ADDRESS,
  toUSDCDecimal,
  toETHDecimal,
  calculateReputationScore,
  getOrCreateGlobalStats,
} from "./utils";

// ═════════════════════════════════════════════════════════════════
// ── Helpers ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════

function getOrCreateOwner(
  address: string,
  timestamp: BigInt
): DomainOwner {
  let owner = DomainOwner.load(address);
  if (owner == null) {
    owner = new DomainOwner(address);
    owner.ownerType = "HUMAN";
    owner.totalRegistrations = ZERO_BI;
    owner.totalRenewals = ZERO_BI;
    owner.totalTransactions = ZERO_BI;
    owner.successfulTransactions = ZERO_BI;
    owner.failedTransactions = ZERO_BI;
    owner.totalVolumeUSDC = ZERO_BD;
    owner.totalVolumeETH = ZERO_BD;
    owner.firstTransactionAt = timestamp;
    owner.lastTransactionAt = timestamp;
    owner.uniqueContractsInteracted = ZERO_BI;
    owner.reputationScore = 0;
    owner.lastScoreUpdate = ZERO_BI;
    owner.totalPoints = ZERO_BI;
    owner.referralCount = ZERO_BI;
    owner.referralEarnings = ZERO_BD;
    owner.referredBy = null;
    owner.agentWallet = null;
    owner.interactedContracts = [];

    // Increment global owner count
    let stats = getOrCreateGlobalStats();
    stats.totalOwners = stats.totalOwners.plus(ONE_BI);
    stats.save();
  }
  return owner as DomainOwner;
}

function detectOwnerType(event: ethereum.Event): string {
  let txTo = event.transaction.to;
  if (txTo !== null) {
    let entryPointAddr = Address.fromString(ENTRYPOINT_ADDRESS);
    if (txTo.equals(entryPointAddr)) {
      return "AGENT";
    }
  }
  return "HUMAN";
}

function trackContract(owner: DomainOwner, contractAddr: Bytes): void {
  let contracts = owner.interactedContracts;
  let found = false;
  for (let i = 0; i < contracts.length; i++) {
    if (contracts[i].equals(contractAddr)) {
      found = true;
      break;
    }
  }
  if (!found) {
    contracts.push(contractAddr);
    owner.interactedContracts = contracts;
    owner.uniqueContractsInteracted = BigInt.fromI32(contracts.length);
  }
}

function updateReputationScore(
  owner: DomainOwner,
  currentTimestamp: BigInt
): void {
  owner.reputationScore = calculateReputationScore(
    owner.totalTransactions,
    owner.successfulTransactions,
    owner.firstTransactionAt,
    owner.lastTransactionAt,
    owner.totalVolumeUSDC,
    owner.uniqueContractsInteracted,
    currentTimestamp
  );
  owner.lastScoreUpdate = currentTimestamp;
}

function takeScoreSnapshot(
  owner: DomainOwner,
  timestamp: BigInt
): void {
  let snapshotId = owner.id + "-" + timestamp.toString();
  let snapshot = new ScoreSnapshot(snapshotId);
  snapshot.owner = owner.id;
  snapshot.score = owner.reputationScore;
  snapshot.timestamp = timestamp;
  snapshot.save();
}

function createTransaction(
  txHash: Bytes,
  suffix: string,
  owner: DomainOwner,
  timestamp: BigInt,
  successful: boolean,
  valueUSDC: BigDecimal,
  valueETH: BigDecimal,
  toContract: Bytes,
  gasUsed: BigInt,
  eventType: string,
  userOpHash: Bytes | null
): void {
  let txId = txHash.toHexString() + suffix;
  let tx = new Transaction(txId);
  tx.owner = owner.id;
  tx.timestamp = timestamp;
  tx.successful = successful;
  tx.valueUSDC = valueUSDC;
  tx.valueETH = valueETH;
  tx.toContract = toContract;
  tx.gasUsed = gasUsed;
  tx.eventType = eventType;
  tx.userOpHash = userOpHash;
  tx.save();
}

// ═════════════════════════════════════════════════════════════════
// ── AgentRegistrarController Handlers ───────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleAgentNameRegistered(
  event: AgentNameRegistered
): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  let ownerType = detectOwnerType(event);
  owner.ownerType = ownerType;

  owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
  owner.successfulTransactions =
    owner.successfulTransactions.plus(ONE_BI);
  owner.totalRegistrations = owner.totalRegistrations.plus(ONE_BI);
  owner.lastTransactionAt = event.block.timestamp;

  let costUSDC = toUSDCDecimal(event.params.cost);
  owner.totalVolumeUSDC = owner.totalVolumeUSDC.plus(costUSDC);

  trackContract(owner, event.address);
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  // Create domain entity
  let domainName = event.params.name + ".id";
  let domain = new Domain(domainName);
  domain.labelHash = event.params.label;
  domain.owner = owner.id;
  domain.ownerType = ownerType;
  domain.registeredAt = event.block.timestamp;
  domain.expiresAt = event.params.expires;
  domain.isActive = true;
  domain.cost = costUSDC;
  domain.registrationTx = event.transaction.hash;
  domain.registeredVia = "agent";
  domain.referrer = null;
  domain.resolver = null;
  domain.save();

  // Transaction record
  createTransaction(
    event.transaction.hash,
    "",
    owner,
    event.block.timestamp,
    true,
    costUSDC,
    ZERO_BD,
    event.address,
    event.receipt ? event.receipt!.gasUsed : ZERO_BI,
    "AgentRegistration",
    null
  );

  // Global stats
  let stats = getOrCreateGlobalStats();
  stats.totalDomains = stats.totalDomains.plus(ONE_BI);
  stats.totalVolumeUSDC = stats.totalVolumeUSDC.plus(costUSDC);
  stats.save();

  takeScoreSnapshot(owner, event.block.timestamp);
}

export function handleBatchRegistered(event: BatchRegistered): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  owner.ownerType = "AGENT";

  let count = event.params.count;
  owner.totalTransactions = owner.totalTransactions.plus(count);
  owner.successfulTransactions =
    owner.successfulTransactions.plus(count);
  owner.totalRegistrations = owner.totalRegistrations.plus(count);
  owner.lastTransactionAt = event.block.timestamp;

  let costUSDC = toUSDCDecimal(event.params.totalCost);
  owner.totalVolumeUSDC = owner.totalVolumeUSDC.plus(costUSDC);

  trackContract(owner, event.address);
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  createTransaction(
    event.transaction.hash,
    "-batch",
    owner,
    event.block.timestamp,
    true,
    costUSDC,
    ZERO_BD,
    event.address,
    event.receipt ? event.receipt!.gasUsed : ZERO_BI,
    "BatchRegistration",
    null
  );

  let stats = getOrCreateGlobalStats();
  stats.totalDomains = stats.totalDomains.plus(count);
  stats.totalVolumeUSDC = stats.totalVolumeUSDC.plus(costUSDC);
  stats.save();

  takeScoreSnapshot(owner, event.block.timestamp);
}

export function handleAgentWalletDeployed(
  event: AgentWalletDeployed
): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  owner.ownerType = "AGENT";
  owner.agentWallet = event.params.wallet;
  owner.save();

  // Also create an entry for the deployed wallet itself
  let walletAddr = event.params.wallet.toHexString();
  let walletOwner = getOrCreateOwner(walletAddr, event.block.timestamp);
  walletOwner.ownerType = "AGENT";
  walletOwner.save();
}

export function handlePointsAwarded(event: PointsAwarded): void {
  let userAddr = event.params.user.toHexString();
  let owner = getOrCreateOwner(userAddr, event.block.timestamp);
  owner.totalPoints = event.params.totalUserPoints;
  owner.save();

  let id =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();
  let pe = new PointsEvent(id);
  pe.user = owner.id;
  pe.name = event.params.name;
  pe.points = event.params.points;
  pe.totalUserPoints = event.params.totalUserPoints;
  pe.totalDistributed = event.params.totalDistributed;
  pe.timestamp = event.block.timestamp;
  pe.save();

  let stats = getOrCreateGlobalStats();
  stats.totalPointsDistributed = event.params.totalDistributed;
  stats.save();
}

export function handleCommitmentMade(event: CommitmentMade): void {
  let senderAddr = event.params.sender.toHexString();
  let owner = getOrCreateOwner(senderAddr, event.block.timestamp);
  owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
  owner.successfulTransactions =
    owner.successfulTransactions.plus(ONE_BI);
  owner.lastTransactionAt = event.block.timestamp;
  trackContract(owner, event.address);
  owner.save();
}

// ═════════════════════════════════════════════════════════════════
// ── ETHRegistrarController Handlers ─────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleETHNameRegistered(
  event: ETHNameRegistered
): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  let ownerType = detectOwnerType(event);
  owner.ownerType = ownerType;

  owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
  owner.successfulTransactions =
    owner.successfulTransactions.plus(ONE_BI);
  owner.totalRegistrations = owner.totalRegistrations.plus(ONE_BI);
  owner.lastTransactionAt = event.block.timestamp;

  // baseCost + premium = total cost in ETH (18 decimals)
  let totalCostWei = event.params.baseCost.plus(event.params.premium);
  let costETH = toETHDecimal(totalCostWei);
  owner.totalVolumeETH = owner.totalVolumeETH.plus(costETH);

  trackContract(owner, event.address);
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  // Create domain entity
  let domainName = event.params.name + ".id";
  let domain = new Domain(domainName);
  domain.labelHash = event.params.label;
  domain.owner = owner.id;
  domain.ownerType = ownerType;
  domain.registeredAt = event.block.timestamp;
  domain.expiresAt = event.params.expires;
  domain.isActive = true;
  domain.cost = costETH;
  domain.registrationTx = event.transaction.hash;
  domain.registeredVia = "eth";
  domain.referrer = null;
  domain.resolver = null;
  domain.save();

  createTransaction(
    event.transaction.hash,
    "",
    owner,
    event.block.timestamp,
    true,
    ZERO_BD,
    costETH,
    event.address,
    event.receipt ? event.receipt!.gasUsed : ZERO_BI,
    "ETHRegistration",
    null
  );

  let stats = getOrCreateGlobalStats();
  stats.totalDomains = stats.totalDomains.plus(ONE_BI);
  stats.totalVolumeETH = stats.totalVolumeETH.plus(costETH);
  stats.save();

  takeScoreSnapshot(owner, event.block.timestamp);
}

export function handleNameRenewed(event: NameRenewed): void {
  let domainName = event.params.name + ".id";
  let domain = Domain.load(domainName);

  if (domain != null) {
    domain.expiresAt = event.params.expires;
    domain.isActive = true;
    domain.save();

    let owner = DomainOwner.load(domain.owner);
    if (owner != null) {
      let costETH = toETHDecimal(event.params.cost);
      owner.totalRenewals = owner.totalRenewals.plus(ONE_BI);
      owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
      owner.successfulTransactions =
        owner.successfulTransactions.plus(ONE_BI);
      owner.lastTransactionAt = event.block.timestamp;
      owner.totalVolumeETH = owner.totalVolumeETH.plus(costETH);
      trackContract(owner, event.address);
      updateReputationScore(owner, event.block.timestamp);
      owner.save();

      createTransaction(
        event.transaction.hash,
        "-renew",
        owner,
        event.block.timestamp,
        true,
        ZERO_BD,
        costETH,
        event.address,
        event.receipt ? event.receipt!.gasUsed : ZERO_BI,
        "Renewal",
        null
      );
    }
  }
}

// ═════════════════════════════════════════════════════════════════
// ── BaseRegistrar (ERC721 Transfer) ─────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleDomainTransfer(
  event: DomainTransferEvent
): void {
  // ERC721 Transfer — update domain ownership when NFT moves
  // We can't directly map tokenId to name in AssemblyScript,
  // so we only track new owner creation for now
  let toAddr = event.params.to.toHexString();
  let zeroAddr = Address.zero().toHexString();

  // Skip minting events (from=0x0), those are handled by NameRegistered
  if (event.params.from.toHexString() == zeroAddr) return;

  // Ensure the new owner is tracked
  let newOwner = getOrCreateOwner(toAddr, event.block.timestamp);
  newOwner.totalTransactions = newOwner.totalTransactions.plus(ONE_BI);
  newOwner.successfulTransactions =
    newOwner.successfulTransactions.plus(ONE_BI);
  newOwner.lastTransactionAt = event.block.timestamp;
  trackContract(newOwner, event.address);
  newOwner.save();
}

// ═════════════════════════════════════════════════════════════════
// ── ENSRegistry Handlers ────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleNewOwner(event: NewOwner): void {
  let id =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();
  let re = new RegistryEvent(id);
  re.node = event.params.node;
  re.eventType = "NewOwner";
  re.owner = event.params.owner;
  re.resolver = null;
  re.timestamp = event.block.timestamp;
  re.save();
}

export function handleNewResolver(event: NewResolver): void {
  let id =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();
  let re = new RegistryEvent(id);
  re.node = event.params.node;
  re.eventType = "NewResolver";
  re.owner = null;
  re.resolver = event.params.resolver;
  re.timestamp = event.block.timestamp;
  re.save();
}

export function handleRegistryTransfer(
  event: RegistryTransferEvent
): void {
  let id =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();
  let re = new RegistryEvent(id);
  re.node = event.params.node;
  re.eventType = "Transfer";
  re.owner = event.params.owner;
  re.resolver = null;
  re.timestamp = event.block.timestamp;
  re.save();
}

// ═════════════════════════════════════════════════════════════════
// ── ReferralVerifier Handlers ───────────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleReferralPaid(event: ReferralPaid): void {
  let referrerAddr = event.params.referrer.toHexString();
  let registrantAddr = event.params.registrant.toHexString();

  let referrer = getOrCreateOwner(referrerAddr, event.block.timestamp);
  let registrant = getOrCreateOwner(
    registrantAddr,
    event.block.timestamp
  );

  let amount = toUSDCDecimal(event.params.amount);

  referrer.referralCount = referrer.referralCount.plus(ONE_BI);
  referrer.referralEarnings = referrer.referralEarnings.plus(amount);
  referrer.save();

  registrant.referredBy = referrer.id;
  registrant.save();

  let id =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();
  let referral = new Referral(id);
  referral.referrer = referrer.id;
  referral.registrant = registrant.id;
  referral.nameHash = event.params.nameHash;
  referral.amount = amount;
  referral.token = event.params.token;
  referral.isFiat = event.params.isFiat;
  referral.timestamp = event.block.timestamp;
  referral.save();

  let stats = getOrCreateGlobalStats();
  stats.totalReferralsPaid = stats.totalReferralsPaid.plus(amount);
  stats.save();
}

export function handleRenewalReferralPaid(
  event: RenewalReferralPaid
): void {
  let referrerAddr = event.params.referrer.toHexString();
  let referrer = getOrCreateOwner(referrerAddr, event.block.timestamp);

  let amount = toUSDCDecimal(event.params.amount);
  referrer.referralEarnings = referrer.referralEarnings.plus(amount);
  referrer.save();

  let stats = getOrCreateGlobalStats();
  stats.totalReferralsPaid = stats.totalReferralsPaid.plus(amount);
  stats.save();
}

// ═════════════════════════════════════════════════════════════════
// ── IDDomainAuction Handlers ────────────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleAuctionCreated(event: AuctionCreated): void {
  let auctionId = event.params.auctionId.toString();
  let auction = new Auction(auctionId);
  auction.name = event.params.name;

  let reservePrice = event.params.isUSDC
    ? toUSDCDecimal(event.params.reservePrice)
    : toETHDecimal(event.params.reservePrice);

  auction.reservePrice = reservePrice;
  auction.startTime = event.params.startTime;
  auction.endTime = event.params.endTime;
  auction.isUSDC = event.params.isUSDC;
  auction.highestBidder = null;
  auction.highestBid = ZERO_BD;
  auction.settled = false;
  auction.cancelled = false;
  auction.winner = null;
  auction.winningAmount = null;
  auction.save();

  let stats = getOrCreateGlobalStats();
  stats.totalAuctions = stats.totalAuctions.plus(ONE_BI);
  stats.save();
}

export function handleBidPlaced(event: BidPlaced): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);
  if (auction == null) return;

  let amount = auction.isUSDC
    ? toUSDCDecimal(event.params.amount)
    : toETHDecimal(event.params.amount);

  auction.highestBidder = event.params.bidder;
  auction.highestBid = amount;
  auction.save();

  let bidId =
    event.transaction.hash.toHexString() +
    "-" +
    event.logIndex.toString();
  let bid = new Bid(bidId);
  bid.auction = auction.id;
  bid.bidder = event.params.bidder;
  bid.amount = amount;
  bid.timestamp = event.block.timestamp;
  bid.save();

  let stats = getOrCreateGlobalStats();
  stats.totalBids = stats.totalBids.plus(ONE_BI);
  stats.save();
}

export function handleAuctionExtended(event: AuctionExtended): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);
  if (auction == null) return;

  auction.endTime = event.params.newEndTime;
  auction.save();
}

export function handleAuctionSettled(event: AuctionSettled): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);
  if (auction == null) return;

  let amount = auction.isUSDC
    ? toUSDCDecimal(event.params.amount)
    : toETHDecimal(event.params.amount);

  auction.settled = true;
  auction.winner = event.params.winner;
  auction.winningAmount = amount;
  auction.save();
}

export function handleAuctionCancelled(
  event: AuctionCancelled
): void {
  let auctionId = event.params.auctionId.toString();
  let auction = Auction.load(auctionId);
  if (auction == null) return;

  auction.cancelled = true;
  auction.save();
}

// ═════════════════════════════════════════════════════════════════
// ── PremiumNameRegistry Handlers ────────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handlePremiumNameAdded(
  event: PremiumNameAdded
): void {
  // Indexed string params are hashed — use the hash as entity ID
  let nameHash = event.params.name.toHexString();
  let premium = new PremiumName(nameHash);
  premium.useAuction = event.params.useAuction;
  premium.fixedPrice = toUSDCDecimal(event.params.fixedPrice);
  premium.isActive = true;
  premium.addedAt = event.block.timestamp;
  premium.save();
}

export function handlePremiumNameRemoved(
  event: PremiumNameRemoved
): void {
  let nameHash = event.params.name.toHexString();
  let premium = PremiumName.load(nameHash);
  if (premium != null) {
    premium.isActive = false;
    premium.save();
  }
}

// ═════════════════════════════════════════════════════════════════
// ── USDC Transfer Handler ───────────────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleUSDCTransfer(event: USDCTransfer): void {
  let fromAddr = event.params.from.toHexString();
  let toAddr = event.params.to.toHexString();
  let amount = toUSDCDecimal(event.params.value);

  // Only track transfers for known domain owners
  let fromOwner = DomainOwner.load(fromAddr);
  if (fromOwner != null) {
    fromOwner.totalTransactions =
      fromOwner.totalTransactions.plus(ONE_BI);
    fromOwner.successfulTransactions =
      fromOwner.successfulTransactions.plus(ONE_BI);
    fromOwner.lastTransactionAt = event.block.timestamp;
    fromOwner.totalVolumeUSDC =
      fromOwner.totalVolumeUSDC.plus(amount);
    trackContract(fromOwner, event.address);
    updateReputationScore(fromOwner, event.block.timestamp);
    fromOwner.save();
  }

  let toOwner = DomainOwner.load(toAddr);
  if (toOwner != null) {
    toOwner.totalTransactions =
      toOwner.totalTransactions.plus(ONE_BI);
    toOwner.successfulTransactions =
      toOwner.successfulTransactions.plus(ONE_BI);
    toOwner.lastTransactionAt = event.block.timestamp;
    toOwner.totalVolumeUSDC = toOwner.totalVolumeUSDC.plus(amount);
    trackContract(toOwner, event.address);
    updateReputationScore(toOwner, event.block.timestamp);
    toOwner.save();
  }
}

// ═════════════════════════════════════════════════════════════════
// ── EntryPoint UserOp Handler ───────────────────────────────────
// ═════════════════════════════════════════════════════════════════

export function handleUserOperationEvent(
  event: UserOperationEvent
): void {
  let senderAddr = event.params.sender.toHexString();
  let owner = DomainOwner.load(senderAddr);
  if (owner == null) return; // only track known domain owners

  owner.ownerType = "AGENT";
  owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
  if (event.params.success) {
    owner.successfulTransactions =
      owner.successfulTransactions.plus(ONE_BI);
  } else {
    owner.failedTransactions = owner.failedTransactions.plus(ONE_BI);
  }
  owner.lastTransactionAt = event.block.timestamp;

  let gasCostETH = toETHDecimal(event.params.actualGasCost);
  owner.totalVolumeETH = owner.totalVolumeETH.plus(gasCostETH);

  trackContract(owner, event.address);
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  createTransaction(
    event.transaction.hash,
    "-userop",
    owner,
    event.block.timestamp,
    event.params.success,
    ZERO_BD,
    gasCostETH,
    event.address,
    event.params.actualGasUsed,
    "UserOperation",
    event.params.userOpHash
  );

  takeScoreSnapshot(owner, event.block.timestamp);
}
