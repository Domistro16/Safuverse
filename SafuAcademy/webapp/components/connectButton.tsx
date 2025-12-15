'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from 'wagmi';

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
        if (!isConnected) {
            clearAuth();
            hasAttemptedAuth.current = false;
        }
    }, [isConnected]);

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
        if (isConnected && address && !authState.isAuthenticated && !isAuthenticating && !hasAttemptedAuth.current) {
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
    }, [isConnected, address, authState.isAuthenticated, isAuthenticating, authenticate]);

    return (
        <>
            <ConnectButton.Custom>
                {({
                    account,
                    chain,
                    openAccountModal,
                    openChainModal,
                    openConnectModal,
                    mounted,
                }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;

                    return (
                        <div
                            {...(!ready && {
                                'aria-hidden': true,
                                style: {
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                },
                            })}
                        >
                            {(() => {
                                // Not connected - show Login button
                                if (!connected) {
                                    return (
                                        <button
                                            onClick={openConnectModal}
                                            className="px-6 py-2 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                                        >
                                            Login
                                        </button>
                                    );
                                }

                                // Wrong network
                                if (chain.unsupported) {
                                    return (
                                        <button
                                            onClick={openChainModal}
                                            className="px-6 py-2 bg-red-500 text-white font-semibold rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            Wrong Network
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
                                const displayText = authState.domainName || account.displayName;

                                return (
                                    <button
                                        onClick={openAccountModal}
                                        className="px-6 py-2 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
                                    >
                                        {displayText}
                                    </button>
                                );
                            })()}
                        </div>
                    );
                }}
            </ConnectButton.Custom>

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
