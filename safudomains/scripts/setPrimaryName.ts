import hre from 'hardhat'
import { namehash } from 'viem'
async function main() {
  const { viem } = hre

  const { deployer } = await viem.getNamedClients()

  const reverseRegistrar = await viem.getContract('ReverseRegistrar', deployer)
  const resolver = await viem.getContract('PublicResolver', deployer)
  const setPrimaryNameHash = await reverseRegistrar.write.setNameForAddr([
    '0xD83deFbA240568040b39bb2C8B4DB7dB02d40593',
    '0xD83deFbA240568040b39bb2C8B4DB7dB02d40593',
    resolver.address,
    'domistro.id',
  ])
  console.log(
    `Setting primary name for ${'0x95c1a272b5bb421272a445c301a6e3ad764ce07a'} to admiano.id (tx: ${setPrimaryNameHash})...`,
  )
  await viem.waitForTransactionSuccess(setPrimaryNameHash)
}

main().then(() => process.exit(0))
