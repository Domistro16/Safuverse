import { ethers } from 'hardhat'
import 'dotenv/config'

async function main() {
  const owner =
    process.env.OWNER_ADDRESS || '0x54b268AAB70C3Eda916C166D912ff8AB107c84fd'

  const Contract = await ethers.getContractFactory('Level3Course')
  const reverseAddress = '0x1D0831eA9486Fada3887a737E8d6f8C6Ad72a125'
  const registry = '0xa886B8897814193f99A88701d70b31b4a8E27a1E'
  const contract = await Contract.deploy(reverseAddress, owner, registry)
  const course = await contract.getAddress()

  console.log('Level3 Course Contract deployed to address:', course)
  const Factory = await ethers.getContractFactory('CourseFactory')
  const factory = await Factory.deploy(course, owner)
  await factory.waitForDeployment()
  const CourseFactory = await factory.getAddress()

  console.log('CourseFactory deployed to address:', CourseFactory)
  const tx = await contract.setCourseFactory(
    CourseFactory
  )
  console.log(`Added Course Factory, ${tx.hash}`)
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
