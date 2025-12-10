import { CustomConnect } from '@/components/connectButton'
import { useAccount } from 'wagmi'
import { IdentificationIcon, SearchIcon } from '@heroicons/react/outline'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

const THEME_KEY = 'safudomains-theme'

export const MobileNav = () => {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY)
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark')
    }

    // Listen for theme changes
    const handleStorageChange = () => {
      const newTheme = window.localStorage.getItem(THEME_KEY)
      if (newTheme === 'light' || newTheme === 'dark') {
        setTheme(newTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also check periodically for theme changes
    const interval = setInterval(() => {
      const currentTheme = window.localStorage.getItem(THEME_KEY)
      if (currentTheme && currentTheme !== theme) {
        setTheme(currentTheme)
      }
    }, 500)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [theme])

  const isDark = theme === 'dark'

  return (
    <div>
      <div
        className="md:hidden fixed bottom-5 left-1/2 z-10 transform -translate-x-1/2 inline-flex items-center space-x-4 px-4 py-3 rounded-full shadow-lg max-w-max whitespace-nowrap justify-center"
        style={{
          background: isDark ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(14px)',
          border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 18px 45px rgba(0,0,0,0.15)',
        }}
      >
        {/* Search button */}
        <button
          className="p-2 rounded-full transition-all hover:opacity-70"
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f4',
          }}
          onClick={() => navigate(`/`)}
        >
          <SearchIcon
            className="w-6 h-6"
            style={{ color: isDark ? '#f5f5f5' : '#111' }}
          />
        </button>

        {/* My Names button */}
        {isConnected && (
          <button
            className="p-2 rounded-full transition-all hover:opacity-70"
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : '#f4f4f4',
            }}
            onClick={() => navigate(`/mynames`)}
          >
            <IdentificationIcon
              className="w-6 h-6"
              style={{ color: isDark ? '#f5f5f5' : '#111' }}
            />
          </button>
        )}

        <CustomConnect />
      </div>
    </div>
  )
}
