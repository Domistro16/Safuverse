import { ethers } from 'hardhat'
import 'dotenv/config'

async function main() {
  const owner =
    process.env.OWNER_ADDRESS || '0xD83deFbA240568040b39bb2C8B4DB7dB02d40593'
  const relayerWallet =
    process.env.RELAYER_WALLET_ADDRESS ||
    owner

  if (!ethers.isAddress(owner)) {
    throw new Error(`Invalid OWNER_ADDRESS: ${owner}`)
  }
  if (!ethers.isAddress(relayerWallet)) {
    throw new Error(`Invalid RELAYER_WALLET_ADDRESS: ${relayerWallet}`)
  }

  const Contract = await ethers.getContractFactory('Level3Course')
  const reverseAddress =
    process.env.REVERSE_REGISTRAR_ADDRESS ||
    '0x38171C9Dc51c5F9b2Be96b8fde3D0CA8C6050eAA'
  const registry =
    process.env.ENS_REGISTRY_ADDRESS ||
    '0xA590B208e7F2e62a3987424D2E1b00cd62986fAd'
  const contract = await Contract.deploy(reverseAddress, owner, registry)
  await contract.waitForDeployment()
  const course = await contract.getAddress()

  console.log('Level3 Course Contract deployed to address:', course)
  console.log('Owner:', owner)
  console.log('Relayer wallet:', relayerWallet)

  const relayerTx = await contract.setRelayer(relayerWallet)
  await relayerTx.wait()
  console.log('Relayer set:', relayerWallet, relayerTx.hash)
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
