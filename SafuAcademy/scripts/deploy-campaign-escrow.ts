import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const owner = process.env.OWNER_ADDRESS || process.env.RELAYER_WALLET_ADDRESS;
  if (!owner || !ethers.isAddress(owner)) {
    throw new Error("Valid OWNER_ADDRESS is required.");
  }

  const CampaignEscrow = await ethers.getContractFactory("CampaignEscrow");
  const escrow = await CampaignEscrow.deploy(owner);
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("CampaignEscrow deployed:", address);
  console.log("Owner:", owner);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
