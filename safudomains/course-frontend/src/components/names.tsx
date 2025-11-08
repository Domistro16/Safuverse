import { useAccount } from 'wagmi'
import { useAllOwnedNames } from '../hooks/getAllNames'
import { useEffect, useMemo, useState } from 'react'
import { WrappedBadge } from './badge'
import { Avatar } from './useAvatar'
import { useNavigate } from 'react-router-dom'
export default function Names() {
  useEffect(() => {
    document.title = `My Names`
  }, [])
  const { address } = useAccount()
  const navigate = useNavigate()
  const { domains } = useAllOwnedNames(address?.toLowerCase() as string)
  const [sortBy, setSortBy] = useState<'name' | 'expiry'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const sortedDomains = useMemo(() => {
    const arr = [...domains]
    arr.sort((a, b) => {
      let cmp: number
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else {
        // compare numeric expiryDate
        cmp = a.expiryDate - b.expiryDate
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [domains, sortBy, sortDir])

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(5)
  const totalPages = Math.ceil(domains.length / perPage)

  // 2️⃣ Compute the slice for the current page
  const pageDomains = useMemo(() => {
    const start = (page - 1) * perPage
    return sortedDomains.slice(start, start + perPage)
  }, [sortedDomains, page, perPage])

  return (
    <div>
      <div className="min-h-screen text-white space-y-5 p-3 mx-auto md:px-30 md:mt-10 lg:px-60">
        <h1 className="text-4xl font-bold">Names</h1>

        {/* Controls Bar */}
        <div className="flex flex-wrap items-center gap-4  border-1 border-neutral-500 bg-neutral-800 p-4 rounded-lg">
          {/* Select All Checkbox */}
          <button className="flex items-center justify-center w-10 h-10 bg-neutral-700 rounded-full hover:bg-neutral-600">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>

          {/* Expiry Date Dropdown */}
          <div className="relative">{/* Dropdown menu would go here */}</div>

          {/* Sort Buttons */}
          <button
            onClick={() => {
              if (sortBy === 'name') {
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
              } else {
                setSortBy('name')
                setSortDir('asc')
              }
            }}
            className={`px-3 py-1 rounded ${
              sortBy === 'name'
                ? 'bg-blue-400 text-white'
                : 'bg-neutral-700 text-gray-300'
            }`}
          >
            Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>

          {/* Sort by Expiry */}
          <button
            onClick={() => {
              if (sortBy === 'expiry') {
                setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
              } else {
                setSortBy('expiry')
                setSortDir('asc')
              }
            }}
            className={`px-3 py-1 rounded ${
              sortBy === 'expiry'
                ? 'bg-blue-400 text-white'
                : 'bg-neutral-700 text-gray-300'
            }`}
          >
            Expiry {sortBy === 'expiry' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
          </button>

          {/* Search Input */}
          <div className="ml-auto">
            <input
              type="text"
              placeholder="Search"
              className="px-4 py-2 bg-neutral-800 border-1 border-neutral-500 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Names Table */}
        {/* Names Table */}
        <div className="bg-neutral-800 rounded-lg p-6 border-1 border-neutral-500">
          {pageDomains.length > 0 ? (
            <ul className="divide-y divide-neutral-700">
              {pageDomains.map((domain, idx) => {
                // derive a friendly expiry/status message + color
                const nowSec = Date.now() / 1000
                const secondsLeft = domain.expiryDate - nowSec - 259200
                let statusText: string
                let statusClass: string

                if (secondsLeft <= 0) {
                  statusText = 'Expired'
                  statusClass = 'text-red-500'
                } else if (secondsLeft < 30 * 24 * 3600) {
                  statusText = `Expires in ${Math.ceil(
                    secondsLeft / 86400,
                  )} day${Math.ceil(secondsLeft / 86400) > 1 ? 's' : ''}`
                  statusClass = 'text-orange-400'
                } else {
                  const months = Math.round(secondsLeft / (30 * 24 * 3600))
                  statusText = `Expires in ${months} month${
                    months > 1 ? 's' : ''
                  }`
                  statusClass = 'text-gray-400'
                }

                return (
                  <li
                    key={domain.name + idx}
                    className="flex items-center justify-between py-4 md:px-4 hover:bg-neutral-700 rounded-md transition-colors cursor-pointer"
                    onClick={() => {
                      navigate(`/resolve/${domain.name.replace(/\.safu$/, '')}`)
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Placeholder avatar circle */}
                      <Avatar name={domain.name} className="w-8 h-8" />
                      <div className="leading-tight">
                        <p className="text-white font-medium">{domain.name}</p>
                        <p className={`${statusClass} text-sm`}>{statusText}</p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2">
                      <WrappedBadge name={domain.name} tag={'Manager'} />
                      <WrappedBadge name={domain.name} tag={'Owner'} />
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-gray-400 text-center py-12">
              No names found for this address
            </p>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-neutral-700 rounded disabled:opacity-50"
                >
                  ← Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-2 py-1 rounded ${
                        p === page
                          ? 'bg-blue-400 text-white'
                          : 'bg-neutral-700 text-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-neutral-700 rounded disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
            <div>
              <select className="px-3 py-1 bg-neutral-700 text-white rounded-md">
                <option
                  onClick={() => {
                    setPerPage(5)
                  }}
                >
                  5 per page
                </option>
                <option
                  onClick={() => {
                    setPerPage(10)
                  }}
                >
                  10 per page
                </option>
                <option
                  onClick={() => {
                    setPerPage(20)
                  }}
                >
                  20 per page
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
