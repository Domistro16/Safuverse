"use client";

import Link from "next/link";
import { Layout } from "@/components/Layout";
import { useReadContract, useReadContracts, useAccount } from "wagmi";
import { abi, Deploy, OnChainCourse } from "@/lib/constants";
import { useENSName } from "@/hooks/getPrimaryName";
import { useTheme } from "@/app/providers";

export default function Profile() {
    const { address, isConnected } = useAccount();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Fetch user's ENS/Nex name
    const { name: ensName, loading: nameLoading } = useENSName({ owner: address as `0x${string}` });

    // Fetch user's points
    const { data: userPoints, isPending: pointsLoading } = useReadContract({
        abi: abi,
        functionName: "getUserPoints",
        address: Deploy,
        args: address ? [address] : undefined,
    }) as {
        data: bigint | undefined;
        isPending: boolean;
    };

    // Fetch all courses to count completed ones
    const { data: courses, isPending: coursesLoading } = useReadContract({
        abi: abi,
        functionName: "getAllCourses",
        address: Deploy,
    }) as {
        data: OnChainCourse[];
        isPending: boolean;
    };

    const points = userPoints ? Number(userPoints) : 0;
    const displayName = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest");

    // Batch-check completion status using getCourseWithUserStatus (same as certificates page)
    const { data: completionResults, isPending: completionLoading } = useReadContracts({
        contracts: (courses ?? []).map((course) => ({
            abi: abi,
            address: Deploy,
            functionName: 'getCourseWithUserStatus' as const,
            args: [course.id, address as `0x${string}`] as [bigint, `0x${string}`],
        })),
        query: { enabled: !!address && !!courses && courses.length > 0 },
    });
    // getCourseWithUserStatus returns [course, enrolled, completed, canEnroll] — index 2 is completed
    const completedCount = (completionResults ?? []).filter(
        (r) => r.status === 'success' && (r.result as [unknown, boolean, boolean, boolean])?.[2] === true
    ).length;

    const isLoading = pointsLoading || coursesLoading || nameLoading || completionLoading;

    if (!isConnected) {
        return (
            <Layout>
                <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 py-16">
                    <div className={`rounded-[30px] p-8 text-center border ${isDark
                        ? 'bg-[#1a1a24] border-[#2a2a3a]'
                        : 'bg-[#fefce8] border-[#fcd34d]/30'
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 ${isDark
                            ? 'bg-[#ffb000]/20'
                            : 'bg-[#fef3c7]'
                            }`}>
                            👤
                        </div>
                        <h1 className={`text-2xl font-bold tracking-[-0.04em] mb-2 ${isDark ? 'text-white' : 'text-[#111]'}`}>Connect Wallet</h1>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                            Connect your wallet to view your profile, courses, and points.
                        </p>
                    </div>
                </main>
            </Layout>
        );
    }

    return (
        <Layout>
            <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 py-16">
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${isDark
                            ? 'bg-[#ffb000]/20'
                            : 'bg-[#fef3c7]'
                            }`}>
                            👤
                        </div>
                        <div>
                            <h1 className={`text-2xl font-bold tracking-[-0.04em] ${isDark ? 'text-white' : 'text-[#111]'}`}>
                                {isLoading ? (
                                    <span className={`inline-block w-32 h-6 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                ) : (
                                    <>{displayName}</>
                                )}
                            </h1>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>Learning and building Skill-based Education.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                        <button className={`px-4 py-2 rounded-full border transition ${isDark
                            ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            : 'bg-white border-black/10 hover:bg-[#fff7dd]'
                            }`}>
                            Edit profile
                        </button>
                        <Link
                            href="/points"
                            className={`px-4 py-2 rounded-full transition ${isDark
                                ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]'
                                : 'bg-[#111] text-white hover:bg-[#222]'
                                }`}
                        >
                            Points history
                        </Link>
                    </div>
                </header>

                <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)] items-start">
                    <div className="space-y-6">
                        <div className={`rounded-[24px] border shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5 ${isDark
                            ? 'bg-[#12121a] border-[#2a2a3a]'
                            : 'bg-white border-black/5'
                            }`}>
                            <h2 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#111]'}`}>Profile overview</h2>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                                Your completed courses, certificates, and Nex points synced from on-chain data.
                            </p>
                            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                                <div>
                                    {isLoading ? (
                                        <div className={`h-6 w-8 mx-auto rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                    ) : (
                                        <div className={`text-lg font-semibold ${isDark ? 'text-white' : ''}`}>{courses?.length || 0}</div>
                                    )}
                                    <div className={isDark ? 'text-gray-500' : 'text-[#777]'}>Available</div>
                                </div>
                                <div>
                                    {isLoading ? (
                                        <div className={`h-6 w-8 mx-auto rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                    ) : (
                                        <div className={`text-lg font-semibold ${isDark ? 'text-white' : ''}`}>{completedCount}</div>
                                    )}
                                    <div className={isDark ? 'text-gray-500' : 'text-[#777]'}>Certificates</div>
                                </div>
                                <div>
                                    {isLoading ? (
                                        <div className={`h-6 w-12 mx-auto rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                                    ) : (
                                        <div className={`text-lg font-semibold ${isDark ? 'text-white' : ''}`}>{points.toLocaleString()}</div>
                                    )}
                                    <div className={isDark ? 'text-gray-500' : 'text-[#777]'}>Points</div>
                                </div>
                            </div>
                        </div>

                        {/* Wallet Info */}
                        <div className={`rounded-[24px] border shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5 ${isDark
                            ? 'bg-[#12121a] border-[#2a2a3a]'
                            : 'bg-white border-black/5'
                            }`}>
                            <h2 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-[#111]'}`}>Connected Wallet</h2>
                            <p className={`text-xs font-mono break-all ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                                {address}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className={`rounded-[24px] border shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5 ${isDark
                            ? 'bg-[#12121a] border-[#2a2a3a]'
                            : 'bg-white border-black/5'
                            }`}>
                            <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-[#111]'}`}>Quick Actions</h2>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/courses"
                                    className={`px-4 py-2 text-xs rounded-full transition ${isDark
                                        ? 'bg-[#ffb000]/10 text-[#ffb000] border border-[#ffb000]/30 hover:bg-[#ffb000]/20'
                                        : 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]'
                                        }`}
                                >
                                    Browse courses
                                </Link>
                                <Link
                                    href="/certificates"
                                    className={`px-4 py-2 text-xs rounded-full transition ${isDark
                                        ? 'bg-[#ffb000]/10 text-[#ffb000] border border-[#ffb000]/30 hover:bg-[#ffb000]/20'
                                        : 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]'
                                        }`}
                                >
                                    View certificates
                                </Link>
                                <Link
                                    href="/chat"
                                    className={`px-4 py-2 text-xs rounded-full transition ${isDark
                                        ? 'bg-[#ffb000]/10 text-[#ffb000] border border-[#ffb000]/30 hover:bg-[#ffb000]/20'
                                        : 'bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a]'
                                        }`}
                                >
                                    Ask Nex Tutor
                                </Link>
                            </div>
                        </div>

                        <div className={`rounded-[24px] border shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5 ${isDark
                            ? 'bg-[#12121a] border-[#2a2a3a]'
                            : 'bg-white border-black/5'
                            }`}>
                            <h2 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-[#111]'}`}>Recent notes preview</h2>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                                Your latest lesson notes will appear here so you can quickly revisit key ideas.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}
