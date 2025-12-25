import hre from 'hardhat'
import {
  Address,
  Hex,
  zeroAddress,
} from 'viem'
import { EnsStack } from './deployEnsFixture.js'

export type Mutable<T> = {
  -readonly [K in keyof T]: Mutable<T[K]>
}

type RegisterNameOptions = {
  label: string
  ownerAddress?: Address
  duration?: bigint
  secret?: Hex
  resolverAddress?: Address
  data?: Hex[]
  shouldSetReverseRecord?: boolean
  ownerControlledFuses?: number
  lifetime?: boolean
  referree?: string
}

export const getDefaultRegistrationOptions = async ({
  label,
  ownerAddress,
  duration,
  secret,
  resolverAddress,
  data,
  shouldSetReverseRecord,
  ownerControlledFuses,
  lifetime,
  referree,
}: RegisterNameOptions) => ({
  label,
  ownerAddress: await (async () => {
    if (ownerAddress) return ownerAddress
    const [deployer] = await hre.viem.getWalletClients()
    return deployer.account.address
  })(),
  duration: duration ?? BigInt(60 * 60 * 24 * 365),
  secret:
    secret ??
    '0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF',
  resolverAddress: resolverAddress ?? zeroAddress,
  data: data ?? [],
  shouldSetReverseRecord: shouldSetReverseRecord ?? false,
  ownerControlledFuses: ownerControlledFuses ?? 0,
  lifetime: lifetime ?? false,
  referree: referree ?? '',
})

export const getRegisterNameParameterArray = ({
  label,
  ownerAddress,
  duration,
  secret,
  resolverAddress,
  data,
  shouldSetReverseRecord,
  ownerControlledFuses,
  lifetime,
  referree,
}: Required<RegisterNameOptions>) => {
  const immutable = [
    label,
    ownerAddress,
    duration,
    secret,
    resolverAddress,
    data,
    shouldSetReverseRecord,
    ownerControlledFuses,
    lifetime,
    referree,
  ] as const
  return immutable as Mutable<typeof immutable>
}

export const commitName = async (
  { ethRegistrarController }: Pick<EnsStack, 'ethRegistrarController'>,
  params_: RegisterNameOptions,
) => {
  const params = await getDefaultRegistrationOptions(params_)
  const args = getRegisterNameParameterArray(params)

  const testClient = await hre.viem.getTestClient()
  const [deployer] = await hre.viem.getWalletClients()

  // makeCommitment takes 9 params (without referree), while register takes 10 params
  const commitmentArgs = args.slice(0, 9) as [
    string,
    `0x${string}`,
    bigint,
    `0x${string}`,
    `0x${string}`,
    readonly `0x${string}`[],
    boolean,
    number,
    boolean,
  ]
  const commitmentHash = await ethRegistrarController.read.makeCommitment(
    commitmentArgs,
  )
  await ethRegistrarController.write.commit([commitmentHash], {
    account: deployer.account,
  })
  const minCommitmentAge = await ethRegistrarController.read.minCommitmentAge()
  await testClient.increaseTime({ seconds: Number(minCommitmentAge) })
  await testClient.mine({ blocks: 1 })

  return {
    params,
    args,
    hash: commitmentHash,
  }
}

export const registerName = async (
  { ethRegistrarController }: Pick<EnsStack, 'ethRegistrarController'>,
  params_: RegisterNameOptions,
) => {
  const params = await getDefaultRegistrationOptions(params_)
  const args = getRegisterNameParameterArray(params)
  const { label, duration, lifetime } = params

  const testClient = await hre.viem.getTestClient()
  const [deployer] = await hre.viem.getWalletClients()

  // makeCommitment takes 9 params (without referree), while register takes 10 params
  const commitmentArgs = args.slice(0, 9) as [
    string,
    `0x${string}`,
    bigint,
    `0x${string}`,
    `0x${string}`,
    readonly `0x${string}`[],
    boolean,
    number,
    boolean,
  ]
  const commitmentHash = await ethRegistrarController.read.makeCommitment(
    commitmentArgs,
  )
  await ethRegistrarController.write.commit([commitmentHash], {
    account: deployer.account,
  })
  const minCommitmentAge = await ethRegistrarController.read.minCommitmentAge()
  await testClient.increaseTime({ seconds: Number(minCommitmentAge) })
  await testClient.mine({ blocks: 1 })

  const value = await ethRegistrarController.read
    .rentPrice([label, duration, lifetime])
    .then(({ base, premium }) => base + premium)

  await ethRegistrarController.write.register(args, {
    value,
    account: deployer.account,
  })
}
