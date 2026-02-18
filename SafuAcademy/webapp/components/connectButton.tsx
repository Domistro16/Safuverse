'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSignMessage, useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';
import { WalletModal } from './WalletModal';

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

export function CustomConnect() {
    const { login, ready, authenticated } = usePrivy();
    const { address, isConnected, chainId } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const { switchChain } = useSwitchChain();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        token: null,
        user: null,
        domainName: null,
    });
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const hasAttemptedAuth = useRef(false);

    // Auto-switch to Base mainnet if on wrong chain
    useEffect(() => {
        if (isConnected && chainId && chainId !== base.id) {
            switchChain({ chainId: base.id });
        }
    }, [isConnected, chainId, switchChain]);

    useEffect(() => {
        if (!isConnected || !authenticated) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setAuthState({
                isAuthenticated: false,
                token: null,
                user: null,
                domainName: null,
            });
            hasAttemptedAuth.current = false;
        }
    }, [isConnected, authenticated]);

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

    useEffect(() => {
        if (
            isConnected &&
            authenticated &&
            address &&
            !authState.isAuthenticated &&
            !isAuthenticating &&
            !hasAttemptedAuth.current
        ) {
            const token = localStorage.getItem('auth_token');
            const user = localStorage.getItem('auth_user');

            if (token && user) {
                try {
                    const parsedUser = JSON.parse(user);
                    if (
                        parsedUser.walletAddress?.toLowerCase() ===
                        address?.toLowerCase()
                    ) {
                        setAuthState({
                            isAuthenticated: true,
                            token,
                            user: parsedUser,
                            domainName: null,
                        });
                        return;
                    }
                } catch {
                    // continue to wallet sign-in
                }
            }

            hasAttemptedAuth.current = true;
            authenticate();
        }
    }, [
        isConnected,
        authenticated,
        address,
        authState.isAuthenticated,
        isAuthenticating,
        authenticate,
    ]);

    if (!ready) {
        return (
            <button
                disabled
                className="px-6 py-2 bg-black text-white font-semibold rounded-full opacity-50"
            >
                Loading...
            </button>
        );
    }

    if (!authenticated || !isConnected) {
        return (
            <button
                onClick={login}
                className="px-6 py-2 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
            >
                Login
            </button>
        );
    }

    if (isAuthenticating) {
        return (
            <button
                disabled
                className="px-6 py-2 bg-black text-white font-semibold rounded-full opacity-50"
            >
                Signing...
            </button>
        );
    }

    const displayText = address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : 'Connected';

    return (
        <>
            <button
                onClick={() => setShowWalletModal(true)}
                className="px-6 py-2 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                type="button"
            >
                {displayText}
            </button>

            <WalletModal
                isOpen={showWalletModal}
                onRequestClose={() => setShowWalletModal(false)}
                address={address || ''}
                name={authState.domainName || ''}
            />
        </>
    );
}
