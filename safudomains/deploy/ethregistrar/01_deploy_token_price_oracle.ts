import type { DeployFunction } from 'hardhat-deploy/types'
import type { Address } from 'viem'
import { parseUnits } from 'viem'

const func: DeployFunction = async function (hre) {
  const { network, viem } = hre

  let oracleAddress: Address = '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE'
  let cakeAddress: Address = '0xB6064eD41d4f67e353768aA239cA86f4F73665a1'
  let usd1Address: Address = '0xaD8b4e59A7f25B68945fAf0f3a3EAF027832FFB0'

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
