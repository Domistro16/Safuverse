import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { keccak256, namehash, toBytes, zeroAddress } from 'viem'
import { useReadContract } from 'wagmi'
import { useTextRecords } from '../hooks/getTextRecords'
import { useENSName } from '../hooks/getPrimaryName'
import { Switch } from '@headlessui/react'
import { useAccount } from 'wagmi'
import Update from './updateTextRecords'
import Renew from './renew'
import Unwrap from './unwrap'
import ChangeResolver from './changeResolver'
import Wrap from './wrap'
import { FastForwardIcon } from '@heroicons/react/solid'
import { Avatar } from './useAvatar'
import { RiTelegramFill } from 'react-icons/ri'
import { FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { IoMailSharp } from 'react-icons/io5'
import { FaRedditAlien } from 'react-icons/fa6'
import { IoLogoWhatsapp } from 'react-icons/io'
import { FaSnapchatGhost, FaGithub } from 'react-icons/fa'
import { SiBnbchain } from 'react-icons/si'
import { constants } from '../constant'
import ReferralProgress from '@/components/Refferal'
import DomainImage from './DomainImage'

const Referral = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
    ],
    name: 'totalNativeEarnings',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'referrer',
        type: 'address',
      },
    ],
    name: 'totalReferrals',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const resolveAbi = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'resolver',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const availableAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
    ],
    name: 'available',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const ensOwner = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const ownerOf = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const expiresAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'nameExpires',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const gExpiresAbi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'nameExpires',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const getData = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
    ],
    name: 'getData',
    outputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint32',
        name: 'fuses',
        type: 'uint32',
      },
      {
        internalType: 'uint64',
        name: 'expiry',
        type: 'uint64',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const isWrapped = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'isWrapped',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]
