import { useEffect, useState, useRef, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import { Check } from 'lucide-react'
import { intervalToDuration, startOfDay } from 'date-fns'
import { useAccount, useReadContract } from 'wagmi'
import { useParams, useNavigate } from 'react-router'
import Countdown from 'react-countdown'
import { useENSName } from '../hooks/getPrimaryName'
import { normalize } from 'viem/ens'
import { useEstimateENSFees } from '../hooks/gasEstimation'
import { constants } from '../constant'
import UserForm from './userForm'
import { formatDuration } from '../utils/domainUtils'
import { Controller } from '../constants/registerAbis'
import { useRegistrationPrice } from '../hooks/useRegistrationPrice'
import { useRegistration } from '../hooks/useRegistration'
import SetupModal from './register/SetupModal'
import ConfirmDetailsModal from './register/ConfirmDetailsModal'
import RegisterDetailsModal from './register/RegisterDetailsModal'
import RegistrationSteps from './register/RegistrationSteps'
import PriceDisplay from './register/PriceDisplay'
import { Input } from './ui/input'

type RegisterParams = {
  domain: string
  duration: number
  resolver: `0x${string}`
  data: `0x${string}`[]
  reverseRecord: boolean
  ownerControlledFuses: number
  lifetime: boolean
  referree: string
}

const Register = () => {
  const navigate = useNavigate()
  const { label } = useParams<string>()
  const [years, setYears] = useState(1)
  const [currency, setCurrency] = useState<'BNB' | 'USD'>('BNB')
  const [bnb, setBnb] = useState(true)
  const now = useMemo(() => new Date(), [])

  const { address, isDisconnected } = useAccount()
  const { name: myName } = useENSName({ owner: address as `0x${string}` })
  const [isPrimary, setIsPrimary] = useState(myName ? false : true)

  const [next, setNext] = useState(0)
  const [isOpen, setIsOpen] = useState(true)
  const [useToken, setUseToken] = useState(false)
  const [token, setToken] = useState<`0x${string}`>('0x')

  useEffect(() => {
    if (!myName) {
      setIsPrimary(true)
    }
  }, [myName, isPrimary])

  const [owner, setOwner] = useState(
    address || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  )

  const nextYear = useMemo(() => {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() + 1)
    return d
  }, [now])

  const minDate = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() + 28)
    return d
  }, [now])

  const [input, setInput] = useState(true)
  const [date, setDate] = useState(true)
  const [picker, setPicker] = useState(false)
  const [dateText, setDateText] = useState<Date | null>(nextYear)
  const [seconds, setSeconds] = useState(0)
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [discord, setDiscord] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [wait, setWait] = useState(60)
  const [done, setDone] = useState(false)
  const [referrer, setReferrer] = useState('')
  const [lifetime, setLifetime] = useState(false)
  const [newRecords, setNewRecords] = useState<
    { key: string; value: string }[]
  >([])

  // Use custom hooks
  const {
    price,
    loading,
    usd1TokenData,
    cakeTokenData,
    priceData,
  } = useRegistrationPrice({
    label: label as string,
    seconds,
    lifetime,
  })

  const { fees, loading: estimateLoading } = useEstimateENSFees({
    name: `${label}`,
    owner: address as `0x${string}`,
    duration: seconds,
  })

  const {
    commitData,
    isLoading,
    commithash,
    registerhash,
    registerError,
    registerPending,
    buildCommitDataFn,
    commit: commitFn,
    register: registerFn,
  } = useRegistration()

  const [estimateBnb, setEstimateBnb] = useState('')
  const [estimateUsd, setEstimateUsd] = useState('')

  useEffect(() => {
    const ref = localStorage.getItem('ref')
    if (ref) {
      setReferrer(normalize(ref))
    }
  }, [label])

  useEffect(() => {
    const bnb = Number(fees?.fee.totalEth).toFixed(4)
    setEstimateBnb(bnb as string)

    const [, answer, , ,] = (priceData as any) || [0, 0, 0, 0, 0]
    const usd = (Number(fees?.fee.totalEth) * Number(answer)) / 1e8
    setEstimateUsd(usd.toFixed(2))
  }, [fees, priceData])

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const duration = useMemo(() => {
    if (!dateText) {
      return { years: 0, months: 0, days: 0 }
    }
    const start = startOfDay(now)
    const end = startOfDay(dateText)
    const d = intervalToDuration({ start, end })
    return { years: d.years || 0, months: d.months || 0, days: d.days || 0 }
  }, [nextYear, dateText])

  useEffect(() => {
    if (label != undefined && label.includes('.')) {
      navigate('/')
    }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        picker &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPicker(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [picker])

  useEffect(() => {
    if (dateText && !date) {
      const d = new Date(dateText)
      setSeconds((startOfDay(d).getTime() - startOfDay(now).getTime()) / 1000)
    }
  }, [dateText, date])

  useEffect(() => {
    if (date) {
      setSeconds(31536000 * years)
    }
  }, [date, years])

  useEffect(() => {
    if (lifetime) {
      setSeconds(31536000 * 1000)
    }
  }, [lifetime, years])

  const increment = () => {
    setYears((prev) => prev + 1)
  }

  const [disable, setDisable] = useState(true)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!input && inputRef.current) {
        const clickedNode = event.target as Node
        if (!inputRef.current.contains(clickedNode)) {
          setInput(true)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [input])

  useEffect(() => {
    document.title = `Register – ${label}.safu`
  }, [label])

  useEffect(() => {
    if (years == 1) {
      setDisable(true)
    }
    if (years > 1) {
      setDisable(false)
    }
  }, [years])

  const decrease = () => {
    setYears((prev) => prev - 1)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (Number(event.target.value) < 1) {
      setYears(1)
    } else if (Number(event.target.value) >= 1) {
      setYears(Number(event.target.value))
    }
  }

  let durationString = formatDuration(duration)

  const buildCommitData = () => {
    const textRecords = [
      { key: 'description', value: description },
      { key: 'avatar', value: avatar },
      { key: 'com.twitter', value: twitter },
      { key: 'com.github', value: github },
      { key: 'com.discord', value: discord },
      { key: 'email', value: email },
      { key: 'url', value: website },
      { key: 'phone', value: phone },
    ]

    buildCommitDataFn(textRecords, newRecords, label as string, owner)
  }

  const commit = async () => {
    await commitFn(
      normalize(label as string),
      address as `0x${string}`,
      seconds,
      isPrimary,
      lifetime,
    )
    setWait(60)
    setIsOpen(false)
  }

  const register = async () => {
    setIsOpen(true)
    await registerFn(
      label as string,
      address as `0x${string}`,
      seconds,
      isPrimary,
      lifetime,
      referrer,
      useToken,
      token,
      usd1TokenData,
      cakeTokenData,
      priceData
    )
    setIsOpen(false)
  }

  const { data: available } = useReadContract({
    address: constants.Controller,
    abi: Controller as any,
    functionName: 'available',
    args: [label as string],
  })

  useEffect(() => {
    if (available === false) {
      navigate('/')
    } else if (available === true) {
      setNext(0)
    }
  }, [available, navigate])

  const registerParams: RegisterParams = {
    domain: label as string,
    duration: seconds,
    resolver: constants.PublicResolver,
    data: commitData,
    reverseRecord: isPrimary,
    ownerControlledFuses: 0,
    lifetime: lifetime,
    referree: referrer || '',
  }

  const card = false

  return (
    <div className="mb-25 md:mb-0">
      <div className="flex flex-col mx-auto px-2 md:px-30 mt-20 lg:px-60 md:mt-15">
        <div className="">
          <h2 className="font-bold text-2xl text-white">{label}.safu</h2>
          {next == 0 ? (
            <div className="rounded-xl bg-neutral-800 px-5 md:px-10 py-5 mt-5 border-[0.5px] border-gray-400">
              <h1 className="text-lg font-semibold text-white">
                {' '}
                Register {label}.safu{' '}
              </h1>
              {date ? (
                <div className="rounded-full py-4 px-4  border-[0.5px] border-gray-400 mt-5 flex items-center relative">
                  <button
                    className="flex items-center justify-center text-3xl w-10 h-10 p-2  rounded-full border-[0.5px] cursor-pointer border-gray-400 bg-[#FFF700] disabled:bg-neutral-500 disabled:cursor-not-allowed text-neutral-900 "
                    disabled={disable || lifetime}
                    onClick={decrease}
                  >
                    -
                  </button>
                  {input ? (
                    <div
                      className="text-3xl md:text-3xl text-[#FFF700] font-semibold grow-1 text-center hover:bg-[#807F00]  transition-all duration-300 rounded-full cursor-pointer mx-5"
                      onClick={() => {
                        if (!lifetime) setInput(false)
                      }}
                    >
                      {lifetime ? (
                        <p className="opacity-90">Lifetime Registration</p>
                      ) : (
                        <p className="opacity-90">
                          {years} Year{years > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      ref={inputRef}
                      type="number"
                      min={1}
                      className="text-3xl md:text-4xl w-30 md:w-full text-[#FFF700] font-semibold grow-1 text-center hover:bg-[#807F00] transition-all duration-300 rounded-full cursor-pointer mx-5"
                      value={years}
                      onChange={handleChange}
                      disabled={lifetime}
                    />
                  )}
                  <button
                    className="flex items-center justify-center text-3xl w-10 h-10 p-2 rounded-full bg-[#FFF700] border-[0.5px] border-gray-400 cursor-pointer text-neutral-900 disabled:bg-neutral-500 disabled:cursor-not-allowed"
                    onClick={increment}
                    disabled={lifetime}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  className="rounded-full p-4 border-[0.5px] border-gray-400 mt-5 flex items-center hover:bg-[#807F00] cursor-pointer transition-all ease-in-out duration-300 relative"
                  onClick={() => {
                    if (!lifetime) setPicker(true)
                  }}
                >
                  <DatePicker
                    selected={dateText}
                    onChange={(d) => setDateText(d)}
                    open={picker}
                    onClickOutside={() => setPicker(false)}
                    minDate={minDate}
                    dateFormat="MMMM d, yyyy"
                    customInput={<div style={{ display: 'none' }} />}
                    popperPlacement="bottom-start"
                    className="z-50 mt-50"
                    disabled={lifetime}
                    calendarContainer={({ className, children }) => (
                      <div
                        className={`${className} absolute top-full left-0 mt-7 z-50`}
                        style={{ width: 'auto' }}
                      >
                        {children}
                      </div>
                    )}
                  />
                  <div className="flex grow-1 text-3xl text-[#FFF700] font-semibold relative items-center ">
                    {dateText?.toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <button className="flex items-center justify-center text-3xl w-10 h-10 p-2  rounded-full bg-[#FFF700] border-[0.5px] border-gray-400 cursor-pointer text-neutral-900">
                    +
                  </button>
                </div>
              )}
              {date && !lifetime ? (
                <p className="text-center mt-5 text-sm flex justify-center font-semibold">
                  {years} year{years > 1 ? 's' : ''} registration.{' '}
                  <span
                    className="text-[#FFF700] text-center ml-2 cursor-pointer"
                    onClick={() => {
                      setDate(!date)
                    }}
                  >
                    Pick by date
                  </span>
                </p>
              ) : !date && !lifetime ? (
                <p className="text-center mt-5 text-sm flex justify-center font-semibold">
                  {formatDuration(duration)} registration.{' '}
                  <span
                    className="text-[#FFF700] text-center ml-2 cursor-pointer"
                    onClick={() => {
                      setDate(!date)
                    }}
                  >
                    Pick by Years
                  </span>
                </p>
              ) : (
                ''
              )}
              <p className="text-center mt-5 text-sm flex justify-center font-semibold">
                <span
                  className="text-[#FFF700] text-center ml-2 cursor-pointer"
                  onClick={() => {
                    setLifetime(!lifetime)
                  }}
                >
                  {!lifetime
                    ? 'Would you like a lifetime registration?'
                    : 'Or Pick By Years/Date?'}
                </span>
              </p>
              <div>
                <div className="inline-flex bg-neutral-900 rounded-full p-1 mt-5">
                  {(['BNB', 'USD'] as const).map((curr) => {
                    const isActive = curr === currency
                    return (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr)
                          setBnb(!bnb)
                        }}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-full transition cursor-pointer
                            ${
                              isActive
                                ? 'bg-[#FFF700] text-neutral-800'
                                : 'text-gray-400 hover:text-white'
                            }
                            `}
                      >
                        {curr}
                      </button>
                    )
                  })}
                </div>
                <PriceDisplay
                  currency={currency}
                  price={price}
                  estimateBnb={estimateBnb}
                  estimateUsd={estimateUsd}
                  loading={loading}
                  estimateLoading={estimateLoading}
                  duration={duration}
                  date={date}
                  years={years}
                  lifetime={lifetime}
                />
                <div className="flex mt-5">
                  <div>
                    <h1 className="text-xl font-semibold">
                      Set as Primary Name
                    </h1>
                    <p className="text-gray-400 text-sm max-w-60 md:max-w-100 mt-5">
                      This links your address to this name, allowing dApps to
                      display it as your profile when connected to them. You can
                      only have one primary name per address.
                    </p>
                  </div>
                  <div className="flex grow-1"></div>
                  <button
                    onClick={() => setIsPrimary(!isPrimary)}
                    className={`flex items-center justify-center w-14 h-14
                     rounded-full transition-colors duration-300 border-8 border-gray-200 ${
                       isPrimary ? 'bg-black' : 'bg-gray-300'
                     }`}
                  >
                    <Check
                      className={`w-5 h-5 text-white transition-opacity duration-200  ${
                        isPrimary ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="mt-5">
                  <h1 className="text-lg font-semibold">Referrer</h1>
                  <Input
                    value={referrer}
                    placeholder="The primary name of the referrer (Optional)"
                    className="mt-2 py-2 placeholder:text-gray-400 max-w-2/3 w-3/4"
                    type="text"
                    onChange={(e) => {
                      if (e.target.value.includes('.') ) {
                        setReferrer('')
                      } else {
                        setReferrer(e.target.value.toLowerCase())
                      }
                    }}
                  />
                </div>
                <div className="flex mt-5 items-center">
                  <div>
                    <h1 className="text-lg font-semibold">
                      Pay with Cake ({price.cake} $CAKE)
                    </h1>
                  </div>
                  <div className="flex grow-1"></div>
                  <button
                    onClick={() => {
                      setUseToken(!useToken)
                      setToken('0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82')
                    }}
                    className={`flex items-center justify-center w-10 h-10
                     rounded-full transition-colors duration-300 border-6 border-gray-200 ${
                       useToken &&
                       token == '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'
                         ? 'bg-black'
                         : 'bg-gray-300'
                     }`}
                  >
                    <Check
                      className={`w-5 h-5 text-white transition-opacity duration-200  ${
                        useToken &&
                        token == '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex mt-5 items-center">
                  <div>
                    <h1 className="text-lg font-semibold">
                      Pay with USD1 ({price.usd1} $USD1)
                    </h1>
                  </div>
                  <div className="flex grow-1"></div>
                  <button
                    onClick={() => {
                      setUseToken(!useToken)
                      setToken('0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d')
                    }}
                    className={`flex items-center justify-center w-10 h-10
                     rounded-full transition-colors duration-300 border-6 border-gray-200 ${
                       useToken &&
                       token == '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d'
                         ? 'bg-black'
                         : 'bg-gray-300'
                     }`}
                  >
                    <Check
                      className={`w-5 h-5 text-white transition-opacity duration-200  ${
                        useToken &&
                        token == '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d'
                          ? 'opacity-100'
                          : 'opacity-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                {!isDisconnected ? (
                  <div className="flex gap-4">
                    <button
                      className="px-5 py-3 bg-[#FFF700] text-neutral-900 font-semibold mt-5 rounded-xl cursor-pointer hover:bg-[#B3AE00] transition-all duration-300 flex items-center"
                      onClick={() => {
                        setNext(1)
                      }}
                      disabled={isLoading}
                    >
                      Continue
                    </button>
                  </div>
                ) : (
                  ''
                )}
              </div>
            </div>
          ) : next == 1 ? (
            <SetupModal
              owner={owner}
              setOwner={setOwner}
              setDescription={setDescription}
              setEmail={setEmail}
              setTwitter={setTwitter}
              setWebsite={setWebsite}
              setGithub={setGithub}
              setDiscord={setDiscord}
              setPhone={setPhone}
              setAvatar={setAvatar}
              setNext={setNext}
              textRecords={newRecords}
              setTextRecords={setNewRecords}
              buildCommitData={buildCommitData}
            />
          ) : next == 2 ? (
            <div className="rounded-xl bg-neutral-800 px-5 md:px-10 py-5 mt-5 border-[0.5px] border-gray-400">
              <RegistrationSteps step={0} />
              <div className="mt-10">
                <div className="inline-flex bg-neutral-900 rounded-full p-1">
                  {(['BNB', 'USD'] as const).map((curr) => {
                    const isActive = curr === currency
                    return (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr)
                          setBnb(!bnb)
                        }}
                        className={`
                            px-4 py-2 text-sm font-medium rounded-full transition cursor-pointer
                            ${
                              isActive
                                ? 'bg-[#FFF700] text-neutral-800'
                                : 'text-gray-400 hover:text-white'
                            }
                            `}
                      >
                        {curr}
                      </button>
                    )
                  })}
                </div>
                <PriceDisplay
                  currency={currency}
                  price={price}
                  estimateBnb={estimateBnb}
                  estimateUsd={estimateUsd}
                  loading={loading}
                  estimateLoading={estimateLoading}
                  duration={duration}
                  date={date}
                  years={years}
                />
              </div>

              <div className="flex space-x-5 mt-10 justify-center">
                <button
                  className="p-3 px-10 md:px-15 bg-gray-300 text-black rounded-lg font-semibold cursor-pointer"
                  onClick={() => {
                    setNext((prev) => prev - 1)
                  }}
                >
                  Back
                </button>
                <button
                  className="p-3 px-10 md:px-15 bg-[#FFF700]  rounded-lg text-black font-semibold cursor-pointer"
                  onClick={() => {
                    setNext((prev) => prev + 1)
                    if (!card) {
                      commit()
                    }
                  }}
                >
                  Begin
                </button>
              </div>
            </div>
          ) : next == 3 && !card ? (
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl  mx-auto mt-5 flex flex-col items-center gap-6 border-1 border-gray-300">
              <h2 className="text-2xl font-bold text-center text-neutral-800 dark:text-white">
                Almost there
              </h2>

              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-blue-300 flex justify-center items-center text-4xl font-bold text-blue-600">
                  {commithash && (
                    <Countdown
                      date={Date.now() + wait * 1000}
                      renderer={({ seconds, completed }) => {
                        if (completed) {
                          setDone(true)
                          return <span>0</span>
                        }
                        return <span>{seconds}</span>
                      }}
                    />
                  )}
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 px-4">
                This wait prevents others from{' '}
                <a href="#" className="underline text-blue-500">
                  front running
                </a>{' '}
                your transaction.
                <br />
                You'll complete the second transaction when the timer ends.
              </p>

              <div className="flex gap-4 w-full mt-4">
                <button
                  onClick={() => {
                    setNext((prev) => prev - 1)
                  }}
                  className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg font-semibold hover:bg-red-200 transition"
                >
                  Back
                </button>
                {done == false ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Wait ⏳
                  </button>
                ) : (
                  <button
                    className="flex-1 bg-[#FFF700] text-gray-500 py-2 rounded-lg font-semibold cursor-pointer"
                    onClick={() => {
                      setNext((prev) => prev + 1)
                      setIsOpen(true)
                      register()
                    }}
                  >
                    Complete Registration
                  </button>
                )}
              </div>
              <ConfirmDetailsModal
                isOpen={isOpen}
                onRequestClose={() => setNext((prev) => prev - 1)}
                name={`${label}.safu` || ''}
                action="Start timer"
                info="Start timer to register name"
              />
            </div>
          ) : next == 3 && card ? (
            <UserForm address={owner} registerParams={registerParams} />
          ) : next == 4 ? (
            <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl  mx-auto mt-5 flex flex-col items-center gap-6 border-1 border-gray-300">
              <RegisterDetailsModal
                isOpen={isOpen}
                onRequestClose={() => setNext((prev) => prev - 1)}
                name={`${label}.safu` || ''}
                action="Register name"
                duration={durationString}
              />
              {registerPending ? (
                <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white">
                  Waiting for transaction to complete...`
                </h2>
              ) : !registerhash ? (
                <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white">
                  Complete your registration
                </h2>
              ) : registerError ? (
                <h2 className="text-3xl font-bold text-center text-neutral-800 dark:text-white">
                  There was an error while registering your name. Please{' '}
                  <span
                    className="cursor-pointer text-blue"
                    onClick={() => setIsOpen(true)}
                  >
                    try again
                  </span>
                </h2>
              ) : registerhash ? (
                <div className="min-h-screen flex items-center justify-center bg-neutral-800 p-6">
                  <div className="bg-neutral-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center text-white">
                    <h1 className="text-2xl font-bold mb-2 text-white">
                      Congratulations!
                    </h1>
                    <p className="text-neutral-400 mb-6">
                      You are now the owner of{' '}
                      <span className="text-blue-400 font-semibold">
                        {label}.safu
                      </span>
                    </p>

                    <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-10 mb-6 flex flex-col items-center">
                      <div className="bg-neutral-900 rounded-full p-3 mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <p className="text-white font-semibold text-lg">{`${label}.safu`}</p>
                    </div>

                    <div className="bg-neutral-800 rounded-xl p-4 mb-6 text-sm text-left space-y-3">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">
                          {durationString}
                        </span>
                        <span className="font-medium text-white">
                          {price.bnb} BNB{' '}
                          <span className="text-neutral-500">{`($${price.usd})`}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Name expires</span>
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-white">
                            {dateText?.toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <button className="text-blue-400 text-xs hover:underline mt-1">
                            Set reminder
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => navigate(`/`)}
                        className="bg-neutral-800 border border-blue-400 text-blue-400 font-semibold py-2 px-4 rounded-lg hover:bg-neutral-700"
                      >
                        Register another
                      </button>
                      <button
                        onClick={() => navigate(`/resolve/${label}`)}
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600"
                      >
                        View name
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                ''
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      </div>
    </div>
  )
}

export default Register
