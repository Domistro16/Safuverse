import { BigInt, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";

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

import {
  DomainOwner,
  Domain,
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
    owner.totalVolumeUSDC = ZERO_BD;
    owner.totalVolumeETH = ZERO_BD;
    owner.firstSeenAt = timestamp;
    owner.lastSeenAt = timestamp;
    owner.totalPoints = ZERO_BI;
    owner.referralCount = ZERO_BI;
    owner.referralEarnings = ZERO_BD;
    owner.referredBy = null;
    owner.agentWallet = null;

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

  owner.totalRegistrations = owner.totalRegistrations.plus(ONE_BI);
  owner.lastSeenAt = event.block.timestamp;

  let costUSDC = toUSDCDecimal(event.params.cost);
  owner.totalVolumeUSDC = owner.totalVolumeUSDC.plus(costUSDC);
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

  // Global stats
  let stats = getOrCreateGlobalStats();
  stats.totalDomains = stats.totalDomains.plus(ONE_BI);
  stats.totalVolumeUSDC = stats.totalVolumeUSDC.plus(costUSDC);
  stats.save();
}

export function handleBatchRegistered(event: BatchRegistered): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  owner.ownerType = "AGENT";

  let count = event.params.count;
  owner.totalRegistrations = owner.totalRegistrations.plus(count);
  owner.lastSeenAt = event.block.timestamp;

  let costUSDC = toUSDCDecimal(event.params.totalCost);
  owner.totalVolumeUSDC = owner.totalVolumeUSDC.plus(costUSDC);
  owner.save();

  let stats = getOrCreateGlobalStats();
  stats.totalDomains = stats.totalDomains.plus(count);
  stats.totalVolumeUSDC = stats.totalVolumeUSDC.plus(costUSDC);
  stats.save();
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
  owner.lastSeenAt = event.block.timestamp;
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

  owner.totalRegistrations = owner.totalRegistrations.plus(ONE_BI);
  owner.lastSeenAt = event.block.timestamp;

  // baseCost + premium = total cost in ETH (18 decimals)
  let totalCostWei = event.params.baseCost.plus(event.params.premium);
  let costETH = toETHDecimal(totalCostWei);
  owner.totalVolumeETH = owner.totalVolumeETH.plus(costETH);
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

  let stats = getOrCreateGlobalStats();
  stats.totalDomains = stats.totalDomains.plus(ONE_BI);
  stats.totalVolumeETH = stats.totalVolumeETH.plus(costETH);
  stats.save();
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
      owner.lastSeenAt = event.block.timestamp;
      owner.totalVolumeETH = owner.totalVolumeETH.plus(costETH);
      owner.save();
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
  let toAddr = event.params.to.toHexString();
  let zeroAddr = Address.zero().toHexString();

  // Skip minting events (from=0x0), those are handled by NameRegistered
  if (event.params.from.toHexString() == zeroAddr) return;

  // Ensure the new owner is tracked
  let newOwner = getOrCreateOwner(toAddr, event.block.timestamp);
  newOwner.lastSeenAt = event.block.timestamp;
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
