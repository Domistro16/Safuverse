import { ethers } from 'hardhat'
import 'dotenv/config'

async function main() {
  const owner =
    process.env.OWNER_ADDRESS || '0xD83deFbA240568040b39bb2C8B4DB7dB02d40593'
  const relayerWallet =
    process.env.RELAYER_WALLET_ADDRESS || owner

  if (!ethers.isAddress(owner)) {
    throw new Error(`Invalid OWNER_ADDRESS: ${owner}`)
  }
  if (!ethers.isAddress(relayerWallet)) {
    throw new Error(`Invalid RELAYER_WALLET_ADDRESS: ${relayerWallet}`)
  }

  // Deploy NexIDCampaigns
  const NexID = await ethers.getContractFactory('NexIDCampaigns')
  const nexid = await NexID.deploy(owner)
  await nexid.waitForDeployment()
  const nexidAddr = await nexid.getAddress()
  console.log('NexIDCampaigns deployed to:', nexidAddr)

  const relayerTx1 = await nexid.setRelayer(relayerWallet)
  await relayerTx1.wait()
  console.log('NexIDCampaigns relayer set:', relayerWallet)

  // Deploy PartnerCampaigns
  const Partner = await ethers.getContractFactory('PartnerCampaigns')
  const partner = await Partner.deploy(owner)
  await partner.waitForDeployment()
  const partnerAddr = await partner.getAddress()
  console.log('PartnerCampaigns deployed to:', partnerAddr)

  const relayerTx2 = await partner.setRelayer(relayerWallet)
  await relayerTx2.wait()
  console.log('PartnerCampaigns relayer set:', relayerWallet)

  console.log('\n--- Deployment Summary ---')
  console.log('Owner:', owner)
  console.log('Relayer:', relayerWallet)
  console.log('NexIDCampaigns:', nexidAddr)
  console.log('PartnerCampaigns:', partnerAddr)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
