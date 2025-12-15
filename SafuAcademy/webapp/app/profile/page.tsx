"use client";

import Link from "next/link";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Course, Deploy } from "@/lib/constants";
import { useENSName } from "@/hooks/getPrimaryName";

export default function Profile() {
    const { address, isConnected } = useAccount();

    // Fetch user's ENS/Safu name
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
        functionName: "getCourses",
        address: Deploy,
    }) as {
        data: Course[];
        isPending: boolean;
    };

    const points = userPoints ? Number(userPoints) : 0;
    const displayName = ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest");
    const isLoading = pointsLoading || coursesLoading || nameLoading;

    if (!isConnected) {
        return (
            <Layout>
                <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-0 py-16">
                    <div className="rounded-[30px] bg-[#fefce8] border border-[#fcd34d]/30 p-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-[#fef3c7] flex items-center justify-center text-2xl mx-auto mb-4">
                            👤
                        </div>
                        <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#111] mb-2">Connect Wallet</h1>
                        <p className="text-sm text-[#555]">
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
                        <div className="w-16 h-16 rounded-full bg-[#fef3c7] flex items-center justify-center text-2xl">
                            👤
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-[-0.04em] text-[#111]">
                                {isLoading ? (
                                    <span className="inline-block w-32 h-6 bg-gray-200 rounded animate-pulse" />
                                ) : (
                                    <>{displayName}</>
                                )}
                            </h1>
                            <p className="text-xs text-[#777]">Learning and building inside the SafuVerse.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs">
                        <button className="px-4 py-2 rounded-full bg-white border border-black/10 hover:bg-[#fff7dd] transition">
                            Edit profile
                        </button>
                        <Link
                            href="/points"
                            className="px-4 py-2 rounded-full bg-[#111] text-white hover:bg-[#222] transition"
                        >
                            Points history
                        </Link>
                    </div>
                </header>

                <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)] items-start">
                    <div className="space-y-6">
                        <div className="rounded-[24px] bg-white border border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5">
                            <h2 className="text-sm font-semibold text-[#111] mb-2">Profile overview</h2>
                            <p className="text-xs text-[#555]">
                                Your completed courses, certificates, and Safu points synced from on-chain data.
                            </p>
                            <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                                <div>
                                    {isLoading ? (
                                        <div className="h-6 w-8 mx-auto bg-gray-200 rounded animate-pulse" />
                                    ) : (
                                        <div className="text-lg font-semibold">{courses?.length || 0}</div>
                                    )}
                                    <div className="text-[#777]">Available</div>
                                </div>
                                <div>
                                    <div className="text-lg font-semibold">—</div>
                                    <div className="text-[#777]">Certificates</div>
                                </div>
                                <div>
                                    {isLoading ? (
                                        <div className="h-6 w-12 mx-auto bg-gray-200 rounded animate-pulse" />
                                    ) : (
                                        <div className="text-lg font-semibold">{points.toLocaleString()}</div>
                                    )}
                                    <div className="text-[#777]">Points</div>
                                </div>
                            </div>
                        </div>

                        {/* Wallet Info */}
                        <div className="rounded-[24px] bg-white border border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5">
                            <h2 className="text-sm font-semibold text-[#111] mb-2">Connected Wallet</h2>
                            <p className="text-xs text-[#555] font-mono break-all">
                                {address}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-[24px] bg-white border border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5">
                            <h2 className="text-sm font-semibold text-[#111] mb-3">Quick Actions</h2>
                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/courses"
                                    className="px-4 py-2 text-xs rounded-full bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a] transition"
                                >
                                    Browse courses
                                </Link>
                                <Link
                                    href="/certificates"
                                    className="px-4 py-2 text-xs rounded-full bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a] transition"
                                >
                                    View certificates
                                </Link>
                                <Link
                                    href="/chat"
                                    className="px-4 py-2 text-xs rounded-full bg-[#fef3c7] text-[#92400e] hover:bg-[#fde68a] transition"
                                >
                                    Ask Safu Tutor
                                </Link>
                            </div>
                        </div>

                        <div className="rounded-[24px] bg-white border border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5">
                            <h2 className="text-sm font-semibold text-[#111] mb-3">Recent notes preview</h2>
                            <p className="text-xs text-[#555]">
                                Your latest lesson notes will appear here so you can quickly revisit key ideas.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </Layout>
    );
}
