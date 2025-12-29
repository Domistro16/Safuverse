'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        async function checkAdmin() {
            if (!isConnected || !address) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                const res = await fetch('/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setIsAdmin(res.ok);
            } catch {
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        }

        checkAdmin();
    }, [address, isConnected]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Connect Wallet</h1>
                    <p className="text-gray-400">Please connect your wallet to access the admin dashboard.</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
                    <p className="text-gray-400">You don't have admin permissions.</p>
                    <Link href="/" className="text-blue-400 hover:underline mt-4 inline-block">
                        Go back home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-white">SafuAcademy</h1>
                    <p className="text-xs text-gray-400">Admin</p>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                    {sidebarOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Admin Sidebar */}
            <aside className={`
                fixed left-0 top-0 z-50 w-64 bg-gray-800 min-h-screen p-4 transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="mb-8 hidden lg:block">
                    <h1 className="text-xl font-bold text-white">SafuAcademy</h1>
                    <p className="text-sm text-gray-400">Admin Dashboard</p>
                </div>
                <div className="mb-8 lg:hidden mt-14">
                    <p className="text-sm text-gray-400">Dashboard</p>
                </div>

                <nav className="space-y-2">
                    <Link
                        href="/admin"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        📊 Dashboard
                    </Link>
                    <Link
                        href="/admin/courses"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        📚 Courses
                    </Link>
                    <Link
                        href="/admin/courses/new"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        ➕ Create Course
                    </Link>
                    <hr className="border-gray-700 my-4" />
                    <Link
                        href="/"
                        onClick={() => setSidebarOpen(false)}
                        className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                        🏠 Back to Site
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 flex-1 p-4 pt-20 lg:pt-8 lg:p-8">
                {children}
            </main>
        </div>
    );
}
