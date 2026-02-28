'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';
import { WalletModal } from './WalletModal';
import { useENSName } from '@/hooks/getPrimaryName';
import { useRouter } from 'next/navigation';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: {
        walletAddress: string;
        totalPoints: number;
        isAdmin: boolean;
    } | null;
    domainName: string | null;
}

function emitAuthChanged() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('nexid-auth-changed'));
    }
}

// Read existing auth from localStorage synchronously at init time
function getInitialAuthState(): AuthState {
    if (typeof window === 'undefined') {
        return { isAuthenticated: false, token: null, user: null, domainName: null };
    }
    try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('auth_user');
        if (token && userStr) {
            const user = JSON.parse(userStr);
            return { isAuthenticated: true, token, user, domainName: null };
        }
    } catch {
        // ignore
    }
    return { isAuthenticated: false, token: null, user: null, domainName: null };
}

export function CustomConnect() {
    const { ready, authenticated } = usePrivy();
    const { address, isConnected, chainId } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { switchChain } = useSwitchChain();
    const router = useRouter();
    const [authState, setAuthState] = useState<AuthState>(getInitialAuthState);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const hasAttemptedAuth = useRef(false);

    // Auto-switch to Base mainnet if on wrong chain
    useEffect(() => {
        if (isConnected && chainId && chainId !== base.id) {
            switchChain({ chainId: base.id });
        }
    }, [isConnected, chainId, switchChain]);

    // Clear auth when wallet disconnects
    useEffect(() => {
        // Wait for Privy to finish initialising before deciding to clear.
        // During initialisation, `authenticated` is always false, so without
        // this guard the stored token would be wiped on every page load,
        // causing a sign-message prompt on every navigation / reload.
        if (!ready) return;
        if (!isConnected) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            emitAuthChanged();
            setAuthState({
                isAuthenticated: false,
                token: null,
                user: null,
                domainName: null,
            });
            hasAttemptedAuth.current = false;
        }
        if (!authenticated) {
            hasAttemptedAuth.current = false;
        }
    }, [ready, isConnected, authenticated]);

    // Resolve primary .id domain name via the SafuDomains reverse lookup chain
    const { name: domainName } = useENSName({ owner: address as `0x${string}` });
    const authenticate = useCallback(async () => {
        if (!address || isAuthenticating) return;

        setIsAuthenticating(true);

        try {
            const nonceRes = await fetch('/api/auth/nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address }),
            });

            if (!nonceRes.ok) {
                throw new Error('Failed to get nonce');
            }

            const { message } = await nonceRes.json();
            const signature = await signMessageAsync({ message });

            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: address,
                    signature,
                    message,
                }),
            });

            if (!verifyRes.ok) {
                throw new Error('Verification failed');
            }

            const { token, user } = await verifyRes.json();
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));
            emitAuthChanged();

            setAuthState({
                isAuthenticated: true,
                token,
                user,
                domainName: null,
            });
        } catch (error) {
            console.error('Authentication error:', error);
        } finally {
            setIsAuthenticating(false);
        }
    }, [address, isAuthenticating, signMessageAsync]);

    // Only trigger sign-message flow when truly not authenticated
    // (i.e. no valid token in localStorage for this wallet)
    useEffect(() => {
        if (
            isConnected &&
            authenticated &&
            address &&
            !isAuthenticating &&
            !hasAttemptedAuth.current
        ) {
            // If already authenticated for this wallet, nothing to do
            if (
                authState.isAuthenticated &&
                authState.user?.walletAddress?.toLowerCase() === address.toLowerCase()
            ) {
                return;
            }

            // Check localStorage one more time in case state is stale
            try {
                const token = localStorage.getItem('auth_token');
                const userStr = localStorage.getItem('auth_user');
                if (token && userStr) {
                    const parsedUser = JSON.parse(userStr);
                    if (parsedUser.walletAddress?.toLowerCase() === address.toLowerCase()) {
                        setAuthState({ isAuthenticated: true, token, user: parsedUser, domainName: null });
                        emitAuthChanged();
                        return;
                    }
                }
            } catch {
                // fall through to sign
            }

            hasAttemptedAuth.current = true;
            authenticate();
        }
    }, [
        isConnected,
        authenticated,
        address,
        authState.isAuthenticated,
        authState.user,
        isAuthenticating,
        authenticate,
    ]);

    if (!ready) {
        return (
            <button
                disabled
                className="rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs font-medium text-white opacity-60"
            >
                Loading...
            </button>
        );
    }

    if (!authenticated || !isConnected) {
        return (
            <button
                onClick={() => router.push('/academy-gateway')}
                className="rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs font-medium text-white shadow-inner-glaze transition-colors hover:border-white/20"
            >
                Login
            </button>
        );
    }

    if (isAuthenticating) {
        return (
            <button
                disabled
                className="rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs font-medium text-white opacity-60"
            >
                Signing...
            </button>
        );
    }

    const displayText = (domainName as string | undefined)
        || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected');
    return (
        <>
            <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2.5 rounded-full border border-[#222] bg-[#111] px-4 py-1.5 text-xs font-medium text-white shadow-inner-glaze transition-colors hover:border-white/20"
                type="button"
            >
                <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                {displayText}
            </button>

            <WalletModal
                isOpen={showWalletModal}
                onRequestClose={() => setShowWalletModal(false)}
                address={address || ''}
                name={(domainName as string | undefined) || ''}
            />
        </>
    );
}
