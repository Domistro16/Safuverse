import { ethers } from 'hardhat'
import 'dotenv/config'

async function main() {
  const owner =
    process.env.OWNER_ADDRESS || ''

  const Contract = await ethers.getContractFactory('Level3Course')
  const reverseAddress = '0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125'
  const registry = '0xa886B8897814193f99A88701d70b31b4a8E27a1E'
  const contract = await Contract.deploy(reverseAddress, owner, registry)
  const course = await contract.getAddress()

  console.log('Level3 Course Contract deployed to address:', course)

  const hash = await contract.setRelayer('0xf0748f74c20f1214a184ed49e28ad7cc7b0a403e');
  console.log(hash)
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
