// scripts/deploy-updated.ts
// Deploys ONLY the contracts affected by the token distribution refactor
// Uses existing contract addresses for unchanged contracts
import { network } from "hardhat";

const { ethers } = await network.connect();
import fs from "fs";

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

async function main(): Promise<void> {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const deployerAddress: string = await deployer.getAddress();

    const networkName: string =
        (network as any).name ??
        String((await ethers.provider.getNetwork()).chainId ?? "local");

    logSection("🚀 DEPLOY UPDATED CONTRACTS ONLY");
    log(`Deploying from: ${deployerAddress}`, colors.green);
    log(`Network: ${networkName}`, colors.blue);

    // ============================================
    // EXISTING CONTRACT ADDRESSES - UPDATE THESE
    // ============================================
    const existing = {
        // Unchanged contracts - paste your existing addresses here
        priceOracle: "0x0f452bE1BE3cefE23Bfe2D1f1831b83073471699",          // PriceOracle - no changes
        tokenFactory: "0xFd66bB7a03F911302f807d0CEFdEfb7eE88b385a",       // TokenFactoryV2 - no changes
        bondingCurveDEX: "0x4647a56f1B1624443fC084aE4A54208889495874",      // BondingCurveDEX - no changes
        raisedFundsTimelock: "0x87A3899B876B59Be4Bc7552904712FcA6e5eB796",  // RaisedFundsTimelock - no changes

        // External addresses
        pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
        pancakeFactory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
        wbnbAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        platformFeeAddress: "0x235799785E387C2612d4A881919436B612ed391D",
        academyFeeAddress: "0x235799785E387C2612d4A881919436B612ed391D",
        infoFiAddress: "0x235799785E387C2612d4A881919436B612ed391D",
        adminAddress: deployerAddress,
    };

    logSection("📋 EXISTING CONTRACTS (Not Redeployed)");
    log(`  priceOracle       : ${existing.priceOracle}`, colors.yellow);
    log(`  tokenFactory      : ${existing.tokenFactory}`, colors.yellow);
    log(`  bondingCurveDEX   : ${existing.bondingCurveDEX}`, colors.yellow);
    log(`  raisedFundsTimelock: ${existing.raisedFundsTimelock}`, colors.yellow);

    const deployed: Record<string, string> = {};
    let tx;

    // ============================================
    // DEPLOY CHANGED CONTRACTS
    // ============================================
    logSection("📦 DEPLOYING CHANGED CONTRACTS");

    // 1. LaunchpadStorage (new constants)
    log("\n→ Deploying LaunchpadStorage (new distribution constants)...");
    const LaunchpadStorage = await ethers.getContractFactory("LaunchpadStorage");
    const launchpadStorage = await LaunchpadStorage.deploy(existing.adminAddress);
    await launchpadStorage.waitForDeployment();
    deployed.launchpadStorage = await launchpadStorage.getAddress();
    log(`✅ LaunchpadStorage: ${deployed.launchpadStorage}`, colors.green);

    // 2. LPFeeHarvester (new constructor: launchpadStorage + academyAddress)
    log("\n→ Deploying LPFeeHarvester (30-day cooldown, academy routing)...");
    const LPFeeHarvester = await ethers.getContractFactory("LPFeeHarvester");
    const lpFeeHarvester = await LPFeeHarvester.deploy(
        existing.pancakeRouter,
        existing.pancakeFactory,
        deployed.launchpadStorage,      // NEW param
        existing.platformFeeAddress,
        existing.academyFeeAddress,     // NEW param
        existing.adminAddress
    );
    await lpFeeHarvester.waitForDeployment();
    deployed.lpFeeHarvester = await lpFeeHarvester.getAddress();
    log(`✅ LPFeeHarvester: ${deployed.lpFeeHarvester}`, colors.green);

    // 3. LaunchpadManagerV3 (365-day vesting, 20% immediate)
    log("\n→ Deploying LaunchpadManagerV3 (365-day vesting)...");
    const LaunchpadManagerV3 = await ethers.getContractFactory("LaunchpadManagerV3");
    const launchpadManager = await LaunchpadManagerV3.deploy(
        deployed.launchpadStorage,
        existing.tokenFactory,
        existing.bondingCurveDEX,
        existing.pancakeRouter,
        existing.priceOracle,
        existing.infoFiAddress,
        existing.platformFeeAddress,
        deployed.lpFeeHarvester,
        existing.pancakeFactory
    );
    await launchpadManager.waitForDeployment();
    deployed.launchpadManager = await launchpadManager.getAddress();
    log(`✅ LaunchpadManagerV3: ${deployed.launchpadManager}`, colors.green);

    // 4. ContributionManager (needs new storage)
    log("\n→ Deploying ContributionManager...");
    const ContributionManager = await ethers.getContractFactory("ContributionManager");
    const contributionManager = await ContributionManager.deploy(deployed.launchpadStorage);
    await contributionManager.waitForDeployment();
    deployed.contributionManager = await contributionManager.getAddress();
    log(`✅ ContributionManager: ${deployed.contributionManager}`, colors.green);

    // 5. VestingManager (market cap check)
    log("\n→ Deploying VestingManager (market cap gated)...");
    const VestingManager = await ethers.getContractFactory("VestingManager");
    const vestingManager = await VestingManager.deploy(
        deployed.launchpadStorage,
        existing.pancakeFactory,
        existing.wbnbAddress
    );
    await vestingManager.waitForDeployment();
    deployed.vestingManager = await vestingManager.getAddress();
    log(`✅ VestingManager: ${deployed.vestingManager}`, colors.green);

    // 6. GraduationManager (needs new storage + harvester)
    log("\n→ Deploying GraduationManager...");
    const GraduationManager = await ethers.getContractFactory("GraduationManager");
    const graduationManager = await GraduationManager.deploy(
        deployed.launchpadStorage,
        existing.pancakeRouter,
        existing.pancakeFactory,
        existing.bondingCurveDEX,
        deployed.lpFeeHarvester,
        existing.infoFiAddress,
        existing.platformFeeAddress
    );
    await graduationManager.waitForDeployment();
    deployed.graduationManager = await graduationManager.getAddress();
    log(`✅ GraduationManager: ${deployed.graduationManager}`, colors.green);

    // ============================================
    // CONFIGURE MODULES
    // ============================================
    logSection("🔐 CONFIGURING MODULES");

    // Grant MODULE_ROLE on LaunchpadStorage
    log("\n→ Granting MODULE_ROLE on LaunchpadStorage...");
    tx = await launchpadStorage.grantModuleRole(deployed.launchpadManager);
    await tx.wait();
    tx = await launchpadStorage.grantModuleRole(deployed.contributionManager);
    await tx.wait();
    tx = await launchpadStorage.grantModuleRole(deployed.vestingManager);
    await tx.wait();
    tx = await launchpadStorage.grantModuleRole(deployed.graduationManager);
    await tx.wait();
    log("✅ MODULE_ROLE granted to all modules", colors.green);

    // Set modules in LaunchpadManager
    log("\n→ Setting modules in LaunchpadManager...");
    tx = await launchpadManager.setModules(
        deployed.contributionManager,
        deployed.vestingManager,
        deployed.graduationManager
    );
    await tx.wait();
    log("✅ Modules set in LaunchpadManager", colors.green);

    // Set LaunchpadManager in each module
    log("\n→ Setting LaunchpadManager reference in modules...");
    tx = await contributionManager.setLaunchpadManager(deployed.launchpadManager);
    await tx.wait();
    tx = await vestingManager.setLaunchpadManager(deployed.launchpadManager);
    await tx.wait();
    tx = await graduationManager.setLaunchpadManager(deployed.launchpadManager);
    await tx.wait();
    log("✅ LaunchpadManager set in all modules", colors.green);

    // Grant MANAGER_ROLE on LPFeeHarvester
    log("\n→ Granting MANAGER_ROLE on LPFeeHarvester...");
    const MANAGER_ROLE = await lpFeeHarvester.MANAGER_ROLE();
    tx = await lpFeeHarvester.grantRole(MANAGER_ROLE, deployed.launchpadManager);
    await tx.wait();
    tx = await lpFeeHarvester.grantRole(MANAGER_ROLE, deployed.graduationManager);
    await tx.wait();
    log("✅ MANAGER_ROLE granted on LPFeeHarvester", colors.green);

    // Grant MANAGER_ROLE on existing BondingCurveDEX
    log("\n→ Granting MANAGER_ROLE on existing BondingCurveDEX...");
    const bondingCurveDEX = await ethers.getContractAt("BondingCurveDEX", existing.bondingCurveDEX);
    const DEX_MANAGER_ROLE = await bondingCurveDEX.MANAGER_ROLE();
    tx = await bondingCurveDEX.grantRole(DEX_MANAGER_ROLE, deployed.launchpadManager);
    await tx.wait();
    log("✅ MANAGER_ROLE granted on BondingCurveDEX", colors.green);

    // ============================================
    // SUMMARY
    // ============================================
    logSection("🎉 DEPLOYMENT COMPLETE!");

    console.log("\n📝 NEW CONTRACT ADDRESSES:");
    console.log("━".repeat(60));
    for (const [name, address] of Object.entries(deployed)) {
        log(`  ${name.padEnd(22)}: ${address}`, colors.cyan);
    }

    // Save deployment
    const deploymentInfo = {
        network: networkName,
        timestamp: new Date().toISOString(),
        deployed,
        existing,
    };
    const filename = `deployments/${networkName}-updated-${Date.now()}.json`;
    fs.mkdirSync("deployments", { recursive: true });
    fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
    log(`\n✅ Saved to: ${filename}`, colors.green);

    logSection("✨ DONE");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
