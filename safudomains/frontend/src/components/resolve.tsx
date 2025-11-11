import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { keccak256, toBytes } from 'viem'
import { useAccount } from 'wagmi'
import Update from './updateTextRecords'
import Unwrap from './unwrap'
import ChangeResolver from './changeResolver'
import Wrap from './wrap'
import DomainImage from './DomainImage'
import { constants } from '../constant'
import { shortenAddress, getCID } from '../utils/domainUtils'
import { getPermissions, getPermissionItems } from '../utils/fusePermissions'
import { useResolveData } from '../hooks/useResolveData'
import ProfileTab from './resolve/ProfileTab'
import { Switch } from '@headlessui/react'

const Resolve = () => {
  const { label } = useParams<string>()
  const [expiry, setExpiry] = useState('')
  const [expiryTime, setExpiryTime] = useState('')
  const [graceExpiry, setGraceExpiry] = useState('')
  const [graceExpiryTime, setGraceExpiryTime] = useState('')
  const [tab, setTab] = useState('profile')
  const [isOpen, setIsOpen] = useState(false)
  const { address: walletAddress } = useAccount()
  const [next, setNext] = useState(1)
  const [resolverOpen, setResolverOpen] = useState(false)
  const [wrapOpen, setWrapOpen] = useState(false)

  const navigate = useNavigate()

  // Use custom hook for all data fetching
  const {
    available,
    wrapped,
    wrappedOwner,
    owner,
    manager,
    expires,
    gexpires,
    resolver,
    address,
    referrals,
    texts,
    accounts,
    others,
    fuseMask,
    primaryName,
    woname,
    oname,
    manname,
    isLoading,
    isPending,
    wLoading,
    ownerLoading,
    managerLoading,
    node,
  } = useResolveData(label as string, walletAddress as `0x${string}`)

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

  const perms = getPermissions(fuseMask)
  const permissionItems = getPermissionItems(perms)

  const handleRenewal = () => {
    if (walletAddress != wrappedOwner || owner) {
      setNext(0)
    } else {
      setNext(1)
    }
    setIsOpen(true)
  }

  const handleWrapper = () => {
    if (wrapped == true) {
      setIsOpen(true)
    } else {
      setWrapOpen(true)
    }
  }

  const img = others.find((record) => record.key === 'avatar')
    ? getCID(others.find((record) => record.key === 'avatar')!.value)
    : null

  if (isLoading) {
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

          {/* Tab Content */}
          {tab == 'profile' ? (
            <ProfileTab
              label={label as string}
              texts={texts}
              accounts={accounts}
              others={others}
              address={address as string}
              isPending={isPending}
              wrapped={wrapped as boolean}
              wrappedOwner={wrappedOwner as string}
              owner={owner as string}
              wLoading={wLoading}
              ownerLoading={ownerLoading}
              managerLoading={managerLoading}
              manager={manager as string}
              expiry={expiry}
              primaryName={primaryName as string}
              referrals={Number(referrals)}
              walletAddress={walletAddress as string}
              handleRenewal={handleRenewal}
              expires={expires as bigint}
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              next={next}
            />
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
                        {woname?.startsWith('0x') ? (
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
                        {oname?.startsWith('0x') ? (
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
                        {manname?.startsWith('0x') ? (
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
