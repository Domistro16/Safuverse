"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Deploy } from "@/lib/constants";
import { useTheme } from "@/app/providers";

const PointsHistory: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Fetch user's total points from smart contract
  const { data: userPoints, isPending } = useReadContract({
    abi: abi,
    functionName: "getUserPoints",
    address: Deploy,
    args: address ? [address] : undefined,
  }) as {
    data: bigint | undefined;
    isPending: boolean;
  };

  const points = userPoints ? Number(userPoints) : 0;

  if (!isConnected) {
    return (
      <Layout>
        <section className="pt-8 pb-20">
          <h1 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] mb-6 ${isDark ? "text-white" : "text-[#111]"}`}>
            Safu Points
          </h1>
          <div className={`rounded-3xl p-8 text-center ${isDark ? "bg-[#1a1a24] border border-[#2a2a3a]" : "bg-[#fefce8] border border-[#fcd34d]/30"}`}>
            <p className={`font-medium mb-2 ${isDark ? "text-[#ffb000]" : "text-[#92400e]"}`}>Connect your wallet</p>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-[#555]"}`}>
              Connect your wallet to view your Safu Points balance.
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <h1 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] mb-6 ${isDark ? "text-white" : "text-[#111]"}`}>
          Safu Points
        </h1>
        <p className={`text-sm sm:text-base mb-6 max-w-xl ${isDark ? "text-gray-400" : "text-[#555]"}`}>
          Earn Safu Points from completing lessons, quizzes, and courses across the SafuVerse.
        </p>

        {/* Points Balance Card */}
        <div className={`rounded-3xl shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-8 mb-8 ${isDark ? "bg-gradient-to-br from-[#1a1a2e] via-[#252540] to-[#1a1a3e] border border-[#ffb000]/30" : "bg-gradient-to-br from-[#fef3c7] via-[#fde68a] to-[#fcd34d] border border-[#f59e0b]/20"}`}>
          <div className={`text-sm uppercase tracking-[0.18em] mb-2 ${isDark ? "text-[#ffb000]" : "text-[#92400e]"}`}>
            Your Balance
          </div>
          {isPending ? (
            <div className={`h-12 w-32 rounded animate-pulse ${isDark ? "bg-white/10" : "bg-white/30"}`} />
          ) : (
            <div className={`text-5xl md:text-6xl font-bold tracking-[-0.04em] ${isDark ? "text-white" : "text-[#111]"}`}>
              {points.toLocaleString()}
              <span className={`text-2xl md:text-3xl ml-2 ${isDark ? "text-[#ffb000]" : "text-[#92400e]"}`}>SP</span>
            </div>
          )}
          <p className={`text-[13px] mt-3 ${isDark ? "text-gray-400" : "text-[#78350f]"}`}>
            Points are stored on-chain and verified through the smart contract.
          </p>
        </div>

        {/* Info Section */}
        <div className={`overflow-hidden rounded-2xl shadow-[0_18px_55px_rgba(15,23,42,0.12)] ${isDark ? "bg-[#12121a] border border-[#2a2a3a]" : "bg-white/80 border border-black/5"}`}>
          <div className={`px-6 py-4 border-b ${isDark ? "bg-[#1a1a24] border-[#2a2a3a]" : "bg-[#fff7df] border-black/5"}`}>
            <h2 className={`font-semibold ${isDark ? "text-white" : "text-[#111]"}`}>How to Earn Points</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? "bg-[#1a1a24] border border-[#2a2a3a]" : "bg-[#fefce8] border border-[#fcd34d]/20"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? "bg-[#ffb000]" : "bg-[#fbbf24]"}`}>
                  📚
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-[#111]"}`}>Complete Lessons</h3>
                  <p className={`text-[12px] ${isDark ? "text-gray-400" : "text-[#555]"}`}>Watch videos and complete course content</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? "bg-[#1a1a24] border border-[#2a2a3a]" : "bg-[#fefce8] border border-[#fcd34d]/20"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? "bg-[#ffb000]" : "bg-[#fbbf24]"}`}>
                  ✅
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-[#111]"}`}>Pass Quizzes</h3>
                  <p className={`text-[12px] ${isDark ? "text-gray-400" : "text-[#555]"}`}>Test your knowledge and earn bonus points</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 p-4 rounded-2xl ${isDark ? "bg-[#1a1a24] border border-[#2a2a3a]" : "bg-[#fefce8] border border-[#fcd34d]/20"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isDark ? "bg-[#ffb000]" : "bg-[#fbbf24]"}`}>
                  🎓
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isDark ? "text-white" : "text-[#111]"}`}>Earn Certificates</h3>
                  <p className={`text-[12px] ${isDark ? "text-gray-400" : "text-[#555]"}`}>Complete full courses for big rewards</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* On-chain verification note */}
        <div className={`mt-6 text-center text-[12px] ${isDark ? "text-gray-500" : "text-[#777]"}`}>
          <p>
            Your points balance is verified on-chain at contract address:{" "}
            <a
              href={`https://bscscan.com/address/${Deploy}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`hover:underline font-mono ${isDark ? "text-[#ffb000]" : "text-[#92400e]"}`}
            >
              {Deploy.slice(0, 10)}...{Deploy.slice(-8)}
            </a>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default PointsHistory;
