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
            {/* Admin Sidebar */}
            <div className="flex">
                <aside className="w-64 bg-gray-800 min-h-screen p-4 fixed left-0 top-0">
                    <div className="mb-8">
                        <h1 className="text-xl font-bold text-white">SafuAcademy</h1>
                        <p className="text-sm text-gray-400">Admin Dashboard</p>
                    </div>

                    <nav className="space-y-2">
                        <Link
                            href="/admin"
                            className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            href="/admin/courses"
                            className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            📚 Courses
                        </Link>
                        <Link
                            href="/admin/courses/new"
                            className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            ➕ Create Course
                        </Link>
                        <hr className="border-gray-700 my-4" />
                        <Link
                            href="/"
                            className="block px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                            🏠 Back to Site
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="ml-64 flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
