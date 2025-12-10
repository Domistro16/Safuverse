'use client';

import { useEffect, useState, useRef, useMemo } from 'react'
import DatePicker from 'react-datepicker'
import { Check } from 'lucide-react'
import { intervalToDuration, startOfDay } from 'date-fns'
import { useAccount, useReadContract } from 'wagmi'
import { useParams, useRouter } from 'next/navigation'
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
import { validateYears, VALIDATION_CONSTANTS } from '../utils/validation'

const THEME_KEY = 'safudomains-theme'

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
  const router = useRouter()
  const params = useParams()
  const label = params.label as string
  const [years, setYears] = useState(1)
  const [currency, setCurrency] = useState<'BNB' | 'USD'>('BNB')
  const [bnb, setBnb] = useState(true)
  const now = useMemo(() => new Date(), [])
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    }
  }, [])

  const isDark = theme === 'dark'

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
  const [validationError, setValidationError] = useState<string>('')

  // Use custom hooks
  const { price, loading, usd1TokenData, cakeTokenData, priceData } =
    useRegistrationPrice({
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
      router.push('/')
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
    setYears((prev) => {
      const newValue = prev + 1
      if (newValue > VALIDATION_CONSTANTS.MAX_YEARS) {
        setValidationError(
          `Maximum ${VALIDATION_CONSTANTS.MAX_YEARS} years allowed`,
        )
        return prev
      }
      setValidationError('')
      return newValue
    })
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
    setYears((prev) => {
      const newValue = prev - 1
      if (newValue < VALIDATION_CONSTANTS.MIN_YEARS) {
        setValidationError(
          `Minimum ${VALIDATION_CONSTANTS.MIN_YEARS} year required`,
        )
        return prev
      }
      setValidationError('')
      return newValue
    })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value

    setValidationError('')

    const validation = validateYears(value)

    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid input')
      if (validation.sanitizedValue !== undefined) {
        setYears(validation.sanitizedValue)
      }
      return
    }

    setYears(validation.sanitizedValue!)
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
      priceData,
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
      router.push('/')
    } else if (available === true) {
      setNext(0)
    }
  }, [available, router])

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

  // Card styles
  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'saturate(180%) blur(28px)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '26px',
    boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.55)' : '0 22px 55px rgba(0,0,0,0.08)',
  }

  const buttonPrimaryStyle = {
    padding: '14px 28px',
    background: isDark ? '#fff' : '#111',
    color: isDark ? '#000' : '#fff',
    border: 'none',
    borderRadius: '40px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    transition: 'all 0.25s ease',
  }

  const buttonSecondaryStyle = {
    padding: '14px 28px',
    background: isDark ? 'transparent' : '#fff',
    color: isDark ? '#fff' : '#111',
    border: isDark ? '1.5px solid #fff' : '1.5px solid #111',
    borderRadius: '40px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  }

  return (
    <div className="mb-25 md:mb-0">
      <div className="hero-spacer" />
      <div className="flex flex-col mx-auto px-4 md:px-30 mt-10 lg:px-60">
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: isDark ? '#f8f8f8' : '#111', marginBottom: '20px' }}>
            {label}.safu
          </h2>

          {next == 0 ? (
            <div style={{ ...cardStyle, padding: '32px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: isDark ? '#f8f8f8' : '#111', marginBottom: '24px' }}>
                Register {label}.safu
              </h1>

              {date ? (
                <div
                  style={{
                    ...cardStyle,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  <button
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: lifetime || disable ? (isDark ? '#444' : '#ccc') : (isDark ? '#fff' : '#111'),
                      color: lifetime || disable ? '#888' : (isDark ? '#000' : '#fff'),
                      border: 'none',
                      fontSize: '24px',
                      cursor: lifetime || disable ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    disabled={disable || lifetime}
                    onClick={decrease}
                  >
                    -
                  </button>

                  {input ? (
                    <div
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '28px',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#111',
                        cursor: lifetime ? 'default' : 'pointer',
                        padding: '8px',
                        borderRadius: '20px',
                        margin: '0 16px',
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => {
                        if (!lifetime) setInput(false)
                      }}
                    >
                      {lifetime ? (
                        <span style={{ opacity: 0.9 }}>Lifetime Registration</span>
                      ) : (
                        <span style={{ opacity: 0.9 }}>
                          {years} Year{years > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    <input
                      ref={inputRef}
                      type="number"
                      min={1}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        fontSize: '28px',
                        fontWeight: 600,
                        color: isDark ? '#fff' : '#111',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        margin: '0 16px',
                      }}
                      value={years}
                      onChange={handleChange}
                      disabled={lifetime}
                    />
                  )}

                  <button
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: lifetime ? (isDark ? '#444' : '#ccc') : (isDark ? '#fff' : '#111'),
                      color: lifetime ? '#888' : (isDark ? '#000' : '#fff'),
                      border: 'none',
                      fontSize: '24px',
                      cursor: lifetime ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onClick={increment}
                    disabled={lifetime}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div
                  ref={containerRef}
                  style={{
                    ...cardStyle,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: lifetime ? 'default' : 'pointer',
                  }}
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
                  <div style={{ flex: 1, fontSize: '24px', fontWeight: 600, color: isDark ? '#fff' : '#111' }}>
                    {dateText?.toLocaleString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>

                  <button
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isDark ? '#fff' : '#111',
                      color: isDark ? '#000' : '#fff',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
              )}

              {validationError && (
                <div style={{ marginTop: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                  <p style={{ fontSize: '14px', color: '#ef4444', textAlign: 'center' }}>
                    {validationError}
                  </p>
                </div>
              )}

              {date && !lifetime ? (
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: isDark ? '#ccc' : '#555' }}>
                  {years} year{years > 1 ? 's' : ''} registration.{' '}
                  <span
                    style={{ color: isDark ? '#fff' : '#111', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setDate(!date)}
                  >
                    Pick by date
                  </span>
                </p>
              ) : !date && !lifetime ? (
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: isDark ? '#ccc' : '#555' }}>
                  {formatDuration(duration)} registration.{' '}
                  <span
                    style={{ color: isDark ? '#fff' : '#111', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setDate(!date)}
                  >
                    Pick by Years
                  </span>
                </p>
              ) : null}

              <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
                <span
                  style={{ color: isDark ? '#fff' : '#111', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setLifetime(!lifetime)}
                >
                  {!lifetime
                    ? 'Would you like a lifetime registration?'
                    : 'Or Pick By Years/Date?'}
                </span>
              </p>

              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'inline-flex', background: isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f4', borderRadius: '9999px', padding: '4px' }}>
                  {(['BNB', 'USD'] as const).map((curr) => {
                    const isActive = curr === currency
                    return (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr)
                          setBnb(!bnb)
                        }}
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: 500,
                          borderRadius: '9999px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          background: isActive ? (isDark ? '#fff' : '#111') : 'transparent',
                          color: isActive ? (isDark ? '#000' : '#fff') : (isDark ? '#888' : '#666'),
                        }}
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

                <div style={{ display: 'flex', marginTop: '24px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: isDark ? '#fff' : '#111' }}>
                      Set as Primary Name
                    </h3>
                    <p style={{ fontSize: '14px', color: isDark ? '#aaa' : '#666', marginTop: '8px', maxWidth: '400px' }}>
                      This links your address to this name, allowing dApps to display it as your profile when connected to them.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPrimary(!isPrimary)}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      border: `3px solid ${isDark ? '#555' : '#ddd'}`,
                      background: isPrimary ? '#111' : (isDark ? '#333' : '#f4f4f4'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Check
                      style={{
                        width: '20px',
                        height: '20px',
                        color: '#fff',
                        opacity: isPrimary ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#fff' : '#111' }}>Referrer</h3>
                  <Input
                    value={referrer}
                    placeholder="The primary name of the referrer (Optional)"
                    style={{
                      marginTop: '8px',
                      padding: '12px 16px',
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '14px',
                      color: isDark ? '#fff' : '#111',
                      maxWidth: '70%',
                    }}
                    type="text"
                    onChange={(e) => {
                      if (e.target.value.includes('.')) {
                        setReferrer('')
                      } else {
                        setReferrer(e.target.value.toLowerCase())
                      }
                    }}
                  />
                </div>

                <div style={{ display: 'flex', marginTop: '24px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#fff' : '#111' }}>
                      Pay with Cake ({price.cake} $CAKE)
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setUseToken(!useToken)
                      setToken('0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82')
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: `3px solid ${isDark ? '#555' : '#ddd'}`,
                      background: useToken && token == '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82' ? '#111' : (isDark ? '#333' : '#f4f4f4'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Check
                      style={{
                        width: '16px',
                        height: '16px',
                        color: '#fff',
                        opacity: useToken && token == '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82' ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                <div style={{ display: 'flex', marginTop: '20px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: isDark ? '#fff' : '#111' }}>
                      Pay with USD1 ({price.usd1} $USD1)
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setUseToken(!useToken)
                      setToken('0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d')
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      border: `3px solid ${isDark ? '#555' : '#ddd'}`,
                      background: useToken && token == '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d' ? '#111' : (isDark ? '#333' : '#f4f4f4'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Check
                      style={{
                        width: '16px',
                        height: '16px',
                        color: '#fff',
                        opacity: useToken && token == '0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d' ? 1 : 0,
                        transition: 'opacity 0.2s ease',
                      }}
                    />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                {!isDisconnected && (
                  <button
                    style={buttonPrimaryStyle}
                    onClick={() => setNext(1)}
                    disabled={isLoading}
                  >
                    Continue
                  </button>
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
            <div style={{ ...cardStyle, padding: '32px', marginTop: '20px' }}>
              <RegistrationSteps />
              <div style={{ marginTop: '40px' }}>
                <div style={{ display: 'inline-flex', background: isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f4', borderRadius: '9999px', padding: '4px' }}>
                  {(['BNB', 'USD'] as const).map((curr) => {
                    const isActive = curr === currency
                    return (
                      <button
                        key={curr}
                        onClick={() => {
                          setCurrency(curr)
                          setBnb(!bnb)
                        }}
                        style={{
                          padding: '10px 20px',
                          fontSize: '14px',
                          fontWeight: 500,
                          borderRadius: '9999px',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          background: isActive ? (isDark ? '#fff' : '#111') : 'transparent',
                          color: isActive ? (isDark ? '#000' : '#fff') : (isDark ? '#888' : '#666'),
                        }}
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

              <div style={{ display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'center' }}>
                <button
                  style={buttonSecondaryStyle}
                  onClick={() => setNext((prev) => prev - 1)}
                >
                  Back
                </button>
                <button
                  style={buttonPrimaryStyle}
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
            <div style={{ ...cardStyle, padding: '40px', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', color: isDark ? '#fff' : '#111' }}>
                Almost there
              </h2>

              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '128px',
                  height: '128px',
                  borderRadius: '50%',
                  border: '8px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: isDark ? '#fff' : '#111',
                }}>
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

              <p style={{ textAlign: 'center', fontSize: '14px', color: isDark ? '#aaa' : '#666', padding: '0 16px' }}>
                This wait prevents others from front running your transaction.
                <br />
                You'll complete the second transaction when the timer ends.
              </p>

              <div style={{ display: 'flex', gap: '16px', width: '100%', marginTop: '16px' }}>
                <button
                  onClick={() => setNext((prev) => prev - 1)}
                  style={{ ...buttonSecondaryStyle, flex: 1 }}
                >
                  Back
                </button>
                {done == false ? (
                  <button
                    disabled
                    style={{
                      ...buttonPrimaryStyle,
                      flex: 1,
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }}
                  >
                    Wait...
                  </button>
                ) : (
                  <button
                    style={{ ...buttonPrimaryStyle, flex: 1 }}
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
            <div style={{ ...cardStyle, padding: '40px', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
              <RegisterDetailsModal
                isOpen={isOpen}
                onRequestClose={() => setNext((prev) => prev - 1)}
                name={`${label}.safu` || ''}
                action="Register name"
                duration={durationString}
              />
              {registerPending ? (
                <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', color: isDark ? '#fff' : '#111' }}>
                  Waiting for transaction to complete...
                </h2>
              ) : !registerhash ? (
                <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', color: isDark ? '#fff' : '#111' }}>
                  Complete your registration
                </h2>
              ) : registerError ? (
                <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', color: isDark ? '#fff' : '#111' }}>
                  There was an error while registering your name. Please{' '}
                  <span
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setIsOpen(true)}
                  >
                    try again
                  </span>
                </h2>
              ) : registerhash ? (
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                  <div style={{ ...cardStyle, padding: '40px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: isDark ? '#fff' : '#111' }}>
                      Congratulations!
                    </h1>
                    <p style={{ color: isDark ? '#aaa' : '#666', marginBottom: '24px' }}>
                      You are now the owner of{' '}
                      <span style={{ fontWeight: 600, color: isDark ? '#fff' : '#111' }}>
                        {label}.safu
                      </span>
                    </p>

                    <div style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '20px',
                      padding: '40px',
                      marginBottom: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}>
                      <div style={{
                        background: isDark ? '#111' : '#fff',
                        borderRadius: '50%',
                        padding: '12px',
                        marginBottom: '16px',
                      }}>
                        <Check style={{ width: '32px', height: '32px', color: isDark ? '#fff' : '#111' }} />
                      </div>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '18px' }}>{`${label}.safu`}</p>
                    </div>

                    <div style={{
                      background: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f4',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '24px',
                      textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: isDark ? '#888' : '#666', fontSize: '14px' }}>
                          {durationString}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: isDark ? '#fff' : '#111' }}>
                          {price.bnb} BNB{' '}
                          <span style={{ color: isDark ? '#888' : '#666' }}>{`($${price.usd})`}</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: isDark ? '#888' : '#666', fontSize: '14px' }}>Name expires</span>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: isDark ? '#fff' : '#111' }}>
                          {dateText?.toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button
                        onClick={() => router.push(`/`)}
                        style={buttonSecondaryStyle}
                      >
                        Register another
                      </button>
                      <button
                        onClick={() => router.push(`/resolve/${label}`)}
                        style={buttonPrimaryStyle}
                      >
                        View name
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Register
