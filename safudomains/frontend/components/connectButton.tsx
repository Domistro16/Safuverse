'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useENSName } from '../hooks/getPrimaryName';
import { Avatar } from './useAvatar';
import { WalletModal } from './walletModal';
import { useState } from 'react';

export const CustomConnect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { login, logout, ready, authenticated } = usePrivy();
  const { address, isConnected } = useAccount();

  const { name } = useENSName({
    owner: address as `0x${string}`,
  });

  if (!ready) {
    return (
      <div style={{ opacity: 0, pointerEvents: 'none', userSelect: 'none' }}>
        <button
          className="bg-[#FFB000] text-black p-8 py-[8px] font-bold rounded-full"
          type="button"
        >
          Loading...
        </button>
      </div>
    );
  }

  if (!authenticated || !isConnected) {
    return (
      <button
        className="bg-[#FFB000] text-black p-8 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
        type="button"
        onClick={login}
      >
        Login
      </button>
    );
  }

  // Ensure name is a string, default to empty string if null/undefined
  const safeName = (name && typeof name === 'string') ? name : '';
  const displayName = safeName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected');

  return (
    <div
      className="font-bold cursor-pointer hover:scale-105 duration-200"
      style={{ display: 'flex', gap: 12 }}
    >
      <button
        className="bg-neutral-900 p-3 py-[8px] rounded-full cursor-pointer flex gap-2 items-center hover:scale-105 duration-200"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Avatar
          name={safeName || (address as string)}
          className="w-8 h-8"
        />
        <div className="text-white">{displayName}</div>
      </button>

      <WalletModal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        address={address as string}
        name={safeName}
        balance=""
      />
    </div>
  );
};
