import { BigInt, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import {
  NameRegistered,
  BatchRegistered,
  AgentWalletDeployed,
} from "../../generated/DomainRegistry/DomainRegistry";
import { Transfer } from "../../generated/USDC/ERC20";
import { UserOperationEvent } from "../../generated/EntryPoint/EntryPoint";
import { DomainOwner, Domain, Transaction, ScoreSnapshot } from "../../generated/schema";
import {
  ZERO_BI,
  ONE_BI,
  ZERO_BD,
  ENTRYPOINT_ADDRESS,
  toUSDCDecimal,
  toETHDecimal,
  calculateReputationScore,
} from "./utils";

// ─── Helpers ───────────────────────────────────────────────────────

function getOrCreateOwner(address: string, timestamp: BigInt): DomainOwner {
  let owner = DomainOwner.load(address);
  if (owner == null) {
    owner = new DomainOwner(address);
    owner.ownerType = "HUMAN"; // default; overridden if detected as agent
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
    owner.interactedContracts = [];
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

function updateReputationScore(owner: DomainOwner, currentTimestamp: BigInt): void {
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

function takeScoreSnapshot(owner: DomainOwner, timestamp: BigInt): void {
  let snapshotId = owner.id + "-" + timestamp.toString();
  let snapshot = new ScoreSnapshot(snapshotId);
  snapshot.owner = owner.id;
  snapshot.score = owner.reputationScore;
  snapshot.timestamp = timestamp;
  snapshot.save();
}

// ─── Domain Registry Handlers ──────────────────────────────────────

export function handleNameRegistered(event: NameRegistered): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  let ownerType = detectOwnerType(event);
  owner.ownerType = ownerType;

  // Update transaction metrics
  owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
  owner.successfulTransactions = owner.successfulTransactions.plus(ONE_BI);
  owner.lastTransactionAt = event.block.timestamp;

  // Track USDC volume from registration cost (cost is in USDC 6 decimals)
  let costUSDC = toUSDCDecimal(event.params.cost);
  owner.totalVolumeUSDC = owner.totalVolumeUSDC.plus(costUSDC);

  // Track contract interaction
  trackContract(owner, event.address);

  // Update score
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  // Create domain entity
  let domainName = event.params.name + ".id";
  let domain = new Domain(domainName);
  domain.owner = owner.id;
  domain.ownerType = ownerType;
  domain.registeredAt = event.block.timestamp;
  domain.expiresAt = event.params.expires;
  domain.isActive = true;
  domain.cost = costUSDC;
  domain.save();

  // Create transaction record
  let txId = event.transaction.hash.toHexString();
  let tx = new Transaction(txId);
  tx.owner = owner.id;
  tx.timestamp = event.block.timestamp;
  tx.successful = true;
  tx.valueUSDC = costUSDC;
  tx.valueETH = ZERO_BD;
  tx.toContract = event.address;
  tx.gasUsed = event.receipt ? event.receipt!.gasUsed : ZERO_BI;
  tx.save();

  // Score snapshot
  takeScoreSnapshot(owner, event.block.timestamp);
}

export function handleBatchRegistered(event: BatchRegistered): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  owner.ownerType = "AGENT"; // batch registration is agent-only

  let count = event.params.count;
  owner.totalTransactions = owner.totalTransactions.plus(count);
  owner.successfulTransactions = owner.successfulTransactions.plus(count);
  owner.lastTransactionAt = event.block.timestamp;

  let costUSDC = toUSDCDecimal(event.params.totalCost);
  owner.totalVolumeUSDC = owner.totalVolumeUSDC.plus(costUSDC);

  trackContract(owner, event.address);
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  // Transaction record
  let txId = event.transaction.hash.toHexString();
  let tx = new Transaction(txId);
  tx.owner = owner.id;
  tx.timestamp = event.block.timestamp;
  tx.successful = true;
  tx.valueUSDC = costUSDC;
  tx.valueETH = ZERO_BD;
  tx.toContract = event.address;
  tx.gasUsed = event.receipt ? event.receipt!.gasUsed : ZERO_BI;
  tx.save();

  takeScoreSnapshot(owner, event.block.timestamp);
}

export function handleAgentWalletDeployed(event: AgentWalletDeployed): void {
  let ownerAddr = event.params.owner.toHexString();
  let owner = getOrCreateOwner(ownerAddr, event.block.timestamp);
  owner.ownerType = "AGENT";
  owner.save();

  // Also create an entry for the deployed wallet itself
  let walletAddr = event.params.wallet.toHexString();
  let walletOwner = getOrCreateOwner(walletAddr, event.block.timestamp);
  walletOwner.ownerType = "AGENT";
  walletOwner.save();
}

// ─── USDC Transfer Handler ──────────────────────────────────────────

export function handleUSDCTransfer(event: Transfer): void {
  let fromAddr = event.params.from.toHexString();
  let toAddr = event.params.to.toHexString();
  let amount = toUSDCDecimal(event.params.value);

  // Track sender
  let fromOwner = DomainOwner.load(fromAddr);
  if (fromOwner != null) {
    fromOwner.totalTransactions = fromOwner.totalTransactions.plus(ONE_BI);
    fromOwner.successfulTransactions = fromOwner.successfulTransactions.plus(ONE_BI);
    fromOwner.lastTransactionAt = event.block.timestamp;
    fromOwner.totalVolumeUSDC = fromOwner.totalVolumeUSDC.plus(amount);
    trackContract(fromOwner, event.address);
    updateReputationScore(fromOwner, event.block.timestamp);
    fromOwner.save();
  }

  // Track receiver
  let toOwner = DomainOwner.load(toAddr);
  if (toOwner != null) {
    toOwner.totalTransactions = toOwner.totalTransactions.plus(ONE_BI);
    toOwner.successfulTransactions = toOwner.successfulTransactions.plus(ONE_BI);
    toOwner.lastTransactionAt = event.block.timestamp;
    toOwner.totalVolumeUSDC = toOwner.totalVolumeUSDC.plus(amount);
    trackContract(toOwner, event.address);
    updateReputationScore(toOwner, event.block.timestamp);
    toOwner.save();
  }
}

// ─── EntryPoint UserOp Handler ──────────────────────────────────────

export function handleUserOperationEvent(event: UserOperationEvent): void {
  let senderAddr = event.params.sender.toHexString();
  let owner = DomainOwner.load(senderAddr);
  if (owner == null) return; // only track known domain owners

  owner.ownerType = "AGENT";
  owner.totalTransactions = owner.totalTransactions.plus(ONE_BI);
  if (event.params.success) {
    owner.successfulTransactions = owner.successfulTransactions.plus(ONE_BI);
  } else {
    owner.failedTransactions = owner.failedTransactions.plus(ONE_BI);
  }
  owner.lastTransactionAt = event.block.timestamp;

  // Track gas cost as ETH volume
  let gasCostETH = toETHDecimal(event.params.actualGasCost);
  owner.totalVolumeETH = owner.totalVolumeETH.plus(gasCostETH);

  trackContract(owner, event.address);
  updateReputationScore(owner, event.block.timestamp);
  owner.save();

  // Transaction record
  let txId = event.transaction.hash.toHexString() + "-userop";
  let tx = new Transaction(txId);
  tx.owner = owner.id;
  tx.timestamp = event.block.timestamp;
  tx.successful = event.params.success;
  tx.valueUSDC = ZERO_BD;
  tx.valueETH = gasCostETH;
  tx.toContract = event.address;
  tx.gasUsed = event.params.actualGasUsed;
  tx.userOpHash = event.params.userOpHash;
  tx.save();

  takeScoreSnapshot(owner, event.block.timestamp);
}
