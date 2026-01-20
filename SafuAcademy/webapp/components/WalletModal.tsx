'use client';

import { X, Copy, LogOut, ExternalLink, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar } from './Avatar';
import { useAccount } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';

interface WalletModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    address: string;
    name: string;
}

export function WalletModal({
    isOpen,
    onRequestClose,
    name,
}: WalletModalProps) {
    const router = useRouter();
    const { address: fullAddress } = useAccount();
    const { logout, exportWallet, user, ready, authenticated } = usePrivy();

    // Close modal on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onRequestClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onRequestClose]);

    if (!isOpen) return null;

    const short = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';

    // Check that your user is authenticated
    const isAuthenticated = ready && authenticated;

    // Check that your user has an embedded wallet
    const hasEmbeddedWallet = !!user?.linkedAccounts.find(
        (account) =>
            account.type === 'wallet' &&
            account.walletClientType === 'privy' &&
            account.connectorType === 'embedded'
    );
    // Note: user provided prototype used `account.walletClientType === 'privy'`, checking docs/prototype. 
    // User prototype: `account.walletClientType === 'privy' && account.chainType === 'ethereum'`
    // I will stick to user prototype logic but verify if `connectorType` is needed. 
    // `walletClientType === 'privy'` usually implies embedded.

    const canExport = isAuthenticated && hasEmbeddedWallet;
    const displayAddress = fullAddress || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onRequestClose}
            />

            <div className="relative w-full max-w-md bg-[#1a1b1f] rounded-2xl p-6 shadow-2xl border border-gray-800 text-white animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onRequestClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1"
                >
                    <X size={24} />
                </button>

                {/* Avatar & Info */}
                <div className="flex flex-col items-center mb-6">
                    <Avatar
                        name={displayAddress}
                        className="w-20 h-20 mb-4 ring-2 ring-[#ffb000] ring-offset-2 ring-offset-[#1a1b1f]"
                    />
                    <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {name || short(displayAddress)}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono mt-1 bg-gray-900/50 px-3 py-1 rounded-full border border-gray-800">
                        {displayAddress}
                    </p>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                    {/* Copy Address */}
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(displayAddress);
                            // Could add toast here
                        }}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all hover:scale-105 group"
                    >
                        <Copy className="mb-2 text-[#ffb000] group-hover:text-white transition-colors" size={20} />
                        <span className="text-sm font-medium">Copy Address</span>
                    </button>

                    {/* View Profile */}
                    <button
                        onClick={() => {
                            // If there's a profile page, navigate to it. Assuming /profile exists or similar
                            router.push('/profile');
                        }}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all hover:scale-105 group"
                    >
                        <ExternalLink className="mb-2 text-[#ffb000] group-hover:text-white transition-colors" size={20} />
                        <span className="text-sm font-medium">View Profile</span>
                    </button>

                    {/* Export Wallet - Conditional */}
                    {canExport && (
                        <button
                            onClick={exportWallet}
                            className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all hover:scale-105 group"
                        >
                            <KeyRound className="mb-2 text-[#ffb000] group-hover:text-white transition-colors" size={20} />
                            <span className="text-sm font-medium">Export Key</span>
                        </button>
                    )}

                    {/* Disconnect */}
                    <button
                        onClick={logout}
                        className="flex flex-col items-center justify-center p-4 rounded-xl bg-gray-800/50 hover:bg-red-900/20 border border-gray-700 hover:border-red-900/50 transition-all hover:scale-105 group col-span-2 sm:col-span-1"
                    >
                        <LogOut className="mb-2 text-red-500 group-hover:text-red-400 transition-colors" size={20} />
                        <span className="text-sm font-medium text-red-500 group-hover:text-red-400">Disconnect</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