const addr = [
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32',
      },
    ],
    name: 'addr',
    outputs: [
      {
        internalType: 'address payable',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

function shortenAddress(address: string): string {
  if (address) {
    return `${address.slice(0, 4)}...${address.slice(-5).toUpperCase()}`
  } else {
    return '0x000...00000'
  }
}

const Resolve = () => {
  const { label } = useParams<string>()
  const [expiry, setExpiry] = useState('')
  const [expiryTime, setExpiryTime] = useState('')
  const [graceExpiry, setGraceExpiry] = useState('')
  const [graceExpiryTime, setGraceExpiryTime] = useState('')
  const [tab, setTab] = useState('profile')
  const [isOpen, setIsOpen] = useState(false)
  const { address: walletAddress } = useAccount()
  const accountKeys = [
    'com.twitter',
    'com.reddit',
    'com.github',
    'com.discord',
    'com.youtube',
    'org.telegram',
    'com.snapchat',
    'com.tiktok',
    'email',
  ]
  const otherKeys = ['phone', 'url', 'avatar']
  const textKeys = [
    'com.twitter',
    'com.reddit',
    'com.github',
    'com.discord',
    'email',
    'phone',
    'url',
    'avatar',
    'description',
    'com.youtube',
    'org.telegram',
    'com.snapchat',
    'com.tiktok',
  ]

  const node = namehash(`${label}.safu`)
  const id = keccak256(label as any)

  const { data: available, isLoading: availableLoading } = useReadContract({
    address: constants.Controller,
    abi: availableAbi,
    functionName: 'available',
    args: [label as string],
  })
  const { data: wrapped } = useReadContract({
    abi: isWrapped,
    functionName: 'isWrapped',
    address: constants.NameWrapper,
    args: [node],
  })
  const { data, isLoading: wLoading } = useReadContract({
    abi: getData,
    functionName: 'getData',
    address: constants.NameWrapper,
    args: [node],
  })
  const { data: referrals } = useReadContract({
    abi: Referral,
    functionName: 'totalReferrals',
    address: constants.Referral,
    args: [walletAddress],
  })
  const { data: expires, isLoading: expiryLoading } = useReadContract({
    abi: expiresAbi,
    functionName: 'nameExpires',
    address: constants.BaseRegistrar,
    args: [id],
  })
  const { data: gexpires, isLoading: graceLoading } = useReadContract({
    abi: gExpiresAbi,
    functionName: 'nameExpires',
    address: constants.BaseRegistrar,
    args: [id],
  })
  const { data: owner, isPending: ownerLoading } = useReadContract({
    abi: ownerOf,
    functionName: 'ownerOf',
    address: constants.NameWrapper,
    args: [id],
  })
  const { data: manager, isPending: managerLoading } = useReadContract({
    abi: ensOwner,
    functionName: 'owner',
    address: constants.Registry,
    args: [node],
  })

  const { data: resolverResponse, isPending: resolverLoading } =
    useReadContract({
      abi: resolveAbi,
      functionName: 'resolver',
      address: constants.Registry,
      args: [node],
    })
  const resolver = useMemo(() => {
    if (!resolverLoading && resolverResponse) {
      return resolverResponse as `0x${string}`
    } else {
      return '' as `0x${string}`
    }
  }, [resolverLoading, resolverResponse])

  const { data: address, isPending } = useReadContract({
    abi: addr,
    functionName: 'addr',
    address: resolver,
    args: [node],
  })
  const { records: others, isLoading: othersLoading } = useTextRecords({
    resolverAddress: resolver,
    name: `${label}.safu`,
    keys: otherKeys,
  })
  const { records: accounts, isLoading: accountsLoading } = useTextRecords({
    resolverAddress: resolver,
    name: `${label}.safu`,
    keys: accountKeys,
  })
  const { records: texts, isLoading: textsLoading } = useTextRecords({
    resolverAddress: resolver,
    name: `${label}.safu`,
    keys: textKeys,
  })
  const navigate = useNavigate()
  useEffect(() => {
    document.title = `${label}.safu`
  }, [label])
  useEffect(() => {
    if (label != undefined && label.includes('.')) {
      navigate('/')
    }
  }, [])
  useEffect(() => {
    if (available === true) {
      navigate('/register/' + label)
    } else if (available === false) {
      setNext(0)
    }
  }, [available, navigate])
  useEffect(() => {
    if (expires && gexpires) {
      const tsSeconds = Number(expires)
      const date = new Date(tsSeconds * 1000)
      setExpiry(
        date.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      )
      setExpiryTime(
        date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        }),
      )
      const tseSeconds = Number(gexpires)
      const gdate = new Date(tseSeconds * 1000)
      gdate.setDate(gdate.getDate() + 30)
      setGraceExpiry(
        gdate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      )
      setGraceExpiryTime(
        gdate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        }),
      )
    }
  }, [expires, gexpires])

  const wrappedOwner = useMemo(() => {
    const wrappedData = data as [string, string, bigint] | undefined
    if (wrappedData) {
      const [owner] = wrappedData || []
      return owner as string
    }
    return undefined // optional for clarity
  }, [data])

  const { name: primaryName } = useENSName({
    owner: (walletAddress as `0x${string}`) || zeroAddress,
  })
  const { name: wrappedOwnerName } = useENSName({
    owner: wrappedOwner as `0x${string}`,
  })

  const woname = useMemo(() => {
    if (wrappedOwnerName != undefined) {
      return wrappedOwnerName as string
    } else {
      return wrappedOwner as string
    }
  }, [wrappedOwnerName, wrappedOwner])
  const { name: ownerName } = useENSName({
    owner: owner as `0x${string}`,
  })
  const oname = useMemo(() => {
    if (ownerName != undefined) {
      return ownerName as string
    } else {
      return owner as string
    }
  }, [ownerName, owner])
  const { name: managerName } = useENSName({
    owner: manager as `0x${string}`,
  })
  const manname = useMemo(() => {
    if (managerName != undefined) {
      return managerName as string
    } else {
      return manager as string
    }
  }, [managerName, manager])

  const fuseMask = useMemo(() => {
    const wrappedData = data as [string, bigint, bigint] | undefined
    if (wrappedData) {
      const [, fuses] = wrappedData || []
      return fuses as bigint
    }
    return 0n // optional for clarity
  }, [data])

  // 1. Define the new constants
  const FUSES = {
    CANNOT_UNWRAP: 1 << 0, // 1
    CANNOT_BURN_FUSES: 1 << 1, // 2
    CANNOT_TRANSFER: 1 << 2, // 4
    CANNOT_SET_RESOLVER: 1 << 3, // 8
    CANNOT_SET_TTL: 1 << 4, // 16
    CANNOT_APPROVE: 1 << 6, // 64
  } as const

  // 2. After fetching `fuseMask` from NameWrapper.getFuses(node):
  const mask = Number(fuseMask)

  const perms = {
    canUnwrap: !(mask & FUSES.CANNOT_UNWRAP),
    canBurnFuses: !(mask & FUSES.CANNOT_BURN_FUSES),
    canTransfer: !(mask & FUSES.CANNOT_TRANSFER),
    canSetResolver: !(mask & FUSES.CANNOT_SET_RESOLVER),
    canSetTTL: !(mask & FUSES.CANNOT_SET_TTL),
    canApprove: !(mask & FUSES.CANNOT_APPROVE),
  }

  const permissionItems = [
    {
      key: 'unwrap',
      label: 'Unwrap name',
      description: 'Revert from wrapped to registry state',
      allowed: perms.canUnwrap,
    },
    {
      key: 'transfer',
      label: 'Transfer domain',
      description: 'Send your ENS name to another address',
      allowed: perms.canTransfer,
    },
    {
      key: 'approve',
      label: 'Approve operator',
      description:
        'The owner of this name can change the manager approved to renew subnames',
      allowed: perms.canApprove,
    },
    {
      key: 'setResolver',
      label: 'Change resolver',
      description: 'Point your name to a different resolver contract',
      allowed: perms.canSetResolver,
    },
    {
      key: 'setTTL',
      label: 'Set TTL',
      description: 'Change the time-to-live for DNS caches',
      allowed: perms.canSetTTL,
    },
    {
      key: 'burnFuses',
      label: 'Burn fuses',
      description: 'Permanently revoke additional permissions',
      allowed: perms.canBurnFuses,
    },
  ]
  const [next, setNext] = useState(1)
  const handleRenewal = () => {
    if (walletAddress != wrappedOwner || owner) {
      setNext(0)
    } else {
      setNext(1)
    }
    setIsOpen(true)
  }

  const [resolverOpen, setResolverOpen] = useState(false)
  const [wrapOpen, setWrapOpen] = useState(false)

  const handleWrapper = () => {
    if (wrapped == true) {
      setIsOpen(true)
    } else {
      setWrapOpen(true)
    }
  }
  const getCID = (data: string) => {
    const parts = data.split('/ipfs/')
    const cid = parts[1]?.split('/')[0]
    return `https://ipfs.io/ipfs/${cid}`
  }

  const img = useMemo(() => {
    const avatar = others.find((record) => record.key === 'avatar')
    return avatar ? getCID(avatar.value) : null
  }, [others])
  if (
    availableLoading ||
    wLoading ||
    expiryLoading ||
    graceLoading ||
    resolverLoading ||
    ownerLoading ||
    managerLoading ||
    textsLoading ||
    accountsLoading ||
    othersLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-15 h-15 border-2 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col mx-auto p-2 mb-20 md:mb-5 md:px-30 mt-15 lg:px-60 md:mt-15">
        <div className="">
          <h2 className="font-bold text-2xl text-white">
            {label as string}.safu
          </h2>

          {/* Tabs */}
          <div className="flex space-x-6 text-gray-400 text-xl mt-4 pb-2 overflow-auto">
            <button
              className={`${
                tab == 'profile' ? 'text-[#FFB000]' : ''
              } font-semibold hover:text-[#FFB000] focus:text-[#FFB00] cursor-pointer`}
              onClick={() => setTab('profile')}
            >
              Profile
            </button>
            <button
              className={`${
                tab == 'records' ? 'text-[#FFB000]' : ''
              } font-semibold hover:text-[#FFB000] focus:text-[#FFB00] cursor-pointer`}
              onClick={() => setTab('records')}
            >
              Records
            </button>
            <button
              className={`${
                tab == 'ownership' ? 'text-[#FFB000]' : ''
              } font-semibold hover:text-[#FFB000] focus:text-[#FFB00] cursor-pointer`}
              onClick={() => setTab('ownership')}
            >
              Ownership
            </button>
            {wrapped == true && (
              <button
                className={`${
                  tab == 'permissions' ? 'text-[#FFB000]' : ''
                } font-semibold hover:text-[#FFB000] focus:text-[#FFB00] cursor-pointer`}
                onClick={() => setTab('permissions')}
              >
                Permissions
              </button>
            )}
            <button
              className={`${
                tab == 'more' ? 'text-[#FFB000]' : ''
              } font-semibold hover:text-[#FFB000] focus:text-[#FFB00] cursor-pointer`}
              onClick={() => setTab('more')}
            >
              More
            </button>
          </div>

          {/* Profile Card */}
          {tab == 'profile' ? (
            <div>
              <div className="rounded-xl bg-neutral-800 p-3 md:px-10 md:py-5 mt-5 border-[0.5px] border-gray-500 relative flex items-center">
                <Avatar
                  name={`${label}.safu`}
                  className="w-15 h-15 md:w-24 md:h-24 mr-2 "
                />
                <div className="ml-1 md:ml-5 flex items-center w-[80%]">
                  <div className="text-xl md:text-2xl font-bold grow-1">
                    {label}.safu
                    {texts
                      .filter((k) => k.key == 'description')
                      .map((item) => (
                        <div className="text-[10px] md:text-sm font-normal mt-2 max-w-90 break-all">
                          {item.value}
                        </div>
                      ))}
                  </div>
                  <button
                    className="bg-[#FF7000] flex items-center p-1 md:px-4 md:py-2 rounded-lg mt-2 text-[12px] md:text-sm cursor-pointer font-bold"
                    onClick={handleRenewal}
                  >
                    <FastForwardIcon className="h-5 w-5 mr-1" /> Extend
                  </button>
                </div>
              </div>
              {primaryName == `${label}.safu` ? (
                <div>
                  <ReferralProgress
                    referrals={(Number(referrals) as number) ?? 0}
                  />
                </div>
              ) : (
                ''
              )}

              {/* Metadata Card */}
              <div className="bg-neutral-800 rounded-xl p-4 md:p-6 mt-3 space-y-3 border-[0.5px] border-neutral-500">
                {accounts.length > 0 ? (
                  <div>
                    <div className="font-semibold text-gray-300 ml-1">
                      Accounts
                    </div>
                    <div className="flex flex-wrap gap-2 ">
                      {accounts.map((item) => (
                        <a
                          key={item.key}
                          className="bg-gray-900 inline-block px-3 py-1 mt-2 text-sm rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105"
                          href={
                            item.key == 'com.twitter'
                              ? `https://x.com/${item.value}`
                              : item.key == 'org.telegram'
                              ? `https://t.me/${item.value}`
                              : item.key == 'com.reddit'
                              ? `https://reddit.com/user/${item.value}`
                              : item.key == 'com.whatsapp'
                              ? `https://wa.me/${item.value}`
                              : item.key == 'com.snapchat'
                              ? `https://snapchat.com/add/${item.value}`
                              : item.key == 'com.github'
                              ? `https://github.com/${item.value}`
                              : item.key == 'com.youtube'
                              ? `https://x.com/${item.value}`
                              : item.key == 'email'
                              ? `mailto:${item.value}`
                              : item.key == 'com.tiktok'
                              ? `tiktok.com/${item.value}`
                              : ''
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="flex items-center">
                            <span className="mr-2 font-bold text-xl">
                              {item.key == 'com.twitter' ? (
                                <FaXTwitter color="white" />
                              ) : item.key == 'org.telegram' ? (
                                <RiTelegramFill color="white" />
                              ) : item.key == 'com.reddit' ? (
                                <FaRedditAlien color="white" />
                              ) : item.key == 'com.whatsapp' ? (
                                <IoLogoWhatsapp color="white" />
                              ) : item.key == 'com.snapchat' ? (
                                <FaSnapchatGhost />
                              ) : item.key == 'com.github' ? (
                                <FaGithub color="white" />
                              ) : item.key == 'com.youtube' ? (
                                <FaYoutube color="white" />
                              ) : item.key == 'email' ? (
                                <IoMailSharp color="white" />
                              ) : item.key == 'com.tiktok' ? (
                                ''
                              ) : (
                                ''
                              )}
                            </span>
                            {item.value}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  ''
                )}
                {others.length > 0 ? (
                  <div>
                    <div className="font-semibold text-gray-300 ml-1">
                      Other Records
                    </div>
                    <div className="flex flex-wrap gap-2 ">
                      {others.map((item) => (
                        <div
                          key={item.key}
                          className="bg-gray-900 max-w-full flex items-center px-3 py-1 mt-2 text-sm rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105"
                        >
                          <span className="text-gray-400 mr-2 font-bold">
                            {item.key}
                          </span>
                          <span className="break-words overflow-hidden text-ellipsis">
                            {item.key === 'avatar'
                              ? getCID(item.value)
                              : item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  ''
                )}

                <div>
                  <div className="font-semibold text-gray-300 ml-1">
                    Addresses:
                  </div>
                  <div className="text-sm bg-gray-900 inline-block px-3 py-1 mt-2 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105 cursor-pointer flex">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-2 font-bold text-xl">
                        <SiBnbchain />
                      </span>{' '}
                      {!isPending ? shortenAddress(address as string) : ''}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-blue-500 cursor-pointer font-bold ml-1">
                  Ownership → View
                </div>
                {wrapped == true ? (
                  <div className="flex flex-wrap gap-2 text-sm mt-2">
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        owner{' '}
                      </span>{' '}
                      {!wLoading ? shortenAddress(`${wrappedOwner}`) : ''}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        expiry{' '}
                      </span>{' '}
                      {expiry}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        parent
                      </span>{' '}
                      safu
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 text-sm mt-2">
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        manager{' '}
                      </span>{' '}
                      {!managerLoading ? shortenAddress(manager as string) : ''}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        owner{' '}
                      </span>{' '}
                      {!ownerLoading ? shortenAddress(owner as string) : ''}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        expiry{' '}
                      </span>{' '}
                      {expiry}
                    </div>
                    <div className="bg-gray-900 px-3 py-1 rounded-full hover:bg-gray-950 delay-200 duration-200 transition-all hover:scale-105">
                      <span className="text-gray-400 mr-1 font-bold">
                        parent
                      </span>{' '}
                      safu
                    </div>
                  </div>
                )}
              </div>
              <Renew
                label={label as string}
                expires={expires as bigint}
                setIsOpen={setIsOpen}
                isOpen={isOpen}
                number={next}
              />
            </div>
          ) : tab == 'records' ? (
            <div className="rounded-xl bg-neutral-800 p-3 mt-5 border-[0.5px] border-gray-500 ">
              {texts.length > 0 ? (
                <div>
                  <div className="font-semibold text-gray-300 ml-2 text-md">
                    Text{' '}
                    <span className="font-normal text-sm ml-3">
                      {' '}
                      {texts.length} Records{' '}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {texts.map((item) => (
                      <div
                        key={item.key}
                        className="bg-gray-900 px-3 py-1 mt-2 text-sm rounded-full flex"
                      >
                        <span className="text-gray-400 mr-1 w-30 font-bold items-center flex">
                          {item.key}
                        </span>{' '}
                        <span className="break-words overflow-hidden text-ellipsis">
                          {item.key === 'avatar'
                            ? getCID(item.value)
                            : item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="font-semibold text-gray-300 ml-2 text-sm">
                  No Text Records
                </div>
              )}

              {address != '' ? (
                <div className="mt-5">
                  <div className="font-semibold text-gray-300 ml-2 text-md">
                    Address{' '}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-900 px-3 py-1 mt-2 text-sm rounded-full flex items-center">
                      <div className="text-gray-400 mr-1 w-30 font-bold">
                        bsc
                      </div>
                      <div className="break-all">{address as string}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="font-semibold text-gray-300 ml-2 text-sm">
                  No Address
                </div>
              )}

              <Update
                texts={texts}
                label={label as string}
                owner={address as `0x${string}`}
                resolverAddress={constants.PublicResolver}
                setIsOpen={setIsOpen}
                isOpen={isOpen}
                image={img ? img : ''}
              />
              {wrappedOwner == walletAddress || owner == walletAddress ? (
                <button
                  className="px-3 py-2 mt-5 bg-[#FF7000] text-sm rounded-xl font-bold cursor-pointer"
                  onClick={() => setIsOpen(true)}
                >
                  Edit Records
                </button>
              ) : (
                ''
              )}
            </div>
          ) : tab == 'ownership' ? (
            <div>
              <div className="rounded-xl bg-neutral-800 mt-5 border-[0.5px] border-neutral-500 p-4 pb-20">
                <div className="px-2 py-4 text-3xl font-bold text-white border-b-1 border-neutral-500">
                  Roles
                </div>
                {wrapped == true ? (
                  <div>
                    <div className="px-2 py-4 text-xl font-bold text-white border-b-1 border-neutral-500 flex items-center">
                      <div>Owner: </div>
                      <div className="text-sm font-semibold ml-5 flex items-center max-w-50 flex-wrap">
                        {woname as string}
                        {woname.startsWith('0x') ? (
                          ''
                        ) : (
                          <div className="text-[10px] truncate max-w-30 ml-3 text-gray-400 mt-[1.5px]">
                            {`   (${shortenAddress(wrappedOwner as string)})`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-2 py-4 text-xl font-bold text-white border-b-1 border-neutral-500 flex items-center">
                      <div>BSC Record:</div>
                      <div className="text-sm font-semibold ml-5">
                        {shortenAddress(address as string)}
                      </div>
                    </div>
                  </div>
                ) : wrapped == false ? (
                  <div>
                    <div className="px-2 py-4 text-lg md:text-xl font-bold text-white border-b-1 border-neutral-500 flex items-center">
                      <div>Owner: </div>
                      <div className="text-sm font-semibold ml-2 flex items-center max-w-50 flex-wrap">
                        {oname as string}
                        {oname.startsWith('0x') ? (
                          ''
                        ) : (
                          <div className="text-[10px] truncate max-w-30 ml-3 text-gray-400 mt-[1.5px]">
                            {`   (${shortenAddress(owner as string)})`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="px-2 py-4 text-lg md:text-xl font-bold text-white border-b-1 border-neutral-500 flex items-center">
                      <div>Manager: </div>
                      <div className="text-sm font-semibold ml-2 flex items-center max-w-50 flex-wrap">
                        {manname as string}
                        {manname.startsWith('0x') ? (
                          ''
                        ) : (
                          <div className="text-[10px] truncate max-w-30 ml-3 text-gray-400 mt-[1.5px]">
                            {`   (${shortenAddress(manager as string)})`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  ''
                )}
              </div>
              <div className="rounded-xl bg-neutral-800 mt-5 border-[0.5px] border-neutral-500 p-4 flex md:justify-center justify-left">
                <div className=" grid md:grid-cols-2  w-full">
                  <div className="text-left md:px-6 md:border-r-1 border-b-1 md:border-b-0 py-6 border-neutral-500 w-full">
                    <div className="font-bold text-lg w-full">Name Expires</div>
                    <div className="text-[13px] font-semibold">
                      {expiry}
                      <span className="text-gray-400 ml-2 font-normal">
                        {expiryTime}
                      </span>
                    </div>
                  </div>
                  <div className="md:px-6 text-left py-6">
                    <div className="font-bold text-lg">
                      Grace Period Expires
                    </div>
                    <div className="text-[13px] font-semibold">
                      {graceExpiry}
                      <span className="text-gray-400 ml-2 font-normal">
                        {graceExpiryTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : tab == 'permissions' ? (
            <section className="rounded-xl bg-neutral-800 p-8 mt-5 border-[0.5px] border-gray-400 w-full">
              <h2 className="text-xl font-semibold text-white">Permissions</h2>
              {permissionItems.map(({ key, label, description, allowed }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 mt-3 bg-neutral-700 rounded-lg"
                >
                  <div className="max-w-[80%] md:max-w-full">
                    <div className="font-medium text-white">{label}</div>
                    <div className="text-sm text-neutral-400">
                      {description}
                    </div>
                  </div>
                  <Switch
                    checked={allowed}
                    disabled
                    className={`
                      ${allowed ? 'bg-blue-600' : 'bg-gray-200'}
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <span className="sr-only">Toggle setting</span>

                    {/* The Thumb: the moving circle */}
                    <span
                      aria-hidden="true"
                      className={`
      ${allowed ? 'translate-x-6' : 'translate-x-1'}
      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
    `}
                    />
                  </Switch>
                </div>
              ))}
            </section>
          ) : tab == 'more' ? (
            <div>
              <section className="rounded-xl bg-neutral-800 p-4 md:p-8 mt-5 border-[0.5px] border-gray-500 w-full divide-y">
                <div className="p-3 flex justify-between">
                  <h1 className="text-2xl font-bold">Token</h1>
                  <a
                    href={`https://bscscan.com/nft/${
                      wrapped == true
                        ? constants.NameWrapper +
                          '/' +
                          BigInt(node).toString(10)
                        : constants.BaseRegistrar +
                          '/' +
                          BigInt(keccak256(toBytes(label as string))).toString(
                            10,
                          )
                    }`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation()
                      /* let the browser handle the navigation */
                    }}
                    className="flex text-[#FFB000] font-semibold cursor-pointer"
                  >
                    BscScan
                  </a>
                </div>
                <div className=" flex flex-col md:flex-row gap-4">
                  <div className="flex-col">
                    <div className="mt-5">
                      <div className="bg-gray-900 px-3 py-3 mt-2 text-sm md:text-sm rounded-full flex items-center justify-between">
                        <div className="text-gray-400 mr-1 w-30 text-sm">
                          hex
                        </div>
                        <div className="break-all max-w-43 md:max-w-130  md:text-sm">
                          {node}
                        </div>
                      </div>
                      <div className="bg-gray-900 px-3 py-3 mt-2 text-sm md:text-sm rounded-full flex items-center justify-between">
                        <div className="text-gray-400 mr-1 w-30 text-sm">
                          decimal
                        </div>
                        <div className="break-all max-w-43 md:max-w-130">
                          {BigInt(node).toString(10)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:pt-5 justify-center">
                    <DomainImage
                      className="h-60 md:h-50 md:w-70"
                      domain={`${label}.safu`}
                    />
                  </div>
                </div>
              </section>
              <section className="rounded-xl bg-neutral-800 p-4 md:p-8 mt-5 border-[0.5px] border-gray-500 w-full ">
                <h1 className="text-2xl font-bold">Name Wrapper</h1>
                <div className="flex flex-col md:flex-row gap-3 items-center mt-4">
                  <div className="bg-green-950 px-3 py-2 text-md md:text-lg rounded-xl flex grow-1 items-center border-[0.5px] border-gray-500 font-semibold w-full">
                    {wrapped == true ? 'Wrapped' : 'Unwrapped'}
                  </div>
                  {wrappedOwner == walletAddress || owner == walletAddress ? (
                    <button
                      className="px-3 py-2 bg-[#FF7000] rounded-xl font-bold cursor-pointer"
                      onClick={handleWrapper}
                    >
                      {wrapped == true ? 'Unwrap' : 'Wrap'}
                    </button>
                  ) : (
                    ''
                  )}
                </div>
              </section>
              <section className="rounded-xl bg-neutral-800 p-4 md:p-8 mt-5 border-[0.5px] border-gray-500 w-full ">
                <h1 className="text-2xl font-bold">Resolver</h1>
                <div className="flex md:flex-row flex-col gap-3 items-center mt-4">
                  <div className="bg-neutral-950 px-3 py-2 text-sm md:text-md rounded-xl flex grow-1 items-center border-[0.5px] border-gray-500 font-semibold break-all">
                    {resolver}
                  </div>
                  {wrappedOwner == walletAddress || owner == walletAddress ? (
                    <button
                      className="px-3 py-2 bg-[#FF7000] rounded-xl font-bold cursor-pointer"
                      onClick={() => {
                        setResolverOpen(true)
                      }}
                    >
                      Change Resolver
                    </button>
                  ) : (
                    ''
                  )}
                </div>
              </section>
              <Unwrap
                label={label as string}
                setIsOpen={setIsOpen}
                isOpen={isOpen}
              />
              <Wrap
                label={label as string}
                setIsOpen={setWrapOpen}
                isOpen={wrapOpen}
              />
              <ChangeResolver
                label={label as string}
                setIsOpen={setResolverOpen}
                isOpen={resolverOpen}
                wrapped={wrapped as boolean}
              />
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  )
}

export default Resolve
