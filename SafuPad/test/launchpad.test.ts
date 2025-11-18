import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

import type {
  LaunchpadManagerV3,
  TokenFactoryV2,
  BondingCurveDEX,
  MockPriceOracle,
  MockPancakeRouter,
  LPFeeHarvester,
  MockPancakeFactory,
} from "../types/ethers-contracts/index.js";

describe("LaunchpadManagerV3 - Updated for New PROJECT_RAISE Flow", function () {
  let launchpadManager: LaunchpadManagerV3;
  let tokenFactory: TokenFactoryV2;
  let bondingCurveDEX: BondingCurveDEX;
  let priceOracle: MockPriceOracle;
  let lpFeeHarvester: LPFeeHarvester;
  let mockPancakeRouter: MockPancakeRouter;
  let mockPancakeFactory: MockPancakeFactory;
  let owner: any;
  let founder: any;
  let user1: any;
  let user2: any;
  let user3: any;
  let user4: any;
  let platformFee: any;
  let academyFee: any;
  let infoFiFee: any;
  let contributors: any[]; // Additional contributors for multi-wallet tests
  const BNB_PRICE_USD = ethers.parseEther("580");

  const defaultMetadata = {
    logoURI: "https://example.com/logo.png",
    description: "Test token",
    website: "https://example.com",
    twitter: "@test",
    telegram: "https://t.me/test",
    discord: "https://discord.gg/test",
  };

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    [
      owner,
      founder,
      user1,
      user2,
      user3,
      user4,
      platformFee,
      academyFee,
      infoFiFee,
      ...contributors // Remaining signers for multi-wallet contributions
    ] = signers;

    // Deploy MockPriceOracle
    const MockPriceOracle = await ethers.getContractFactory("MockPriceOracle");
    priceOracle = await MockPriceOracle.deploy();
    await priceOracle.waitForDeployment();
    await priceOracle.setBNBPrice(BNB_PRICE_USD);

    // Deploy MockPancakeFactory first
    const MockPancakeFactory = await ethers.getContractFactory(
      "MockPancakeFactory"
    );
    mockPancakeFactory = await MockPancakeFactory.deploy();
    await mockPancakeFactory.waitForDeployment();

    // Deploy MockPancakeRouter
    const MockPancakeRouter = await ethers.getContractFactory(
      "MockPancakeRouter"
    );
    mockPancakeRouter = await MockPancakeRouter.deploy();
    await mockPancakeRouter.waitForDeployment();

    // ✅ Connect factory to router
    await mockPancakeRouter.setFactory(await mockPancakeFactory.getAddress());

    const PANCAKE_ROUTER = await mockPancakeRouter.getAddress();
    const PANCAKE_FACTORY = await mockPancakeFactory.getAddress();

    const TokenFactoryV2 = await ethers.getContractFactory("TokenFactoryV2");
    tokenFactory = await TokenFactoryV2.deploy();
    await tokenFactory.waitForDeployment();
    const LPFeeHarvester = await ethers.getContractFactory("LPFeeHarvester");
    lpFeeHarvester = await LPFeeHarvester.deploy(
      PANCAKE_ROUTER,
      PANCAKE_FACTORY,
      platformFee.address,
      owner.address
    );
    await lpFeeHarvester.waitForDeployment();

    const BondingCurveDEX = await ethers.getContractFactory("BondingCurveDEX");
    bondingCurveDEX = await BondingCurveDEX.deploy(
      platformFee.address,
      academyFee.address,
      infoFiFee.address,
      await priceOracle.getAddress(),
      owner.address,
      PANCAKE_ROUTER,
      PANCAKE_FACTORY,
      await lpFeeHarvester.getAddress() // lpFeeHarvester placeholder for now
    );
    await bondingCurveDEX.waitForDeployment();

    // Deploy LPFeeHarvester

    // ✅ FIXED: Added platformFeeAddress parameter
    const LaunchpadManagerV3 = await ethers.getContractFactory(
      "LaunchpadManagerV3"
    );
    launchpadManager = await LaunchpadManagerV3.deploy(
      await tokenFactory.getAddress(),
      await bondingCurveDEX.getAddress(),
      PANCAKE_ROUTER,
      await priceOracle.getAddress(),
      infoFiFee.address,
      platformFee.address, // ✅ NEW: Platform fee address
      await lpFeeHarvester.getAddress(),
      PANCAKE_FACTORY
    );
    await launchpadManager.waitForDeployment();

    // Grant roles
    const MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANAGER_ROLE"));
    await bondingCurveDEX.grantRole(
      MANAGER_ROLE,
      await launchpadManager.getAddress()
    );
    await lpFeeHarvester.grantRole(
      MANAGER_ROLE,
      await launchpadManager.getAddress()
    );
  });

  // Helper function to complete a raise using multiple contributors (respects 4.44 BNB per-wallet limit)
  async function completeRaise(tokenAddress: string, targetBNB: bigint) {
    const maxContribution = ethers.parseEther("4.44");
    const numContributors = Number((targetBNB * 10n ** 18n) / (maxContribution * 10n ** 18n)) + 1;

    for (let i = 0; i < numContributors; i++) {
      const contributor = i < contributors.length ? contributors[i] : user1;
      const launchInfo = await launchpadManager.getLaunchInfo(tokenAddress);
      const remaining = targetBNB - launchInfo.totalRaised;

      if (remaining <= 0n) break;

      const contribution = remaining < maxContribution ? remaining : maxContribution;

      await launchpadManager.connect(contributor).contribute(tokenAddress, {
        value: contribution,
      });
    }
  }

  describe("PROJECT_RAISE - Launch Creation", function () {
    it("Should create a PROJECT_RAISE launch with BNB amounts", async function () {
      const raiseTargetBNB = ethers.parseEther("50"); // Min 50 BNB
      const raiseMaxBNB = ethers.parseEther("100"); // Max 100 BNB
      const vestingDuration = 90 * 24 * 60 * 60;

      // ✅ FIXED: Removed projectInfoFiWallet parameter, added burnLP
      await expect(
        launchpadManager.connect(founder).createLaunch(
          "Test Token",
          "TEST",
          1_000_000_000,
          raiseTargetBNB,
          raiseMaxBNB,
          vestingDuration,
          defaultMetadata,
          false // burnLP
        )
      ).to.emit(launchpadManager, "LaunchCreated");
    });

    it("Should set 24-hour deadline", async function () {
      const tx = await launchpadManager
        .connect(founder)
        .createLaunch(
          "Test Token",
          "TEST",
          1_000_000_000,
          ethers.parseEther("50"),
          ethers.parseEther("100"),
          90 * 24 * 60 * 60,
          defaultMetadata,
          false
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      const tokenAddress = (event as any).args[0];

      const launchInfo = await launchpadManager.getLaunchInfo(tokenAddress);

      const blockTimestamp = (await ethers.provider.getBlock("latest"))!
        .timestamp;
      const expected24Hours = blockTimestamp + 24 * 60 * 60;

      expect(launchInfo.raiseDeadline).to.be.closeTo(
        expected24Hours,
        10 // 10 second tolerance
      );
    });
  });

  describe("PROJECT_RAISE - Contributions", function () {
    let tokenAddress: string;

    beforeEach(async function () {
      const tx = await launchpadManager.connect(founder).createLaunch(
        "Test Token",
        "TEST",
        1_000_000_000,
        ethers.parseEther("50"), // 50 BNB target
        ethers.parseEther("100"), // 100 BNB max
        90 * 24 * 60 * 60,
        defaultMetadata,
        false
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      tokenAddress = (event as any).args[0];
    });

    it("Should accept contributions within deadline", async function () {
      await expect(
        launchpadManager.connect(user1).contribute(tokenAddress, {
          value: ethers.parseEther("4"),
        })
      ).to.emit(launchpadManager, "ContributionMade");

      const contribution = await launchpadManager.getContribution(
        tokenAddress,
        user1.address
      );
      expect(contribution.amount).to.equal(ethers.parseEther("4"));
    });

    it("Should enforce 4.44 BNB max per wallet", async function () {
      // First contribution: 4 BNB (within limit)
      await launchpadManager.connect(user1).contribute(tokenAddress, {
        value: ethers.parseEther("4"),
      });

      // Second contribution: 0.44 BNB (should succeed, total 4.44)
      await launchpadManager.connect(user1).contribute(tokenAddress, {
        value: ethers.parseEther("0.44"),
      });

      // Third contribution: 0.01 BNB (should fail, would exceed 4.44)
      await expect(
        launchpadManager.connect(user1).contribute(tokenAddress, {
          value: ethers.parseEther("0.01"),
        })
      ).to.be.revertedWith("Exceeds per-wallet contribution limit (4.44 BNB)");
    });

    it("Should complete raise when target met", async function () {
      // Complete the 50 BNB raise using multiple contributors
      await completeRaise(tokenAddress, ethers.parseEther("50"));

      const launchInfo = await launchpadManager.getLaunchInfo(tokenAddress);
      expect(launchInfo.raiseCompleted).to.be.true;
      expect(launchInfo.totalRaised).to.be.gte(ethers.parseEther("50"));
    });

    it("Should reject contributions after deadline", async function () {
      // Fast forward past 24 hours
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(
        launchpadManager.connect(user1).contribute(tokenAddress, {
          value: ethers.parseEther("4"),
        })
      ).to.be.revertedWith("Raise ended");
    });

    it("Should reject contributions after raise completed", async function () {
      // Complete the raise
      await completeRaise(tokenAddress, ethers.parseEther("50"));

      // Try to contribute more
      await expect(
        launchpadManager.connect(user1).contribute(tokenAddress, {
          value: ethers.parseEther("1"),
        })
      ).to.be.revertedWith("Raise already completed");
    });
  });

  describe("PROJECT_RAISE - Token Claims", function () {
    let tokenAddress: string;

    beforeEach(async function () {
      const tx = await launchpadManager
        .connect(founder)
        .createLaunch(
          "Test Token",
          "TEST",
          1_000_000_000,
          ethers.parseEther("50"),
          ethers.parseEther("100"),
          90 * 24 * 60 * 60,
          defaultMetadata,
          false
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      tokenAddress = (event as any).args[0];

      // Complete the raise using helper function
      await completeRaise(tokenAddress, ethers.parseEther("50"));
    });

    it("Should allow contributors to claim tokens proportionally", async function () {
      const token = await ethers.getContractAt(
        "LaunchpadTokenV2",
        tokenAddress
      );

      // First contributor claims their proportional share
      const firstContributor = contributors[0] || user1;
      await launchpadManager
        .connect(firstContributor)
        .claimContributorTokens(tokenAddress);

      const contributorBalance = await token.balanceOf(firstContributor.address);

      // Contributor should receive tokens proportional to their contribution
      // 70% of total supply goes to contributors
      expect(contributorBalance).to.be.gt(0);
      expect(contributorBalance).to.be.lte(ethers.parseEther("700000000")); // Max 70% of 1B
    });

    it("Should prevent double claiming", async function () {
      await launchpadManager
        .connect(user1)
        .claimContributorTokens(tokenAddress);

      await expect(
        launchpadManager.connect(user1).claimContributorTokens(tokenAddress)
      ).to.be.revertedWith("Already claimed");
    });

    it("Should reject claims from non-contributors", async function () {
      await expect(
        launchpadManager.connect(user3).claimContributorTokens(tokenAddress)
      ).to.be.revertedWith("No contribution");
    });

    it("Should give founder 50% of tokens immediately", async function () {
      const token = await ethers.getContractAt(
        "LaunchpadTokenV2",
        tokenAddress
      );
      const founderBalance = await token.balanceOf(founder.address);

      // Founder should have 10% of 200M = 100M (50% immediate release)
      const expectedImmediate = ethers.parseEther("100000000");

      expect(founderBalance).to.equal(expectedImmediate);
    });
  });

  describe("PROJECT_RAISE - Failed Raise & Refunds", function () {
    let tokenAddress: string;

    beforeEach(async function () {
      const tx = await launchpadManager.connect(founder).createLaunch(
        "Test Token",
        "TEST",
        1_000_000_000,
        ethers.parseEther("0.1"), // Target: 0.1 BNB
        ethers.parseEther("0.5"),
        90 * 24 * 60 * 60,
        defaultMetadata,
        false
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      tokenAddress = (event as any).args[0];

      // Contribute less than target (50 BNB)
      await launchpadManager.connect(user1).contribute(tokenAddress, {
        value: ethers.parseEther("4.44"), // Max per wallet
      });

      await launchpadManager.connect(user2).contribute(tokenAddress, {
        value: ethers.parseEther("4.44"), // Total: 8.88 BNB (below 50 BNB target)
      });

      // Fast forward past deadline
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("evm_mine");
    });

    it("Should allow contributors to claim refund after failed raise", async function () {
      const user1BalanceBefore = await ethers.provider.getBalance(
        user1.address
      );

      const tx = await launchpadManager
        .connect(user1)
        .claimRefund(tokenAddress);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const user1BalanceAfter = await ethers.provider.getBalance(user1.address);

      // Should get back 4.44 BNB minus gas
      const expectedIncrease = ethers.parseEther("4.44") - gasUsed;
      const actualIncrease = user1BalanceAfter - user1BalanceBefore;

      expect(actualIncrease).to.be.closeTo(
        expectedIncrease,
        ethers.parseEther("0.001")
      );
    });

    it("Should prevent double refund claims", async function () {
      await launchpadManager.connect(user1).claimRefund(tokenAddress);

      await expect(
        launchpadManager.connect(user1).claimRefund(tokenAddress)
      ).to.be.revertedWith("Already claimed");
    });

    it("Should reject refund claims before deadline", async function () {
      // Create new launch
      const tx = await launchpadManager
        .connect(founder)
        .createLaunch(
          "New Token",
          "NEW",
          1_000_000_000,
          ethers.parseEther("50"),
          ethers.parseEther("100"),
          90 * 24 * 60 * 60,
          defaultMetadata,
          false
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      const newTokenAddress = (event as any).args[0];

      await launchpadManager.connect(user1).contribute(newTokenAddress, {
        value: ethers.parseEther("0.05"),
      });

      // Try to claim refund before deadline
      await expect(
        launchpadManager.connect(user1).claimRefund(newTokenAddress)
      ).to.be.revertedWith("Raise still active");
    });

    it("Should allow token burning after failed raise", async function () {
      await expect(
        launchpadManager.connect(owner).burnFailedRaiseTokens(tokenAddress)
      ).to.emit(launchpadManager, "TokensBurned");
    });

    it("Should reject refund if raise was successful", async function () {
      // Create new launch and complete it
      const tx = await launchpadManager
        .connect(founder)
        .createLaunch(
          "Success Token",
          "SUCCESS",
          1_000_000_000,
          ethers.parseEther("50"),
          ethers.parseEther("100"),
          90 * 24 * 60 * 60,
          defaultMetadata,
          false
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      const successTokenAddress = (event as any).args[0];

      // Complete the raise
      await completeRaise(successTokenAddress, ethers.parseEther("50"));

      // Fast forward past deadline
      await ethers.provider.send("evm_increaseTime", [25 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Try to claim refund
      await expect(
        launchpadManager.connect(user1).claimRefund(successTokenAddress)
      ).to.be.revertedWith("Raise was successful");
    });
  });

  describe("PROJECT_RAISE - PancakeSwap Graduation", function () {
    let tokenAddress: string;

    beforeEach(async function () {
      const tx = await launchpadManager.connect(founder).createLaunch(
        "Test Token",
        "TEST",
        1_000_000_000,
        ethers.parseEther("0.1"),
        ethers.parseEther("0.5"),
        90 * 24 * 60 * 60,
        defaultMetadata,
        false // Don't burn LP
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      tokenAddress = (event as any).args[0];

      // Complete the raise
      await completeRaise(tokenAddress, ethers.parseEther("50"));
    });

    it("Should graduate to PancakeSwap with 10% tokens and 50% BNB", async function () {
      await expect(
        launchpadManager.graduateToPancakeSwap(tokenAddress)
      ).to.emit(launchpadManager, "GraduatedToPancakeSwap");

      const launchInfo = await launchpadManager.getLaunchInfo(tokenAddress);
      expect(launchInfo.graduatedToPancakeSwap).to.be.true;
    });

    it("Should deduct 1% platform fee from liquidity BNB", async function () {
      const platformBalanceBefore = await ethers.provider.getBalance(
        platformFee.address
      );

      await launchpadManager.graduateToPancakeSwap(tokenAddress);

      const platformBalanceAfter = await ethers.provider.getBalance(
        platformFee.address
      );

      // 50% of 0.1 BNB = 0.05 BNB for liquidity
      // 1% of 0.05 BNB = 0.0005 BNB platform fee
      const expectedFee = ethers.parseEther("0.0005");
      const actualFee = platformBalanceAfter - platformBalanceBefore;

      expect(actualFee).to.equal(expectedFee);
    });
    it("Should allow selling tokens after graduation through PancakeSwap", async function () {
      // Graduate to PancakeSwap first
      await launchpadManager.graduateToPancakeSwap(tokenAddress);

      // User1 needs to claim their contributor tokens first
      await launchpadManager.connect(user1).claimContributorTokens(tokenAddress);

      const token = await ethers.getContractAt("LaunchpadTokenV2", tokenAddress);
      const user1Balance = await token.balanceOf(user1.address);

      // Approve launchpadManager to spend tokens
      const sellAmount = ethers.parseEther("1000");
      await token.connect(user1).approve(await launchpadManager.getAddress(), sellAmount);

      // Now user1 can sell through handlePostGraduationSell
      await expect(
        launchpadManager
          .connect(user1)
          .handlePostGraduationSell(tokenAddress, sellAmount, 0)
      ).to.not.be.reverted;
    });
    it("Should lock LP tokens in LPFeeHarvester", async function () {
      await launchpadManager.graduateToPancakeSwap(tokenAddress);

      const lockInfo = await lpFeeHarvester.getLockInfo(tokenAddress);
      expect(lockInfo.active).to.be.true;
      expect(lockInfo.creator).to.equal(founder.address);
      expect(lockInfo.lpAmount).to.be.gt(0);
    });

    it("Should burn LP tokens if burnLP is true", async function () {
      // Create new launch with burnLP = true
      const tx = await launchpadManager.connect(founder).createLaunch(
        "Burn Token",
        "BURN",
        1_000_000_000,
        ethers.parseEther("0.1"),
        ethers.parseEther("0.5"),
        90 * 24 * 60 * 60,
        defaultMetadata,
        true // Burn LP
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      const burnTokenAddress = (event as any).args[0];

      // Complete raise
      await completeRaise(burnTokenAddress, ethers.parseEther("50"));

      await expect(
        launchpadManager.graduateToPancakeSwap(burnTokenAddress)
      ).to.emit(launchpadManager, "LPBurned");
    });

    it("Should enable transfers after graduation", async function () {
      await launchpadManager.graduateToPancakeSwap(tokenAddress);

      const token = await ethers.getContractAt(
        "LaunchpadTokenV2",
        tokenAddress
      );
      const transfersEnabled = await token.transfersEnabled();

      expect(transfersEnabled).to.be.true;
    });

    it("Should reject graduation before raise completes", async function () {
      // Create new launch without completing it
      const tx = await launchpadManager
        .connect(founder)
        .createLaunch(
          "Incomplete Token",
          "INC",
          1_000_000_000,
          ethers.parseEther("50"),
          ethers.parseEther("100"),
          90 * 24 * 60 * 60,
          defaultMetadata,
          false
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      const incTokenAddress = (event as any).args[0];

      // Don't complete raise, just try to graduate
      await expect(
        launchpadManager.graduateToPancakeSwap(incTokenAddress)
      ).to.be.revertedWith("Raise not completed");
    });

    it("Should prevent double graduation", async function () {
      await launchpadManager.graduateToPancakeSwap(tokenAddress);

      await expect(
        launchpadManager.graduateToPancakeSwap(tokenAddress)
      ).to.be.revertedWith("Already graduated to PancakeSwap");
    });
  });

  describe("PROJECT_RAISE - Founder Vesting", function () {
    let tokenAddress: string;

    beforeEach(async function () {
      const tx = await launchpadManager.connect(founder).createLaunch(
        "Test Token",
        "TEST",
        1_000_000_000,
        ethers.parseEther("0.1"),
        ethers.parseEther("0.5"),
        90 * 24 * 60 * 60, // 90 days vesting
        defaultMetadata,
        false
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "LaunchCreated"
      );
      tokenAddress = (event as any).args[0];

      // Complete the raise
      await completeRaise(tokenAddress, ethers.parseEther("50"));
    });

    it("Should allow founder to claim vested tokens over time", async function () {
      // Fast forward 30 days (1 month)
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const claimable = await launchpadManager.getClaimableAmounts(
        tokenAddress
      );
      expect(claimable.claimableTokens).to.be.gt(0);

      await launchpadManager.connect(founder).claimFounderTokens(tokenAddress);

      const token = await ethers.getContractAt(
        "LaunchpadTokenV2",
        tokenAddress
      );
      const founderBalance = await token.balanceOf(founder.address);

      // Should have initial 50% + some vested amount
      expect(founderBalance).to.be.gt(ethers.parseEther("100000000")); // More than initial 100M
    });

    it("Should allow founder to claim all tokens after full vesting", async function () {
      // Fast forward 90 days (full vesting)
      await ethers.provider.send("evm_increaseTime", [90 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await launchpadManager.connect(founder).claimFounderTokens(tokenAddress);

      const token = await ethers.getContractAt(
        "LaunchpadTokenV2",
        tokenAddress
      );
      const founderBalance = await token.balanceOf(founder.address);

      // Should have all 200M tokens (20% of 1B)
      const expected = ethers.parseEther("200000000");
      expect(founderBalance).to.be.closeTo(expected, ethers.parseEther("1")); // 1 token tolerance
    });
  });

  describe("INSTANT_LAUNCH - Verification", function () {
    it("Should create instant launch and use BondingCurveDEX", async function () {
      const initialBuy = ethers.parseEther("1");
      const totalValue = initialBuy + ethers.parseEther("5");

      await expect(
        launchpadManager
          .connect(founder)
          .createInstantLaunch(
            "Instant Token",
            "INST",
            1_000_000_000,
            defaultMetadata,
            initialBuy,
            false,
            { value: totalValue }
          )
      ).to.emit(launchpadManager, "InstantLaunchCreated");
    });
  });
});
