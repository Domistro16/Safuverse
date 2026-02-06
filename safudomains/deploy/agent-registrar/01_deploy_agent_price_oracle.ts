import type { DeployFunction } from 'hardhat-deploy/types.js'

const func: DeployFunction = async function (hre) {
    const { viem } = hre

    const { deployer, owner } = await viem.getNamedClients()

    const priceOracleDeployment = await viem.deploy('AgentPriceOracle', [process.env.PRICE_ORACLE as `0x${string}`])
    if (!priceOracleDeployment.newlyDeployed) return

    const priceOracle = await viem.getContract('AgentPriceOracle')

    // Transfer ownership if deployer is not the owner
    if (owner.address !== deployer.address) {
        const hash = await priceOracle.write.transferOwnership([owner.address])
        console.log(
            `Transferring ownership of AgentPriceOracle to ${owner.address} (tx: ${hash})...`,
        )
        await viem.waitForTransactionSuccess(hash)
    }

    console.log(`AgentPriceOracle deployed at ${priceOracle.address}`)
}

func.id = 'agent-price-oracle'
func.tags = ['agent', 'AgentPriceOracle']
func.dependencies = []

export default func
