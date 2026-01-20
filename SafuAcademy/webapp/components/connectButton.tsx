'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount, useSignMessage } from 'wagmi';
import { WalletModal } from './WalletModal';

interface AuthState {
    isAuthenticated: boolean;
    token: string | null;
    user: {
        walletAddress: string;
        totalPoints: number;
        isAdmin: boolean;
    } | null;
    hasDomain: boolean;
    domainName: string | null;
}

export function CustomConnect() {
    const { login, logout, ready, authenticated } = usePrivy();
    const { address, isConnected } = useAccount();
    const { signMessageAsync } = useSignMessage();
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        token: null,
        user: null,
        hasDomain: false,
        domainName: null,
    });
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showDomainModal, setShowDomainModal] = useState(false);
    const hasAttemptedAuth = useRef(false);

    // Clear auth when wallet disconnects
    useEffect(() => {
        if (!isConnected || !authenticated) {
            clearAuth();
            hasAttemptedAuth.current = false;
        }
    }, [isConnected, authenticated]);

    const clearAuth = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('safu_domain');
        setAuthState({
            isAuthenticated: false,
            token: null,
            user: null,
            hasDomain: false,
            domainName: null,
        });
    };

    const authenticate = useCallback(async () => {
        if (!address || isAuthenticating) return;

        setIsAuthenticating(true);

        try {
            // Step 1: Request nonce
            const nonceRes = await fetch('/api/auth/nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address }),
            });

            if (!nonceRes.ok) {
                throw new Error('Failed to get nonce');
            }

            const { message } = await nonceRes.json();

            // Step 2: Sign the message
            const signature = await signMessageAsync({ message });

            // Step 3: Verify signature and get JWT
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

            // Store auth data
            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(user));

            // Step 4: Check for .safu domain
            const domainRes = await fetch('/api/user/domain-status', {
                headers: { Authorization: `Bearer ${token}` },
            });

            let hasDomain = false;
            let domainName = null;

            if (domainRes.ok) {
                const domainData = await domainRes.json();
                hasDomain = domainData.hasDomain;
                domainName = domainData.domainName;

                if (domainName) {
                    localStorage.setItem('safu_domain', domainName);
                }
            }

            setAuthState({
                isAuthenticated: true,
                token,
                user,
                hasDomain,
                domainName,
            });

            // Show domain modal if no .safu domain
            if (!hasDomain) {
                setShowDomainModal(true);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            // Don't clear auth on error - user may have rejected signature
        } finally {
            setIsAuthenticating(false);
        }
    }, [address, isAuthenticating, signMessageAsync]);

    // Auto-authenticate when wallet connects
    useEffect(() => {
        if (isConnected && authenticated && address && !authState.isAuthenticated && !isAuthenticating && !hasAttemptedAuth.current) {
            // Check for existing token first
            const token = localStorage.getItem('auth_token');
            const user = localStorage.getItem('auth_user');
            const domainName = localStorage.getItem('safu_domain');

            if (token && user) {
                try {
                    const parsedUser = JSON.parse(user);
                    if (parsedUser.walletAddress?.toLowerCase() === address?.toLowerCase()) {
                        setAuthState({
                            isAuthenticated: true,
                            token,
                            user: parsedUser,
                            hasDomain: !!domainName,
                            domainName,
                        });
                        return;
                    }
                } catch {
                    // Invalid stored data - continue to authenticate
                }
            }

            // No valid token - trigger authentication
            hasAttemptedAuth.current = true;
            authenticate();
        }
    }, [isConnected, authenticated, address, authState.isAuthenticated, isAuthenticating, authenticate]);

    // Not ready - show loading state
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

    // Not connected - show Login button
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

    // Authenticating - show loading state
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

    // Connected and authenticated - show name/address
    const displayText = authState.domainName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected');
    const [showWalletModal, setShowWalletModal] = useState(false);

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

            {/* Domain Required Modal */}
            {showDomainModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl">
                        <div className="text-5xl mb-4">🔒</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">
                            .safu Domain Required
                        </h2>
                        <p className="text-gray-600 mb-6">
                            To access SafuAcademy courses and earn points, you need a .safu domain name.
                        </p>
                        <div className="flex flex-col gap-3">
                            <a
                                href="https://names.safuverse.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                            >
                                Get Your .safu Domain →
                            </a>
                            <button
                                onClick={() => setShowDomainModal(false)}
                                className="px-6 py-3 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Continue without domain
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
