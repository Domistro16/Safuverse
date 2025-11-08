import { CustomConnect } from '@/components/connectButton'
import { useAccount } from 'wagmi'
import { IdentificationIcon, SearchIcon } from '@heroicons/react/outline' // or any icon you like
import { useNavigate } from 'react-router-dom'
export const MobileNav = () => {
  
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  return (
    <div>
      <div
        className="md:hidden
        fixed bottom-5 left-1/2 z-10 transform -translate-x-1/2
        inline-flex items-center space-x-4
        bg-neutral-800/75 backdrop-blur-sm
        px-4 py-2 rounded-full
        shadow-lg
        max-w-max
        whitespace-nowrap
        justify-center
        border-4
        border-neutral-700
      "
      >
        {/* Menu toggle */}
        <button className="p-1 rounded-full hover:bg-neutral-700">
          <SearchIcon
            className="w-9 h-9 text-gray-300"
            onClick={() => navigate(`/`)}
          />
        </button>

        {/* Optional label when connected */}
        {isConnected && (
          <IdentificationIcon
            className="w-9 h-9 text-gray-300"
            onClick={() => navigate(`/mynames`)}
          />
        )}

          <CustomConnect />
      </div>
    </div>
  )
}
