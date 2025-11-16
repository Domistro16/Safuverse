import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  LaunchCreated,
  InstantLaunchCreated,
  ContributionMade,
  RaiseCompleted,
  ContributorTokensClaimed,
  RefundClaimed,
  RaiseFailed,
  FounderTokensClaimed,
  RaisedFundsClaimed,
  GraduatedToPancakeSwap,
  TransfersEnabled,
} from "../generated/LaunchpadManager/LaunchpadManager";
import { Launch, Contribution, Token, PlatformStats } from "../generated/schema";
import { updatePlatformStats, updateDailyStats } from "./helpers";

export function handleLaunchCreated(event: LaunchCreated): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = new Launch(tokenAddress);

  launch.token = tokenAddress;
  launch.founder = event.params.founder;
  launch.launchType = event.params.launchType == 0 ? "PROJECT_RAISE" : "INSTANT_LAUNCH";
  launch.totalSupply = event.params.totalSupply;
  launch.raiseTarget = event.params.raiseTargetBNB;
  launch.raiseMax = event.params.raiseMaxBNB;
  launch.raiseDeadline = event.params.deadline;
  launch.totalRaised = BigInt.fromI32(0);
  launch.raiseCompleted = false;
  launch.liquidityAdded = false;
  launch.graduatedToPancakeSwap = false;
  launch.burnLP = event.params.burnLP;
  launch.founderTokensClaimed = BigInt.fromI32(0);
  launch.liquidityBNB = BigInt.fromI32(0);
  launch.liquidityTokens = BigInt.fromI32(0);
  launch.raisedFundsVesting = BigInt.fromI32(0);
  launch.raisedFundsClaimed = BigInt.fromI32(0);
  launch.createdAt = event.block.timestamp;
  launch.createdAtBlock = event.block.number;

  launch.save();

  // Update token
  let token = Token.load(tokenAddress);
  if (token) {
    token.launch = launch.id;
    token.save();
  }

  // Update platform stats
  updatePlatformStats(event.block.timestamp);
  let stats = PlatformStats.load("platform");
  if (stats) {
    stats.totalLaunches = stats.totalLaunches.plus(BigInt.fromI32(1));
    if (launch.launchType == "PROJECT_RAISE") {
      stats.totalProjectRaises = stats.totalProjectRaises.plus(BigInt.fromI32(1));
    }
    stats.save();
  }

  // Update daily stats
  updateDailyStats(event.block.timestamp, BigInt.fromI32(0), BigInt.fromI32(0), BigInt.fromI32(0));
}

export function handleInstantLaunchCreated(event: InstantLaunchCreated): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = new Launch(tokenAddress);

  launch.token = tokenAddress;
  launch.founder = event.params.founder;
  launch.launchType = "INSTANT_LAUNCH";
  launch.totalSupply = event.params.totalSupply;
  launch.totalRaised = BigInt.fromI32(0);
  launch.raiseCompleted = true;
  launch.liquidityAdded = true;
  launch.graduatedToPancakeSwap = false;
  launch.burnLP = event.params.burnLP;
  launch.founderTokensClaimed = BigInt.fromI32(0);
  launch.liquidityBNB = BigInt.fromI32(0);
  launch.liquidityTokens = BigInt.fromI32(0);
  launch.raisedFundsVesting = BigInt.fromI32(0);
  launch.raisedFundsClaimed = BigInt.fromI32(0);
  launch.createdAt = event.block.timestamp;
  launch.createdAtBlock = event.block.number;

  launch.save();

  // Update token
  let token = Token.load(tokenAddress);
  if (token) {
    token.launch = launch.id;
    token.save();
  }

  // Update platform stats
  updatePlatformStats(event.block.timestamp);
  let stats = PlatformStats.load("platform");
  if (stats) {
    stats.totalLaunches = stats.totalLaunches.plus(BigInt.fromI32(1));
    stats.totalInstantLaunches = stats.totalInstantLaunches.plus(BigInt.fromI32(1));
    stats.save();
  }
}

export function handleContributionMade(event: ContributionMade): void {
  let tokenAddress = event.params.token.toHexString();
  let contributorAddress = event.params.contributor.toHexString();
  let contributionId = tokenAddress + "-" + contributorAddress;

  let contribution = Contribution.load(contributionId);
  if (!contribution) {
    contribution = new Contribution(contributionId);
    contribution.launch = tokenAddress;
    contribution.contributor = event.params.contributor;
    contribution.amount = BigInt.fromI32(0);
    contribution.claimed = false;
    contribution.timestamp = event.block.timestamp;
    contribution.transactionHash = event.transaction.hash;
  }

  contribution.amount = contribution.amount.plus(event.params.amount);
  contribution.save();

  // Update launch
  let launch = Launch.load(tokenAddress);
  if (launch) {
    launch.totalRaised = launch.totalRaised.plus(event.params.amount);
    launch.save();

    // Update platform stats
    let stats = PlatformStats.load("platform");
    if (stats) {
      stats.totalRaised = stats.totalRaised.plus(event.params.amount);
      stats.save();
    }
  }
}

export function handleRaiseCompleted(event: RaiseCompleted): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = Launch.load(tokenAddress);

  if (launch) {
    launch.raiseCompleted = true;
    launch.totalRaised = event.params.totalRaised;
    launch.vestingStartTime = event.block.timestamp;
    launch.save();
  }
}

export function handleContributorTokensClaimed(event: ContributorTokensClaimed): void {
  let tokenAddress = event.params.token.toHexString();
  let contributorAddress = event.params.contributor.toHexString();
  let contributionId = tokenAddress + "-" + contributorAddress;

  let contribution = Contribution.load(contributionId);
  if (contribution) {
    contribution.claimed = true;
    contribution.save();
  }
}

export function handleRefundClaimed(event: RefundClaimed): void {
  let tokenAddress = event.params.token.toHexString();
  let contributorAddress = event.params.contributor.toHexString();
  let contributionId = tokenAddress + "-" + contributorAddress;

  let contribution = Contribution.load(contributionId);
  if (contribution) {
    contribution.claimed = true;
    contribution.save();
  }
}

export function handleRaiseFailed(event: RaiseFailed): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = Launch.load(tokenAddress);

  if (launch) {
    launch.raiseCompleted = false;
    launch.save();
  }
}

export function handleFounderTokensClaimed(event: FounderTokensClaimed): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = Launch.load(tokenAddress);

  if (launch) {
    launch.founderTokensClaimed = launch.founderTokensClaimed.plus(event.params.amount);
    launch.save();
  }
}

export function handleRaisedFundsClaimed(event: RaisedFundsClaimed): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = Launch.load(tokenAddress);

  if (launch) {
    launch.raisedFundsClaimed = launch.raisedFundsClaimed.plus(event.params.amount);
    launch.save();
  }
}

export function handleGraduatedToPancakeSwap(event: GraduatedToPancakeSwap): void {
  let tokenAddress = event.params.token.toHexString();
  let launch = Launch.load(tokenAddress);

  if (launch) {
    launch.graduatedToPancakeSwap = true;
    launch.liquidityAdded = true;
    launch.liquidityBNB = event.params.bnbForLiquidity;
    launch.liquidityTokens = event.params.tokensForLiquidity;
    launch.save();

    // Update platform stats
    let stats = PlatformStats.load("platform");
    if (stats) {
      stats.totalGraduated = stats.totalGraduated.plus(BigInt.fromI32(1));
      stats.save();
    }
  }
}

export function handleTransfersEnabled(event: TransfersEnabled): void {
  // Handle token transfers being enabled
  // This could be tracked in the Token entity if needed
}
