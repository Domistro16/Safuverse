import type { DeployFunction } from 'hardhat-deploy/types'
import type { Address } from 'viem'

const func: DeployFunction = async function (hre) {
  const { network, viem } = hre

  let oracleAddress: Address
  let cakeAddress: Address
  let usd1Address: Address

  if (network.tags.test) {
    // Deploy DummyOracle instances for test networks (baseSepolia, testnet, etc.)
    // ETH/USD price: $2500 (8 decimals)
    const dummyUsdOracle = await viem.deploy('DummyOracle', [250000000000n])
    // CAKE/USD price: $2.50 (8 decimals)
    const dummyCakeOracle = await viem.deploy('DummyCakeOracle', [250000000n], {
      artifact: await hre.deployments.getArtifact('DummyOracle'),
    })
    // USD1/USD price: $1.00 (8 decimals)
    const dummyUsd1Oracle = await viem.deploy('DummyUsd1Oracle', [100000000n], {
      artifact: await hre.deployments.getArtifact('DummyOracle'),
    })

    oracleAddress = dummyUsdOracle.address as Address
    cakeAddress = dummyCakeOracle.address as Address
    usd1Address = dummyUsd1Oracle.address as Address
  } else {
    // BSC mainnet Chainlink feeds
    oracleAddress = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'
    cakeAddress = '0xB6064eD41d4f67e353768aA239cA86f4F73665a1'
    usd1Address = '0xaD8b4e59A7f25B68945fAf0f3a3EAF027832FFB0'
  }

  await viem.deploy('TokenPriceOracle', [
    oracleAddress,
    cakeAddress,
    usd1Address,
    [0n, 3170979198377n, 1585489599188n, 792744799594n, 317097919838n],
    100000000000000000000000000n,
    21n,
  ])
}

func.id = 'price-oracle'
func.tags = ['ethregistrar', 'TokenPriceOracle', 'DummyOracle']
func.dependencies = ['registry']

export default func
