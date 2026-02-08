'use client';

import { useEffect, useState, useMemo } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { useAccount, useReadContract, useChainId } from 'wagmi'
import { useParams, useRouter } from 'next/navigation'
import { useENSName } from '../hooks/getPrimaryName'
import { normalize } from 'viem/ens'
import { getConstants } from '../constant'
import { Controller } from '../constants/registerAbis'
import { useRegistrationPrice } from '../hooks/useRegistrationPrice'
import { useRegistration } from '../hooks/useRegistration'
import { usePremiumCheck } from '../hooks/usePremiumCheck'
import SetupModal from './register/SetupModal'
import ConfirmDetailsModal from './register/ConfirmDetailsModal'
import RegisterDetailsModal from './register/RegisterDetailsModal'
import RegistrationSteps from './register/RegistrationSteps'
import { AgentPriceTag } from './AgentPriceTag'
import { AgentPatternInfo } from './AgentPatternInfo'
import { Input } from './ui/input'

const THEME_KEY = 'safudomains-theme'

const Register = () => {
  const router = useRouter()
  const params = useParams()
  const label = params.label as string
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    }

    const observer = new MutationObserver(() => {
      const isDarkMode = document.body.classList.contains('dark-mode')
      setTheme(isDarkMode ? 'dark' : 'light')
    })

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    if (document.body.classList.contains('dark-mode')) {
      setTheme('dark')
    }

    return () => observer.disconnect()
  }, [])

  const isDark = theme === 'dark'

  const { address, isDisconnected } = useAccount()
  const { name: myName } = useENSName({ owner: address as `0x${string}` })
  const [isPrimary, setIsPrimary] = useState(myName ? false : true)

  const [next, setNext] = useState(0)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (!myName) {
      setIsPrimary(true)
    }
  }, [myName, isPrimary])

  const [owner, setOwner] = useState(
    address || ('0x0000000000000000000000000000000000000000' as `0x${string}`),
  )

  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [twitter, setTwitter] = useState('')
  const [website, setWebsite] = useState('')
  const [github, setGithub] = useState('')
  const [discord, setDiscord] = useState('')
  const [phone, setPhone] = useState('')
  const [avatar, setAvatar] = useState('')
  const [referrer, setReferrer] = useState('')
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  const [referralValidating, setReferralValidating] = useState(false)
  const [newRecords, setNewRecords] = useState<{ key: string; value: string }[]>([])

  // v2 hooks - lifetime only, no duration
  const { price, loading, priceResult, isAgentName } = useRegistrationPrice({
    label: label as string,
  })

  // Premium name check
  const { isPremium, requiresAuction, hasActiveAuction, isLoading: premiumLoading } = usePremiumCheck(label)

  const {
    commitData,
    isLoading,
    registerhash,
    registerError,
    registerPending,
    buildCommitDataFn,
    register: registerFn,
  } = useRegistration()

  useEffect(() => {
    const ref = localStorage.getItem('ref')
    if (ref) {
      setReferrer(normalize(ref))
    }
  }, [label])

  // Real-time referral code validation with debounce
  useEffect(() => {
    if (!referrer || referrer.trim() === '') {
      setReferralValid(null)
      setReferralValidating(false)
      return
    }

    setReferralValidating(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/referral/validate/${encodeURIComponent(referrer)}`)
        const data = await res.json()
        setReferralValid(data.valid)
      } catch (error) {
        console.error('Referral validation error:', error)
        setReferralValid(false)
      } finally {
        setReferralValidating(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [referrer])

  useEffect(() => {
    if (label != undefined && label.includes('.')) {
      router.push('/')
    }
  }, [])

  useEffect(() => {
    document.title = `Register – ${label}.safu`
  }, [label])

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

  // v2: Direct registration - no commit-reveal required for agent mode
  const register = async () => {
    setIsOpen(true)
    await registerFn(
      label as string,
      address as `0x${string}`,
      0, // seconds ignored in v2
      isPrimary,
      true, // always lifetime
      referrer,
      false, // useToken - not used on Base
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
      null,
      null,
      null,
    )
    setIsOpen(false)
  }

  const chainId = useChainId()
  const constants = getConstants(chainId)

  const { data: available } = useReadContract({
    address: constants.Controller,
    abi: Controller as any,
    functionName: 'available',
    args: [label as string],
  })

  useEffect(() => {
    if (available === false) {
      router.push(`/resolve/${label}`)
    } else if (available === true) {
      setNext(0)
    }
  }, [available, router, label])



  // Premium name - requires auction
  if (isPremium && requiresAuction && !premiumLoading) {
    return (
      <div className="mb-25 md:mb-0">
        <div className="hero-spacer" />
        <div className="flex flex-col mx-auto px-4 md:px-30 mt-10 lg:px-60">
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '20px' }}>
            {label}.safu
          </h2>
          <div className="page-card">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">🏆</span>
              <div>
                <h3 className="text-xl font-bold text-amber-500">
                  Premium Name
                </h3>
                <p className="text-muted-foreground">
                  This name is available via auction only
                </p>
              </div>
            </div>

            {hasActiveAuction ? (
              <button
                onClick={() => router.push(`/auctions?name=${label}`)}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000',
                }}
              >
                View Active Auction →
              </button>
            ) : (
              <p style={{ color: isDark ? '#888' : '#666' }}>
                No active auction for this name. Check back later or browse other auctions.
              </p>
            )}

            <button
              onClick={() => router.push('/auctions')}
              className="btn-secondary w-full mt-4 block"
            >
              Browse All Auctions
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-25 md:mb-0">
      <div className="hero-spacer" />
      <div className="flex flex-col mx-auto px-4 md:px-30 mt-10 lg:px-60">
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '20px' }}>
            {label}.safu
          </h2>

          {next == 0 ? (
            <div className="page-card">
              <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
                Register {label}.safu
              </h1>

              {/* Price Display - v2 Lifetime Only */}
              <div className="page-card mb-6 p-6">
                {loading ? (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">Loading price...</span>
                  </div>
                ) : (
                  <AgentPriceTag
                    name={label}
                    priceUsd={price.usd}
                    priceEth={price.bnb}
                    isAgentName={isAgentName}
                  />
                )}
              </div>

              {/* Agent Pattern Info */}
              <div style={{ marginBottom: '24px' }}>
                <AgentPatternInfo />
              </div>

              {/* Set as Primary Name */}
              <div style={{ display: 'flex', marginTop: '24px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
                    Set as Primary Name
                  </h3>
                  <p className="text-muted-foreground mt-2 text-sm max-w-[400px]">
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
                    background: isPrimary ? 'var(--foreground)' : 'var(--secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Check
                    className="w-5 h-5 text-[var(--background)] transition-opacity duration-200 ease-in-out"
                    style={{
                      opacity: isPrimary ? 1 : 0,
                    }}
                  />
                </button>
              </div>

              {/* Referrer Input */}
              <div className="mt-6">
                <h3 className="text-base font-semibold">Referrer (Optional)</h3>
                <div className="relative max-w-[70%]">
                  <Input
                    value={referrer}
                    placeholder="Enter referral code (e.g., vitalik)"
                    className="input-field mt-2 pr-10 rounded-2xl transition-colors duration-200 ease-in-out"
                    style={{
                      borderColor: referrer
                        ? referralValidating
                          ? 'var(--border)'
                          : referralValid
                            ? '#22c55e'
                            : '#ef4444'
                        : 'var(--border)',
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
                  {referrer && (
                    <div
                      className="absolute right-3 top-1/2 -translate-y-1/2 mt-1"
                    >
                      {referralValidating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : referralValid ? (
                        <Check className="w-[18px] h-[18px] text-[#22c55e]" />
                      ) : (
                        <span className="text-[#ef4444] text-lg font-bold">✕</span>
                      )}
                    </div>
                  )}
                </div>
                {referrer && !referralValidating && (
                  <p
                    style={{
                      marginTop: '6px',
                      fontSize: '13px',
                      color: referralValid ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {referralValid
                      ? `✓ Valid referral code - ${referrer}.safu`
                      : `✕ Invalid referral code - domain doesn't exist`}
                  </p>
                )}
                <p
                  style={{
                    marginTop: '4px',
                    fontSize: '12px',
                    color: isDark ? '#888' : '#666',
                  }}
                >
                  Enter a .safu domain name as your referral code (without .safu)
                </p>
              </div>

              {/* Continue Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' }}>
                {!isDisconnected && (
                  <button
                    className="btn-primary"
                    onClick={() => setNext(1)}
                    disabled={isLoading || loading}
                  >
                    Continue
                  </button>
                )}
              </div>

              {/* Price Summary */}
              {!loading && (
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  ${price.usd} • One-time payment • Lifetime ownership
                </p>
              )}
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
            <div className="page-card mt-5 p-8">
              <RegistrationSteps />
              <div style={{ marginTop: '40px' }}>
                {/* Price Summary for v2 */}
                <div className="page-card p-5 text-center">
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>
                    ${price.usd}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {price.bnb} ETH • Lifetime Registration
                  </div>
                  {isAgentName && (
                    <div style={{ marginTop: '8px' }}>
                      <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        🤖 Agent Price
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'center' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setNext((prev) => prev - 1)}
                >
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setNext((prev) => prev + 1)
                    register()
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Registering...' : 'Register Now'}
                </button>
              </div>
            </div>
          ) : next == 3 ? (
            <div className="page-card p-10 mt-5 flex flex-col items-center gap-6">
              <RegisterDetailsModal
                isOpen={isOpen}
                onRequestClose={() => setNext((prev) => prev - 1)}
                name={`${label}.safu` || ''}
                action="Register name"
                duration="Lifetime"
              />
              {registerPending ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                  <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>
                    Waiting for transaction to complete...
                  </h2>
                </>
              ) : !registerhash ? (
                <>
                  <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                  <h2 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>
                    Processing registration...
                  </h2>
                </>
              ) : registerError ? (
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>
                    Registration Error
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    There was an error while registering your name.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setIsOpen(true)
                      register()
                    }}
                  >
                    Try Again
                  </button>
                </div>
              ) : registerhash ? (
                <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                  <div className="page-card p-10 max-w-[420px] w-full text-center">
                    <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
                      Congratulations!
                    </h1>
                    <p className="text-muted-foreground mb-6">
                      You are now the owner of{' '}
                      <span style={{ fontWeight: 600 }}>
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
                        background: 'var(--card)',
                        borderRadius: '50%',
                        padding: '12px',
                        marginBottom: '16px',
                      }}>
                        <Check style={{ width: '32px', height: '32px', color: 'var(--foreground)' }} />
                      </div>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: '18px' }}>{`${label}.safu`}</p>
                    </div>

                    <div style={{
                      background: 'var(--secondary)',
                      borderRadius: '16px',
                      padding: '16px',
                      marginBottom: '24px',
                      textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span className="text-sm text-muted-foreground">
                          Registration
                        </span>
                        <span className="font-medium text-sm">
                          {price.bnb} ETH{' '}
                          <span className="text-muted-foreground">{`($${price.usd})`}</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-sm text-muted-foreground">Ownership</span>
                        <span style={{ fontWeight: 500, fontSize: '14px', color: '#22c55e' }}>
                          ✓ Lifetime
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button
                        onClick={() => router.push(`/`)}
                        className="btn-secondary"
                      >
                        Register another
                      </button>
                      <button
                        onClick={() => router.push(`/profile`)}
                        className="btn-primary"
                      >
                        View My Names
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
