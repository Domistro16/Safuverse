import { useState, useEffect, useRef } from 'react'
import { useReadContract } from 'wagmi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { constants } from '../constant'
import { FaSearch } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'

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

export default function Home() {
  const navigate = useNavigate()
  const [available, setAvailable] = useState('')
  const [search, setSearch] = useState('')
  const [recents, setRecents] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  const { data, isPending } = useReadContract({
    address: constants.Controller,
    functionName: 'available',
    abi: abi,
    args: [search],
  })
  const [searchParams] = useSearchParams()

  const ref = searchParams.get('ref')

  useEffect(() => {
    if (ref) {
      localStorage.setItem('ref', ref)
    }
  }, [ref])

  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('Recent') as string)
    if (recent?.length > 0) {
      setRecents(recent)
    }
  }, [])
  const [showBox, setShowBox] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const boxRef = useRef<HTMLDivElement | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    document.title = `safu Domains - Get a Domain name with a safu identity`
  }, [])
  const setRecent = (search: string) => {
    const recent = JSON.parse(localStorage.getItem('Recent') as string)
    if (recent == null) {
      localStorage.setItem('Recent', JSON.stringify([search]))
    } else {
      if (recent.includes(search)) {
        return
      }
      recent.push(search)
      localStorage.setItem('Recent', JSON.stringify(recent))
    }
  }
  const updateRecent = (search: string) => {
    const index = recents.indexOf(search)
    const newArray = recents.filter((_, i) => i !== index)
    setRecents(newArray)
    localStorage.setItem('Recent', JSON.stringify(newArray))
  }
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
    if (search.includes('.')) {
      setAvailable('Invalid')
    } else if (search.length < 2) {
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
    setSearch(e.target.value.toLowerCase().trim())
    if (e.target.value.length > 0) {
      setShowBox(true)
    } else {
      setShowBox(false)
    }
  }

  const route = () => {
    if (available == 'Available') {
      setRecent(search)
      navigate(`/register/${search}/`)
    } else if (available == 'Registered') {
      setRecent(search)
      navigate(`/resolve/${search}`)
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="text-white flex flex-col items-center pb-30 md:pb-0">
      {/* Header */}

      {/* Hero Section */}
      <main className="text-center mt-20 md:mt-42">
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-[#FFF700] to-orange-400 text-transparent bg-clip-text">
          Your .safu username
        </h1>
        <p className="mt-4 text-gray-400 text-md md:text-lg  max-w-xl mx-auto">
          Your digital identity accross all web3 platforms. Search your domain
          name below and make it yours.
        </p>

        {/* Search Bar */}
        <div className="mt-10 relative">
          <div
            onClick={() => {
              setOpen(true)
            }}
            className="w-80 md:w-96 pl-6 pr-1 py-1 text-xl text-left flex mx-auto items-center rounded-xl bg-gray-900 font-semibold text-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500  cursor-pointer"
          >
            <div className="flex grow-1 py-3 "> Search For A Name </div>
            <div className="flex items-center bg-[#FFB000] p-4 rounded-xl">
              <FaSearch className="text-black" />
            </div>
          </div>

          {/* Search Results Popup */}
          {open && (
            <div className="bg-black/45 fixed min-h-screen inset-0 flex items-center justify-center p-5 z-10">
              <div
                ref={modalRef}
                className="bg-black/95 h-100 w-[100%] md:w-200 p-5 rounded-2xl"
              >
                <div className="pl-6 py-1 text-xl w-[100%] text-left flex items-center rounded-xl bg-gray-900 font-semibold text-white border border-gray-700 focus:outline-none cursor-pointer">
                  <input
                    ref={inputRef}
                    placeholder="Search For A Name"
                    onChange={handleChange}
                    value={search}
                    className="font-semibold py-3 text-white w-full placeholder-gray-500 flex grow-1 focus:outline-none cursor-pointer"
                  />
                  <button
                    className="flex items-center bg-[#FFB000] p-4 rounded-xl"
                    onClick={route}
                  >
                    <FaSearch className="text-black" />
                  </button>
                </div>
                <div className="text-left mt-5 text-sm text-gray-700 flex md:items-center">
                  Recents
                  <div className="cursor-pointer flex flex-wrap ml-2 gap-3">
                    {recents.map((item, idx) => (
                      <div
                        className={`group ${
                          idx > 0 ? 'md:mt-0' : ''
                        } rounded-full bg-[#FFB000] px-5 py-2 text-black flex items-center text-[12px] md:text-md hover:bg-[#FFB000]/80 transition-all duration-300 cursor-pointer`}
                      >
                        <div
                          key={idx}
                          className=""
                          onClick={() => {
                            setSearch(item)
                            setShowBox(true)
                          }}
                        >
                          {item}
                        </div>
                        <div className="group-hover:ml-3 transition-opacity opacity-0 invisible group-hover:visible group-hover:opacity-100 duration-300 flex">
                          <FaXmark onClick={() => updateRecent(item)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  ref={boxRef}
                  className={`w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg text-left z-10 transform origin-top
              transition-transform duration-300 ease-out
              overflow-hidden ${showBox ? 'scale-y-100' : 'scale-y-0'}`}
                >
                  <ul className="divide-y divide-gray-700">
                    <li
                      className="px-6 py-3 hover:bg-gray-700 font-bold rounded-xl cursor-pointer flex justify-between"
                      onClick={route}
                    >
                      <div>{`${search != '' ? search + '.safu' : ''}`}</div>{' '}
                      {available != '' ? (
                        <div className="text-[13px] bg-green-800 text-green-300 p-1 rounded-full">
                          {available}
                        </div>
                      ) : (
                        ''
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hidden lg:flex space-x-50 items-center w-full">
          <img src="/dns.png" className="h-90 -mt-30" />
          <img src="/dns2.png" className="h-60 mt-7" />
          <img src="/dns3.png" className="h-90 -mt-30" />
        </div>
        <div className="block lg:hidden mt-10 w-full flex justify-center">
          <Carousel className="w-[80%] max-w-md">
            <CarouselContent>
              <CarouselItem>
                <img
                  src="/dns.png"
                  className="h-[250px] object-contain mx-auto"
                />
              </CarouselItem>
              <CarouselItem>
                <img
                  src="/dns2.png"
                  className="h-[250px] object-contain mx-auto"
                />
              </CarouselItem>
              <CarouselItem>
                <img
                  src="/dns3.png"
                  className="h-[250px] object-contain mx-auto"
                />
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </main>
    </div>
  )
}
