import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useReadContract } from 'wagmi'
import { IdentificationIcon } from '@heroicons/react/outline'
import { CustomConnect } from '@/components/connectButton'
import { constants } from '../constant'
import { motion } from 'framer-motion'
import { BookOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const navigate = useNavigate()
  const [available, setAvailable] = useState('')
  const [search, setSearch] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  const { data, isPending } = useReadContract({
    address: constants.Controller,
    functionName: 'available',
    abi: abi,
    args: [search],
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const [showBox, setShowBox] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const navLinks = [
    { to: '', label: '', isExternal: false },
    {
      href: 'https://safuverse.gitbook.io/safuverse-docs/',
      label: 'Docs',
      isExternal: true,
    },
  ]

  const activeLinkClasses = 'text-yellow-400 font-semibold'

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
      setAvailable('Loading…')
    } else if (data === true) {
      setAvailable('Available')
    } else if (data === false) {
      setAvailable('Registered')
    } else {
      setAvailable('') // or whatever default you like
    }
  }, [search, isPending, data])
  const handleChange = (e: any) => {
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
      navigate(`/register/${search}`)
    } else if (available == 'Registered') {
      navigate(`/resolve/${search}`)
    }
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -30 }} // Initial animation state
      animate={{ opacity: 1, y: 0 }} // Animation to visible state
      transition={{ duration: 0.7, ease: 'easeOut' }} // Animation transition properties
      // Adjusted background color to the specific hex code #141b33
      className={`fixed top-4 left-0 right-0 max-w-6xl mx-auto z-50 transition-all duration-300 px-4 sm:pl-6 lg:pl-8
                  ${
                    isScrolled || mobileMenuOpen
                      ? 'bg-neutral-950 py-2 shadow-xl'
                      : 'bg-neutral-950 py-1 shadow-lg'
                  }  ${mobileMenuOpen ? 'rounded-sm' : 'rounded-full'}
        
                 `}
    >
      <div className="flex justify-between items-center h-13">
        <a href="https://safuverse.com" className="flex items-center gap-1.5">
          <img
            src="/Safuverse.png"
            className="text-xl font-bold text-[#FFB000] h-10 hidden lg:block"
          />
          <img
            src="/small.png"
            className="text-xl font-bold text-[#FFB000] h-14 lg:hidden block"
          />
        </a>
        <div
          className={`ml-5 relative ${
            location.pathname == '/' ? 'hidden' : 'block'
          }`}
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a name"
            onChange={handleChange}
            className="w-60 md:w-70 lg:w-96 px-6 py-2 rounded-xl text-[17px] bg-transparent text-white border border-gray-700 placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500 hidden md:flex"
          />

          {/* Search Results Popup */}
          <div
            ref={boxRef}
            className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-60 md:w-70 lg:w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-lg text-left z-10 transform origin-top
              transition-transform duration-300 ease-out
              overflow-hidden ${showBox ? 'scale-y-100' : 'scale-y-0'}`}
          >
            <ul className="divide-y divide-gray-700">
              <li
                className="px-6 py-3  hover:bg-gray-700 rounded-xl cursor-pointer flex items-center justify-between"
                onClick={route}
              >
                <div className="text-[17px]">{`${
                  search != '' ? search + '.safu' : ''
                }`}</div>{' '}
                {available != '' ? (
                  <div className="text-[10px] bg-green-800 text-green-300 p-1 rounded-full">
                    {available}
                  </div>
                ) : (
                  ''
                )}
              </li>
            </ul>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-7">
          <div
            className="text-gray-200 hover:text-yellow-400 font-semibold hidden md:flex items-center duration-200 cursor-pointer max-w-max gap-1 flex-nowrap"
            onClick={() => navigate(`/mynames`)}
          >
            <IdentificationIcon className="w-7 h-7 flex-shrink-0" />
            <span className="w-full inline-flex max-w-max"> My Names</span>
          </div>
          {navLinks.map((link) =>
            link.isExternal || link.href ? (
              <a
                key={link.label}
                href={link.href || link.to}
                className="text-gray-200 hover:text-yellow-400 transition-colors duration-200 font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.to as string}
                className={({ isActive }) =>
                  `text-gray-200 hover:text-yellow-400 transition-colors duration-200 font-semibold ${
                    isActive ? activeLinkClasses : ''
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ),
          )}
          <a
            href="https://academy.safuverse.com/courses/all"
            className={`text-gray-200 hover:text-yellow-400 transition-colors duration-200 flex items-center -ml-7 font-semibold`}
          >
            <BookOpen className="w-4 h-4 mr-1" />
            View Courses
          </a>
          <div className="hidden md:flex -ml-4">
            {' '}
            <CustomConnect />
          </div>
        </div>
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-gray-200 hover:text-yellow-400"
          >
            {mobileMenuOpen ? (
              <X size={26} />
            ) : (
              <div className="items-center mr-3">
                <div className="bg-neutral-800 rounded-full p-3 flex flex-col justify-center w-12 h-12 cursor-pointer">
                  <div className="border-[#FFB000] border-b-[2px] w-6"></div>
                  <div className="border-[#FFB000] border-b-[2px] w-4 mt-3"></div>
                </div>
              </div>
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-neutral-950 py-3 shadow-lg rounded-lg"
        >
          <div className="flex flex-col items-center space-y-4">
            <div
              className="font-semibold flex items-center text-gray-200 hover:text-yellow-400 duration-200 cursor-pointer max-w-max gap-3 flex-nowrap"
              onClick={() => navigate(`/mynames`)}
            >
              <IdentificationIcon className="w-7 h-7 flex-shrink-0" />
              <span className="w-full inline-flex max-w-max"> My Names</span>
            </div>
            {navLinks.map((link) => (
              <NavLink
                key={link.label}
                to={link.to as string}
                className={({ isActive }) =>
                  `text-gray-200 hover:text-yellow-400 transition-colors duration-200 font-semibold ${
                    isActive ? activeLinkClasses : ''
                  }`
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {}
            <a
              href="https://dns.safuverse.com/courses/all"
              className={`text-gray-200 hover:text-yellow-400 transition-colors duration-200 flex items-center font-semibold -mt-3
            `}
            >
              {' '}
              <BookOpen className="w-4 h-4 mr-2" />
              View Courses
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}
