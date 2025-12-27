'use client';

import { useAccount } from 'wagmi'
import { useAllOwnedNames } from '../hooks/getAllNames'
import { useEffect, useMemo, useState } from 'react'
import { WrappedBadge } from './badge'
import { Avatar } from './useAvatar'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Search, SortAsc, SortDesc } from 'lucide-react'
import { shortenAddress } from '../utils/domainUtils'

const THEME_KEY = 'safudomains-theme'

export default function Names() {
  const { address, isDisconnected } = useAccount()
  const router = useRouter()
  const { domains, isLoading: domainsLoading } = useAllOwnedNames(address?.toLowerCase() as string)
  const [sortBy, setSortBy] = useState<'name' | 'expiry'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    document.title = `My Names`
  }, [])

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    }

    // Listen for body class changes (when nav toggles dark mode)
    const observer = new MutationObserver(() => {
      const isDarkMode = document.body.classList.contains('dark-mode')
      setTheme(isDarkMode ? 'dark' : 'light')
    })

    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })

    // Check initial state from body class
    if (document.body.classList.contains('dark-mode')) {
      setTheme('dark')
    }

    return () => observer.disconnect()
  }, [])

  const isDark = theme === 'dark'

  // Filter by search query
  const filteredDomains = useMemo(() => {
    if (!searchQuery) return domains
    return domains.filter((d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [domains, searchQuery])

  const sortedDomains = useMemo(() => {
    const arr = [...filteredDomains]
    arr.sort((a, b) => {
      let cmp: number
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else {
        cmp = a.expiryDate - b.expiryDate
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filteredDomains, sortBy, sortDir])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const totalPages = Math.ceil(sortedDomains.length / perPage)

  const pageDomains = useMemo(() => {
    const start = (page - 1) * perPage
    return sortedDomains.slice(start, start + perPage)
  }, [sortedDomains, page, perPage])

  // Card styles
  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'saturate(180%) blur(28px)',
    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.06)',
    borderRadius: '26px',
    boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.55)' : '0 22px 55px rgba(0,0,0,0.08)',
  }

  const buttonPrimaryStyle = {
    padding: '12px 24px',
    background: isDark ? '#fff' : '#111',
    color: isDark ? '#000' : '#fff',
    border: 'none',
    borderRadius: '40px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
    transition: 'all 0.25s ease',
  }

  if (isDisconnected) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="hero-spacer" />
        <div style={{ ...cardStyle, padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: isDark ? '#fff' : '#111', marginBottom: '16px' }}>
            Connect Wallet
          </h2>
          <p style={{ color: isDark ? '#aaa' : '#666', marginBottom: '24px' }}>
            Please connect your wallet to view your domains.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="hero-spacer" />
      <div className="flex flex-col mx-auto p-4 mb-20 md:mb-5 md:px-30 mt-10 lg:px-60">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: isDark ? '#f8f8f8' : '#111' }}>
              My Names
            </h2>
            <div style={{ fontSize: '14px', color: isDark ? '#aaa' : '#666' }}>
              {shortenAddress(address as string)}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div style={{ ...cardStyle, padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Search */}
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: isDark ? '#888' : '#666',
                    width: '18px',
                    height: '18px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search domains..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 48px',
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f4',
                    border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                    borderRadius: '14px',
                    fontSize: '14px',
                    color: isDark ? '#fff' : '#111',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Sort buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    } else {
                      setSortBy('name')
                      setSortDir('asc')
                    }
                    setPage(1)
                  }}
                  style={{
                    padding: '10px 16px',
                    background: sortBy === 'name' ? (isDark ? '#fff' : '#111') : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f4'),
                    color: sortBy === 'name' ? (isDark ? '#000' : '#fff') : (isDark ? '#aaa' : '#666'),
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Name
                  {sortBy === 'name' && (
                    sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>

                <button
                  onClick={() => {
                    if (sortBy === 'expiry') {
                      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                    } else {
                      setSortBy('expiry')
                      setSortDir('asc')
                    }
                    setPage(1)
                  }}
                  style={{
                    padding: '10px 16px',
                    background: sortBy === 'expiry' ? (isDark ? '#fff' : '#111') : (isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f4'),
                    color: sortBy === 'expiry' ? (isDark ? '#000' : '#fff') : (isDark ? '#aaa' : '#666'),
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Expiry
                  {sortBy === 'expiry' && (
                    sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />
                  )}
                </button>
              </div>

              {/* Per page select */}
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                style={{
                  padding: '10px 16px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#f4f4f4',
                  border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: isDark ? '#fff' : '#111',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>

          {/* Domain List */}
          {domainsLoading ? (
            <div style={{ ...cardStyle, padding: '60px 40px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: isDark ? '#fff' : '#111', marginBottom: '12px' }}>
                Loading...
              </h3>
              <p style={{ color: isDark ? '#aaa' : '#666', marginBottom: '24px' }}>
                Fetching your .safu domains.
              </p>
            </div>
          ) : sortedDomains.length === 0 ? (
            <div style={{ ...cardStyle, padding: '60px 40px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: isDark ? '#fff' : '#111', marginBottom: '12px' }}>
                No domains found
              </h3>
              <p style={{ color: isDark ? '#aaa' : '#666', marginBottom: '24px' }}>
                {searchQuery
                  ? 'No domains match your search query.'
                  : 'You don\'t have any .safu domains yet.'}
              </p>
              {!searchQuery && (
                <button
                  style={buttonPrimaryStyle}
                  onClick={() => router.push('/')}
                >
                  Register a Domain
                </button>
              )}
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pageDomains.map((domain, idx) => {
                  const nowSec = Date.now() / 1000
                  const secondsLeft = domain.expiryDate - nowSec - 259200
                  let statusText: string
                  let statusColor: string

                  if (secondsLeft <= 0) {
                    statusText = 'Expired'
                    statusColor = '#ef4444'
                  } else if (secondsLeft < 30 * 24 * 3600) {
                    statusText = `Expires in ${Math.ceil(secondsLeft / 86400)} day${Math.ceil(secondsLeft / 86400) > 1 ? 's' : ''}`
                    statusColor = '#f59e0b'
                  } else {
                    const months = Math.round(secondsLeft / (30 * 24 * 3600))
                    statusText = `Expires in ${months} month${months > 1 ? 's' : ''}`
                    statusColor = isDark ? '#888' : '#666'
                  }

                  const isExpired = secondsLeft <= 0
                  const isExpiringSoon = secondsLeft > 0 && secondsLeft < 30 * 24 * 3600

                  return (
                    <div
                      key={domain.name + idx}
                      style={{
                        ...cardStyle,
                        padding: '20px 24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => router.push(`/resolve/${domain.name.replace(/\.safu$/, '')}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = isDark
                          ? '0 30px 60px rgba(0,0,0,0.65)'
                          : '0 28px 65px rgba(0,0,0,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = isDark
                          ? '0 25px 50px rgba(0,0,0,0.55)'
                          : '0 22px 55px rgba(0,0,0,0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Avatar name={domain.name} className="w-12 h-12 rounded-full" />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '16px', color: isDark ? '#fff' : '#111' }}>
                              {domain.name}
                            </div>
                            <div style={{ fontSize: '13px', color: statusColor, marginTop: '2px' }}>
                              {statusText}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <WrappedBadge name={domain.name} tag={'Manager'} />
                            <WrappedBadge name={domain.name} tag={'Owner'} />
                          </div>
                          {(isExpired || isExpiringSoon) && (
                            <div
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: 600,
                                background: isExpired
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'rgba(245, 158, 11, 0.1)',
                                color: isExpired ? '#ef4444' : '#f59e0b',
                              }}
                            >
                              {isExpired ? 'Expired' : 'Expiring Soon'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: page === 1 ? (isDark ? '#333' : '#eee') : (isDark ? '#fff' : '#111'),
                      color: page === 1 ? (isDark ? '#666' : '#999') : (isDark ? '#000' : '#fff'),
                      border: 'none',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div style={{ fontSize: '14px', color: isDark ? '#aaa' : '#666' }}>
                    Page {page} of {totalPages}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: page === totalPages ? (isDark ? '#333' : '#eee') : (isDark ? '#fff' : '#111'),
                      color: page === totalPages ? (isDark ? '#666' : '#999') : (isDark ? '#000' : '#fff'),
                      border: 'none',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: isDark ? '#888' : '#666' }}>
                Showing {pageDomains.length} of {sortedDomains.length} domains
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
