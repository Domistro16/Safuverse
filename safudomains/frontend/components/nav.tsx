'use client';

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useReadContract } from 'wagmi'
import { IdentificationIcon } from '@heroicons/react/outline'
import { CustomConnect } from '@/components/connectButton'
import { constants } from '../constant'
import { motion } from 'framer-motion'
import { BookOpen, X, Menu } from 'lucide-react'

const THEME_KEY = 'safudomains-theme'

const abi = [
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

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const [available, setAvailable] = useState('')
  const [search, setSearch] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [theme, setTheme] = useState('light')

  const { data, isPending } = useReadContract({
    address: constants.Controller,
    functionName: 'available',
    abi: abi,
    args: [search],
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [showBox, setShowBox] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    {
      href: 'https://safuverse.gitbook.io/safuverse-docs/',
      label: 'Docs',
      isExternal: true,
    },
  ]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showBox &&
        inputRef.current &&
        boxRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !boxRef.current.contains(event.target as Node)
      ) {
        setShowBox(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showBox])

  useEffect(() => {
    if (search.length < 2) {
      setAvailable('Too Short')
    } else if (isPending) {
      setAvailable('Loading...')
    } else if (data === true) {
      setAvailable('Available')
    } else if (data === false) {
      setAvailable('Registered')
    } else {
      setAvailable('')
    }
  }, [search, isPending, data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    setSearch(e.target.value)
    if (e.target.value.length > 0) {
      setShowBox(true)
    } else {
      setShowBox(false)
    }
  }

  const route = () => {
    if (available == 'Available') {
      router.push(`/register/${search}`)
    } else if (available == 'Registered') {
      router.push(`/resolve/${search}`)
    }
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem(THEME_KEY, nextTheme)
    document.body.classList.toggle('dark-mode', nextTheme === 'dark')
  }

  const isDark = theme === 'dark'

  return (
    <motion.nav
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="top-nav"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        maxWidth: '100%',
        margin: '0 auto',
        zIndex: 999,
        transition: 'all 0.3s ease',
        background: isDark
          ? 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.08), rgba(8,8,8,0.96))'
          : isScrolled
            ? 'rgba(255,255,255,0.85)'
            : 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(14px)',
        borderBottom: isDark
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(0,0,0,0.06)',
        boxShadow: isScrolled ? '0 10px 40px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      <div className="flex justify-between items-center h-[70px] w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <div onClick={() => router.push('/')} className="flex items-center gap-1.5 cursor-pointer">
          <img
            src="/safuverse.png"
            className="h-10 hidden lg:block"
            alt="safuverse"
          />
          <img
            src="/small.png"
            className="h-12 lg:hidden block"
            alt="safuverse"
          />
        </div>

        {/* Search Bar - Hidden on Homepage */}
        <div
          className={`ml-5 relative ${pathname == '/' ? 'hidden' : 'block'}`}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a name"
            onChange={handleChange}
            className="w-60 md:w-70 lg:w-96 px-6 py-2 rounded-full text-[15px] hidden md:flex transition-all"
            style={{
              background: isDark ? 'rgba(255,255,255,0.07)' : '#fff',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              color: isDark ? '#fff' : '#111',
              outline: 'none',
            }}
          />

          {/* Search Results Popup */}
          <div
            ref={boxRef}
            className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-60 md:w-70 lg:w-96 rounded-2xl shadow-lg text-left z-10 origin-top
              transition-transform duration-300 ease-out
              overflow-hidden ${showBox ? 'scale-y-100' : 'scale-y-0'}`}
            style={{
              background: isDark ? 'rgba(30,30,30,0.95)' : '#fff',
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
            }}
          >
            <ul className="divide-y" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}>
              <li
                className="px-6 py-3 cursor-pointer flex items-center justify-between transition-all hover:opacity-80"
                onClick={route}
              >
                <div className="text-[15px] font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>
                  {search != '' ? search + '.safu' : ''}
                </div>
                {available != '' && search != '' && (
                  <div
                    className="text-[11px] px-3 py-1 rounded-full"
                    style={{
                      background: available === 'Available' ? '#14d46b' : available === 'Registered' ? '#f59e0b' : '#888',
                      color: '#fff',
                    }}
                  >
                    {available}
                  </div>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <div
            className="flex items-center gap-1 cursor-pointer font-semibold transition-all hover:opacity-70"
            style={{ color: isDark ? '#f5f5f5' : '#111' }}
            onClick={() => router.push(`/mynames`)}
          >
            <IdentificationIcon className="w-5 h-5 flex-shrink-0" />
            <span>My Names</span>
          </div>

          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-semibold transition-all hover:opacity-70"
              style={{ color: isDark ? '#f5f5f5' : '#111' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}

          <a
            href="https://academy.safuverse.com/courses/all"
            className="flex items-center font-semibold transition-all hover:opacity-70"
            style={{ color: isDark ? '#f5f5f5' : '#111' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Academy
          </a>

          <button
            className="dark-toggle-btn"
            type="button"
            onClick={toggleTheme}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isDark ? '#222' : '#eee',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          <CustomConnect />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-3">
          <button
            className="dark-toggle-btn"
            type="button"
            onClick={toggleTheme}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isDark ? '#222' : '#eee',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: isDark ? '#222' : '#f4f4f4',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? (
              <X size={20} style={{ color: isDark ? '#fff' : '#111' }} />
            ) : (
              <Menu size={20} style={{ color: isDark ? '#fff' : '#111' }} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden py-4"
          style={{
            background: isDark ? 'rgba(10,10,10,0.98)' : 'rgba(255,255,255,0.98)',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex flex-col items-center space-y-4 px-4">
            <div
              className="flex items-center gap-2 cursor-pointer font-semibold"
              style={{ color: isDark ? '#f5f5f5' : '#111' }}
              onClick={() => {
                router.push(`/mynames`)
                setMobileMenuOpen(false)
              }}
            >
              <IdentificationIcon className="w-5 h-5 flex-shrink-0" />
              <span>My Names</span>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="font-semibold"
                style={{ color: isDark ? '#f5f5f5' : '#111' }}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}

            <a
              href="https://academy.safuverse.com/courses/all"
              className="flex items-center font-semibold"
              style={{ color: isDark ? '#f5f5f5' : '#111' }}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Academy
            </a>

            <div className="pt-2">
              <CustomConnect />
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
