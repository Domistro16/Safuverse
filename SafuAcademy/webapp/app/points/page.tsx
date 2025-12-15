"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Deploy } from "@/lib/constants";

export const PointsHistory: React.FC = () => {
  const { address, isConnected } = useAccount();

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
          <h1 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em] mb-6">
            Safu Points
          </h1>
          <div className="rounded-3xl bg-[#fefce8] border border-[#fcd34d]/30 p-8 text-center">
            <p className="text-[#92400e] font-medium mb-2">Connect your wallet</p>
            <p className="text-[#555] text-sm">
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
        <h1 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em] mb-6">
          Safu Points
        </h1>
        <p className="text-[#555] text-sm sm:text-base mb-6 max-w-xl">
          Earn Safu Points from completing lessons, quizzes, and courses across the SafuVerse.
        </p>

        {/* Points Balance Card */}
        <div className="rounded-3xl bg-gradient-to-br from-[#fef3c7] via-[#fde68a] to-[#fcd34d] border border-[#f59e0b]/20 shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-8 mb-8">
          <div className="text-sm text-[#92400e] uppercase tracking-[0.18em] mb-2">
            Your Balance
          </div>
          {isPending ? (
            <div className="h-12 w-32 bg-white/30 rounded animate-pulse" />
          ) : (
            <div className="text-5xl md:text-6xl font-bold text-[#111] tracking-[-0.04em]">
              {points.toLocaleString()}
              <span className="text-2xl md:text-3xl ml-2 text-[#92400e]">SP</span>
            </div>
          )}
          <p className="text-[13px] text-[#78350f] mt-3">
            Points are stored on-chain and verified through the smart contract.
          </p>
        </div>

        {/* Info Section */}
        <div className="overflow-hidden rounded-2xl bg-white/80 border border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
          <div className="bg-[#fff7df] px-6 py-4 border-b border-black/5">
            <h2 className="font-semibold text-[#111]">How to Earn Points</h2>
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#fefce8] border border-[#fcd34d]/20">
                <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center text-white font-bold">
                  📚
                </div>
                <div>
                  <h3 className="font-semibold text-[#111] text-sm">Complete Lessons</h3>
                  <p className="text-[12px] text-[#555]">Watch videos and complete course content</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#fefce8] border border-[#fcd34d]/20">
                <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center text-white font-bold">
                  ✅
                </div>
                <div>
                  <h3 className="font-semibold text-[#111] text-sm">Pass Quizzes</h3>
                  <p className="text-[12px] text-[#555]">Test your knowledge and earn bonus points</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#fefce8] border border-[#fcd34d]/20">
                <div className="w-10 h-10 rounded-full bg-[#fbbf24] flex items-center justify-center text-white font-bold">
                  🎓
                </div>
                <div>
                  <h3 className="font-semibold text-[#111] text-sm">Earn Certificates</h3>
                  <p className="text-[12px] text-[#555]">Complete full courses for big rewards</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* On-chain verification note */}
        <div className="mt-6 text-center text-[12px] text-[#777]">
          <p>
            Your points balance is verified on-chain at contract address:{" "}
            <a
              href={`https://bscscan.com/address/${Deploy}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#92400e] hover:underline font-mono"
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
