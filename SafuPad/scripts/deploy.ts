// scripts/deploy.ts
import { network } from "hardhat";

const { ethers } = await network.connect();
import fs from "fs";

import type { Signer } from "ethers";
import type { Contract, ContractFactory } from "ethers";

// Color codes for console output
const colors: Record<string, string> = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string): void {
  console.log("\n" + "=".repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log("=".repeat(60));
}

function logSubSection(title: string): void {
  console.log("\n" + "-".repeat(40));
  log(title, colors.magenta);
  console.log("-".repeat(40));
}

// Helper to safely get deployed contract address
const resolveAddress = async (contract: any) => {
  if (!contract) return "";
  try {
    if (typeof contract.getAddress === "function") {
      const val = await contract.getAddress();
      if (typeof val === "string") return val;
      return String(val);
    }
  } catch (e) {
    // ignore and try fallback
  }
  return (contract.address as string) ?? "";
};

async function main(): Promise<void> {
  const signers: Signer[] = await ethers.getSigners();
  const deployer: Signer = signers[0];
  const deployerAddress: string = await deployer.getAddress();

  const networkName: string =
    (network as any).name ??
    String((await ethers.provider.getNetwork()).chainId ?? "local");

  logSection("🚀 SAFUPAD MODULAR DEPLOYMENT SCRIPT");
  log(`Deploying from: ${deployerAddress}`, colors.green);
  log(
    `Balance: ${ethers.formatEther(
      await ethers.provider.getBalance(deployerAddress)
    )} BNB`,
    colors.green
  );
  log(`Network: ${networkName}`, colors.blue);

  // ============================================
  // CONFIGURATION - UPDATE THESE VALUES
  // ============================================
  const config: {
    priceFeed: string;
    pancakeRouter: string;
    pancakeFactory: string;
    wbnbAddress: string;
    platformFeeAddress: string;
    academyFeeAddress: string;
    infoFiAddress: string;
    adminAddress: string;
    raisedFundsTimelock: string;
  } = {
    // BSC Mainnet addresses
    priceFeed: "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE",
    pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    pancakeFactory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
    wbnbAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // BSC Testnet WBNB
    platformFeeAddress: "0x235799785E387C2612d4A881919436B612ed391D",
    academyFeeAddress: "0x235799785E387C2612d4A881919436B612ed391D",
    infoFiAddress: deployerAddress,
    adminAddress: deployerAddress,
    raisedFundsTimelock: "", // Will be set after deployment or use existing
  };

  logSection("📋 CONFIGURATION");
  console.log(config);

  const deployedContracts: Record<string, string> = {};

  // ============================================
  // PHASE 1: CORE INFRASTRUCTURE
  // ============================================
  logSection("📦 PHASE 1: CORE INFRASTRUCTURE");

  // 1.1 Deploy PriceOracle
  logSubSection("1.1 Deploying PriceOracle");
  const PriceOracle: ContractFactory = await ethers.getContractFactory(
    "PriceOracle"
  );
  const priceOracle = await PriceOracle.deploy(config.priceFeed);
  if (typeof (priceOracle as any).waitForDeployment === "function") {
    await (priceOracle as any).waitForDeployment();
  }
  deployedContracts.priceOracle = await resolveAddress(priceOracle);
  log(`✅ PriceOracle: ${deployedContracts.priceOracle}`, colors.green);

  // 1.2 Deploy TokenFactory
  logSubSection("1.2 Deploying TokenFactoryV2");
  const TokenFactoryV2: ContractFactory = await ethers.getContractFactory(
    "TokenFactoryV2"
  );
  const tokenFactory = await TokenFactoryV2.deploy();
  if (typeof (tokenFactory as any).waitForDeployment === "function") {
    await (tokenFactory as any).waitForDeployment();
  }
  deployedContracts.tokenFactory = await resolveAddress(tokenFactory);
  log(`✅ TokenFactoryV2: ${deployedContracts.tokenFactory}`, colors.green);

  // 1.3 Deploy LPFeeHarvester
  logSubSection("1.3 Deploying LPFeeHarvester");
  const LPFeeHarvester = await ethers.getContractFactory("LPFeeHarvester");
  const lpFeeHarvester = await LPFeeHarvester.deploy(
    config.pancakeRouter,
    config.pancakeFactory,
    config.platformFeeAddress,
    config.adminAddress,
    config.academyFeeAddress
  );
  if (typeof lpFeeHarvester.waitForDeployment === "function") {
    await lpFeeHarvester.waitForDeployment();
  }
  deployedContracts.lpFeeHarvester = await resolveAddress(lpFeeHarvester);
  log(`✅ LPFeeHarvester: ${deployedContracts.lpFeeHarvester}`, colors.green);

  // 1.4 Deploy BondingCurveDEX
  logSubSection("1.4 Deploying BondingCurveDEX");
  const BondingCurveDEX: ContractFactory = await ethers.getContractFactory(
    "BondingCurveDEX"
  );
  const bondingCurveDEX = await BondingCurveDEX.deploy(
    config.platformFeeAddress,
    config.academyFeeAddress,
    config.infoFiAddress,
    deployedContracts.priceOracle,
    config.adminAddress,
    config.pancakeRouter,
    config.pancakeFactory,
    deployedContracts.lpFeeHarvester
  );
  if (typeof (bondingCurveDEX as any).waitForDeployment === "function") {
    await (bondingCurveDEX as any).waitForDeployment();
  }
  deployedContracts.bondingCurveDEX = await resolveAddress(bondingCurveDEX);
  log(`✅ BondingCurveDEX: ${deployedContracts.bondingCurveDEX}`, colors.green);

  // 1.5 Deploy RaisedFundsTimelock (if not provided)
  if (!config.raisedFundsTimelock) {
    logSubSection("1.5 Deploying RaisedFundsTimelock");
    const RaisedFundsTimelock = await ethers.getContractFactory(
      "RaisedFundsTimelock"
    );
    const raisedFundsTimelock = await RaisedFundsTimelock.deploy(
      config.adminAddress
    );
    if (typeof raisedFundsTimelock.waitForDeployment === "function") {
      await raisedFundsTimelock.waitForDeployment();
    }
    deployedContracts.raisedFundsTimelock = await resolveAddress(
      raisedFundsTimelock
    );
    config.raisedFundsTimelock = deployedContracts.raisedFundsTimelock;
    log(
      `✅ RaisedFundsTimelock: ${deployedContracts.raisedFundsTimelock}`,
      colors.green
    );
  } else {
    deployedContracts.raisedFundsTimelock = config.raisedFundsTimelock;
    log(
      `ℹ️  Using existing RaisedFundsTimelock: ${config.raisedFundsTimelock}`,
      colors.yellow
    );
  }

  // ============================================
  // PHASE 2: MODULAR LAUNCHPAD CONTRACTS
  // ============================================
  logSection("📦 PHASE 2: MODULAR LAUNCHPAD CONTRACTS");

  // 2.1 Deploy LaunchpadStorage
  logSubSection("2.1 Deploying LaunchpadStorage");
  const LaunchpadStorage = await ethers.getContractFactory("LaunchpadStorage");
  const launchpadStorage = await LaunchpadStorage.deploy(config.adminAddress);
  if (typeof launchpadStorage.waitForDeployment === "function") {
    await launchpadStorage.waitForDeployment();
  }
  deployedContracts.launchpadStorage = await resolveAddress(launchpadStorage);
  log(
    `✅ LaunchpadStorage: ${deployedContracts.launchpadStorage}`,
    colors.green
  );

  // 2.2 Deploy LaunchpadManagerV3
  logSubSection("2.2 Deploying LaunchpadManagerV3");
  const LaunchpadManagerV3: ContractFactory = await ethers.getContractFactory(
    "LaunchpadManagerV3"
  );
  const launchpadManager = await LaunchpadManagerV3.deploy(
    deployedContracts.launchpadStorage,
    deployedContracts.tokenFactory,
    deployedContracts.bondingCurveDEX,
    config.pancakeRouter,
    deployedContracts.priceOracle,
    config.infoFiAddress,
    config.platformFeeAddress,
    deployedContracts.lpFeeHarvester,
    config.pancakeFactory
  );
  if (typeof (launchpadManager as any).waitForDeployment === "function") {
    await (launchpadManager as any).waitForDeployment();
  }
  deployedContracts.launchpadManager = await resolveAddress(launchpadManager);
  log(
    `✅ LaunchpadManagerV3: ${deployedContracts.launchpadManager}`,
    colors.green
  );

  // 2.3 Deploy ContributionManager
  logSubSection("2.3 Deploying ContributionManager");
  const ContributionManager = await ethers.getContractFactory(
    "ContributionManager"
  );
  const contributionManager = await ContributionManager.deploy(
    deployedContracts.launchpadStorage
  );
  if (typeof contributionManager.waitForDeployment === "function") {
    await contributionManager.waitForDeployment();
  }
  deployedContracts.contributionManager = await resolveAddress(
    contributionManager
  );
  log(
    `✅ ContributionManager: ${deployedContracts.contributionManager}`,
    colors.green
  );

  // 2.4 Deploy VestingManager
  logSubSection("2.4 Deploying VestingManager");
  const VestingManager = await ethers.getContractFactory("VestingManager");
  const vestingManager = await VestingManager.deploy(
    deployedContracts.launchpadStorage,
    config.pancakeFactory,
    config.wbnbAddress
  );
  if (typeof vestingManager.waitForDeployment === "function") {
    await vestingManager.waitForDeployment();
  }
  deployedContracts.vestingManager = await resolveAddress(vestingManager);
  log(`✅ VestingManager: ${deployedContracts.vestingManager}`, colors.green);

  // 2.5 Deploy GraduationManager
  logSubSection("2.5 Deploying GraduationManager");
  const GraduationManager = await ethers.getContractFactory(
    "GraduationManager"
  );
  const graduationManager = await GraduationManager.deploy(
    deployedContracts.launchpadStorage,
    config.pancakeRouter,
    config.pancakeFactory,
    deployedContracts.bondingCurveDEX,
    deployedContracts.lpFeeHarvester,
    config.infoFiAddress,
    config.platformFeeAddress
  );
  if (typeof graduationManager.waitForDeployment === "function") {
    await graduationManager.waitForDeployment();
  }
  deployedContracts.graduationManager = await resolveAddress(graduationManager);
  log(
    `✅ GraduationManager: ${deployedContracts.graduationManager}`,
    colors.green
  );

  // ============================================
  // PHASE 3: SETUP ROLES & PERMISSIONS
  // ============================================
  logSection("🔐 PHASE 3: SETUP ROLES & PERMISSIONS");

  // 3.1 Grant MODULE_ROLE on LaunchpadStorage
  logSubSection("3.1 Setting up LaunchpadStorage roles");

  log("→ Granting MODULE_ROLE to LaunchpadManager...");
  let tx = await (launchpadStorage as any).grantModuleRole(
    deployedContracts.launchpadManager
  );
  await tx.wait?.();
  log(`✅ MODULE_ROLE granted to LaunchpadManager`, colors.green);

  log("→ Granting MODULE_ROLE to ContributionManager...");
  tx = await (launchpadStorage as any).grantModuleRole(
    deployedContracts.contributionManager
  );
  await tx.wait?.();
  log(`✅ MODULE_ROLE granted to ContributionManager`, colors.green);

  log("→ Granting MODULE_ROLE to VestingManager...");
  tx = await (launchpadStorage as any).grantModuleRole(
    deployedContracts.vestingManager
  );
  await tx.wait?.();
  log(`✅ MODULE_ROLE granted to VestingManager`, colors.green);

  log("→ Granting MODULE_ROLE to GraduationManager...");
  tx = await (launchpadStorage as any).grantModuleRole(
    deployedContracts.graduationManager
  );
  await tx.wait?.();
  log(`✅ MODULE_ROLE granted to GraduationManager`, colors.green);

  // 3.2 Set modules in LaunchpadManager
  logSubSection("3.2 Configuring modules in LaunchpadManager");

  log("→ Setting modules...");
  tx = await (launchpadManager as any).setModules(
    deployedContracts.contributionManager,
    deployedContracts.vestingManager,
    deployedContracts.graduationManager
  );
  await tx.wait?.();
  log(`✅ Modules configured in LaunchpadManager`, colors.green);

  // 3.3 Set LaunchpadManager reference in each module
  logSubSection("3.3 Setting LaunchpadManager in modules");

  log("→ Setting LaunchpadManager in ContributionManager...");
  tx = await (contributionManager as any).setLaunchpadManager(
    deployedContracts.launchpadManager
  );
  await tx.wait?.();
  log(`✅ LaunchpadManager set in ContributionManager`, colors.green);

  log("→ Setting LaunchpadManager in VestingManager...");
  tx = await (vestingManager as any).setLaunchpadManager(
    deployedContracts.launchpadManager
  );
  await tx.wait?.();
  log(`✅ LaunchpadManager set in VestingManager`, colors.green);

  log("→ Setting LaunchpadManager in GraduationManager...");
  tx = await (graduationManager as any).setLaunchpadManager(
    deployedContracts.launchpadManager
  );
  await tx.wait?.();
  log(`✅ LaunchpadManager set in GraduationManager`, colors.green);

  // 3.4 Grant MANAGER_ROLE on BondingCurveDEX
  logSubSection("3.4 Setting up BondingCurveDEX roles");

  log("→ Granting MANAGER_ROLE to LaunchpadManager on BondingCurveDEX...");
  const MANAGER_ROLE: string =
    (typeof (bondingCurveDEX as any).MANAGER_ROLE === "function"
      ? await (bondingCurveDEX as any).MANAGER_ROLE()
      : (bondingCurveDEX as any).MANAGER_ROLE) ?? "";
  if (MANAGER_ROLE) {
    tx = await (bondingCurveDEX as any).grantRole(
      MANAGER_ROLE,
      deployedContracts.launchpadManager
    );
    await tx.wait?.();
    log(`✅ MANAGER_ROLE granted to LaunchpadManager`, colors.green);
  }

  // 3.5 Grant MANAGER_ROLE on LPFeeHarvester
  logSubSection("3.5 Setting up LPFeeHarvester roles");

  log("→ Granting MANAGER_ROLE to LaunchpadManager on LPFeeHarvester...");
  const HARVESTER_MANAGER_ROLE: string =
    (typeof (lpFeeHarvester as any).MANAGER_ROLE === "function"
      ? await (lpFeeHarvester as any).MANAGER_ROLE()
      : (lpFeeHarvester as any).MANAGER_ROLE) ?? "";
  if (HARVESTER_MANAGER_ROLE) {
    tx = await (lpFeeHarvester as any).grantRole(
      HARVESTER_MANAGER_ROLE,
      deployedContracts.launchpadManager
    );
    await tx.wait?.();
    log(`✅ MANAGER_ROLE granted to LaunchpadManager`, colors.green);

    log("→ Granting MANAGER_ROLE to GraduationManager on LPFeeHarvester...");
    tx = await (lpFeeHarvester as any).grantRole(
      HARVESTER_MANAGER_ROLE,
      deployedContracts.graduationManager
    );
    await tx.wait?.();
    log(`✅ MANAGER_ROLE granted to GraduationManager`, colors.green);
  }

  // ============================================
  // PHASE 4: VERIFICATION
  // ============================================
  logSection("✅ PHASE 4: VERIFICATION");

  // Verify MODULE_ROLE on Storage
  const MODULE_ROLE: string =
    (typeof (launchpadStorage as any).MODULE_ROLE === "function"
      ? await (launchpadStorage as any).MODULE_ROLE()
      : (launchpadStorage as any).MODULE_ROLE) ?? "";

  const verifications = [
    {
      name: "LaunchpadManager has MODULE_ROLE on Storage",
      check: await (launchpadStorage as any).hasRole?.(
        MODULE_ROLE,
        deployedContracts.launchpadManager
      ),
    },
    {
      name: "ContributionManager has MODULE_ROLE on Storage",
      check: await (launchpadStorage as any).hasRole?.(
        MODULE_ROLE,
        deployedContracts.contributionManager
      ),
    },
    {
      name: "VestingManager has MODULE_ROLE on Storage",
      check: await (launchpadStorage as any).hasRole?.(
        MODULE_ROLE,
        deployedContracts.vestingManager
      ),
    },
    {
      name: "GraduationManager has MODULE_ROLE on Storage",
      check: await (launchpadStorage as any).hasRole?.(
        MODULE_ROLE,
        deployedContracts.graduationManager
      ),
    },
    {
      name: "LaunchpadManager has MANAGER_ROLE on BondingCurveDEX",
      check: await (bondingCurveDEX as any).hasRole?.(
        MANAGER_ROLE,
        deployedContracts.launchpadManager
      ),
    },
    {
      name: "LaunchpadManager has MANAGER_ROLE on LPFeeHarvester",
      check: await (lpFeeHarvester as any).hasRole?.(
        HARVESTER_MANAGER_ROLE,
        deployedContracts.launchpadManager
      ),
    },
    {
      name: "GraduationManager has MANAGER_ROLE on LPFeeHarvester",
      check: await (lpFeeHarvester as any).hasRole?.(
        HARVESTER_MANAGER_ROLE,
        deployedContracts.graduationManager
      ),
    },
  ];

  for (const v of verifications) {
    log(`${v.check ? "✅" : "❌"} ${v.name}`, v.check ? colors.green : colors.red);
  }

  // ============================================
  // DEPLOYMENT SUMMARY
  // ============================================
  logSection("🎉 DEPLOYMENT COMPLETE!");

  console.log("\n📝 CONTRACT ADDRESSES:");
  console.log("━".repeat(60));

  // Core Infrastructure
  log("\n🔧 Core Infrastructure:", colors.bright);
  log(`  priceOracle          : ${deployedContracts.priceOracle}`, colors.cyan);
  log(`  tokenFactory         : ${deployedContracts.tokenFactory}`, colors.cyan);
  log(`  lpFeeHarvester       : ${deployedContracts.lpFeeHarvester}`, colors.cyan);
  log(`  bondingCurveDEX      : ${deployedContracts.bondingCurveDEX}`, colors.cyan);
  log(`  raisedFundsTimelock  : ${deployedContracts.raisedFundsTimelock}`, colors.cyan);

  // Modular Launchpad
  log("\n📦 Modular Launchpad:", colors.bright);
  log(`  launchpadStorage     : ${deployedContracts.launchpadStorage}`, colors.magenta);
  log(`  launchpadManager     : ${deployedContracts.launchpadManager}`, colors.magenta);
  log(`  contributionManager  : ${deployedContracts.contributionManager}`, colors.magenta);
  log(`  vestingManager       : ${deployedContracts.vestingManager}`, colors.magenta);
  log(`  graduationManager    : ${deployedContracts.graduationManager}`, colors.magenta);

  console.log("\n🔗 BLOCK EXPLORERS:");
  console.log("━".repeat(60));
  const explorerBase: string =
    networkName === "bsc"
      ? "https://bscscan.com/address/"
      : "https://testnet.bscscan.com/address/";

  Object.entries(deployedContracts).forEach(([name, address]) => {
    console.log(`${name.padEnd(25)} : ${explorerBase}${address}`);
  });

  // ============================================
  // SAVE DEPLOYMENT INFO
  // ============================================
  logSection("💾 Saving Deployment Info");

  const deploymentInfo = {
    network: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: deployedContracts,
    config: config,
    architecture: "modular-v3.1.0",
    modules: {
      storage: deployedContracts.launchpadStorage,
      orchestrator: deployedContracts.launchpadManager,
      contribution: deployedContracts.contributionManager,
      vesting: deployedContracts.vestingManager,
      graduation: deployedContracts.graduationManager,
    },
  };

  const filename: string = `deployments/${networkName}-modular-${Date.now()}.json`;
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  log(`✅ Deployment info saved to: ${filename}`, colors.green);

  // ============================================
  // VERIFICATION COMMANDS
  // ============================================
  logSection("🔍 Contract Verification Commands");

  console.log("\nRun these commands to verify on BSCScan:\n");

  // Core contracts
  log("# Core Infrastructure", colors.yellow);
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.priceOracle} "${config.priceFeed}"`,
    colors.cyan
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.tokenFactory}`,
    colors.cyan
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.lpFeeHarvester} "${config.pancakeRouter}" "${config.pancakeFactory}" "${config.platformFeeAddress}" "${config.adminAddress}"`,
    colors.cyan
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.bondingCurveDEX} "${config.platformFeeAddress}" "${config.academyFeeAddress}" "${config.infoFiAddress}" "${deployedContracts.priceOracle}" "${config.adminAddress}" "${config.pancakeRouter}" "${config.pancakeFactory}" "${deployedContracts.lpFeeHarvester}"`,
    colors.cyan
  );

  // Modular contracts
  log("\n# Modular Launchpad", colors.yellow);
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.launchpadStorage} "${config.adminAddress}"`,
    colors.magenta
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.launchpadManager} "${deployedContracts.launchpadStorage}" "${deployedContracts.tokenFactory}" "${deployedContracts.bondingCurveDEX}" "${config.pancakeRouter}" "${deployedContracts.lpFeeHarvester}" "${config.infoFiAddress}" "${config.platformFeeAddress}"`,
    colors.magenta
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.contributionManager} "${deployedContracts.launchpadStorage}" "${deployedContracts.launchpadManager}"`,
    colors.magenta
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.vestingManager} "${deployedContracts.launchpadStorage}" "${deployedContracts.launchpadManager}" "${config.pancakeFactory}" "${deployedContracts.raisedFundsTimelock}" "${config.wbnbAddress}" "${config.platformFeeAddress}"`,
    colors.magenta
  );
  log(
    `npx hardhat verify --network ${networkName} ${deployedContracts.graduationManager} "${deployedContracts.launchpadStorage}" "${deployedContracts.launchpadManager}" "${config.pancakeRouter}" "${config.pancakeFactory}" "${deployedContracts.bondingCurveDEX}" "${deployedContracts.lpFeeHarvester}" "${config.infoFiAddress}" "${config.platformFeeAddress}"`,
    colors.magenta
  );

  // ============================================
  // FRONTEND CONFIG
  // ============================================
  logSection("🌐 Frontend Configuration");

  const frontendConfig = {
    // Main entry points
    LAUNCHPAD_MANAGER: deployedContracts.launchpadManager,
    CONTRIBUTION_MANAGER: deployedContracts.contributionManager,
    VESTING_MANAGER: deployedContracts.vestingManager,
    GRADUATION_MANAGER: deployedContracts.graduationManager,
    BONDING_CURVE_DEX: deployedContracts.bondingCurveDEX,
    
    // Read-only
    LAUNCHPAD_STORAGE: deployedContracts.launchpadStorage,
    PRICE_ORACLE: deployedContracts.priceOracle,
    
    // External
    PANCAKE_ROUTER: config.pancakeRouter,
    PANCAKE_FACTORY: config.pancakeFactory,
  };

  console.log("\nAdd to your frontend .env or config:\n");
  Object.entries(frontendConfig).forEach(([key, value]) => {
    log(`NEXT_PUBLIC_${key}=${value}`, colors.cyan);
  });

  // ============================================
  // NEXT STEPS
  // ============================================
  logSection("📚 NEXT STEPS");

  console.log(`
1. ✅ Verify all contracts on BSCScan (commands above)
2. 🔐 Transfer admin roles to multisig if needed
3. 🧪 Test flow on testnet:
   - Create a PROJECT_RAISE launch via LaunchpadManager
   - Contribute via ContributionManager
   - Complete raise and graduate via GraduationManager
   - Claim tokens/funds via VestingManager
4. 🌐 Update frontend with new contract addresses
5. 📊 Set up monitoring for all module contracts
6. 🎨 Update documentation

💡 TIP: The modular architecture allows you to upgrade individual 
   modules without redeploying everything!
  `);

  logSection("✨ DEPLOYMENT SCRIPT FINISHED");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });