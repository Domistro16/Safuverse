import type { DeployFunction } from 'hardhat-deploy/types'
import { namehash } from '../../node_modules/viem/_types'

const func: DeployFunction = async function (hre) {
  const { viem } = hre

  const { owner } = await viem.getNamedClients()

  const registry = await viem.getContract('ENSRegistry', owner)
  const nameWrapper = await viem.getContract('NameWrapper')
  const controller = await viem.getContract('ETHRegistrarController')
  const reverseRegistrar = await viem.getContract('ReverseRegistrar', owner)

  const publicResolverDeployment = await viem.deploy('PublicResolver', [
    registry.address,
    nameWrapper.address,
    controller.address,
    reverseRegistrar.address,
  ])
  if (!publicResolverDeployment.newlyDeployed) return

  const reverseRegistrarSetDefaultResolverHash =
    await reverseRegistrar.write.setDefaultResolver([
      publicResolverDeployment.address,
    ])
  console.log(
    `Setting default resolver on ReverseRegistrar to PublicResolver (tx: ${reverseRegistrarSetDefaultResolverHash})...`,
  )
  await viem.waitForTransactionSuccess(reverseRegistrarSetDefaultResolverHash)

  const resolverEthOwner = await registry.read.owner([
    namehash('resolver.safu'),
  ])

  if (resolverEthOwner === owner.address) {
    const publicResolver = await viem.getContract('PublicResolver', owner)
    const setResolverHash = await registry.write.setResolver([
      namehash('resolver.safu'),
      publicResolver.address,
    ])
    console.log(
      `Setting resolver for resolver.safu to PublicResolver (tx: ${setResolverHash})...`,
    )
    await viem.waitForTransactionSuccess(setResolverHash)

    const setAddrHash = await publicResolver.write.setAddr([
      namehash('resolver.safu'),
      publicResolver.address,
    ])
    console.log(
      `Setting address for resolver.safu to PublicResolver (tx: ${setAddrHash})...`,
    )
    await viem.waitForTransactionSuccess(setAddrHash)
  } else {
    console.log(
      'resolver.safu is not owned by the owner address, not setting resolver',
    )
  }
}

func.id = 'resolver'
func.tags = ['resolvers', 'PublicResolver']
func.dependencies = [
  'registry',
  'ETHRegistrarController',
  'NameWrapper',
  'ReverseRegistrar',
]

export default func
