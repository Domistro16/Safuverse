"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Course, Deploy } from "@/lib/constants";

export const Certificates: React.FC = () => {
  const { address, isConnected } = useAccount();

  // Fetch all courses
  const { data: courses, isPending: coursesLoading } = useReadContract({
    abi: abi,
    functionName: "getCourses",
    address: Deploy,
  }) as {
    data: Course[];
    isPending: boolean;
  };

  // We need to check completion for each course individually
  // The contract has a completedCourses(address, uint256) => bool mapping
  // Since we can't batch these efficiently in a single hook call, we'll check enrollment + score
  // A user has "completed" if they have a non-zero score (progress)

  const fallbackCourses = courses ?? [];

  // For now, show all courses the user can potentially earn certificates for
  // The actual completion status would need individual contract calls per course
  // We'll show placeholder for now with the ability to check completion

  if (!isConnected) {
    return (
      <Layout>
        <section className="pt-8 pb-20">
          <h1 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em] mb-6">
            Your Certificates
          </h1>
          <div className="rounded-3xl bg-[#fefce8] border border-[#fcd34d]/30 p-8 text-center">
            <p className="text-[#92400e] font-medium mb-2">Connect your wallet</p>
            <p className="text-[#555] text-sm">
              Connect your wallet to view your earned certificates.
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
          Your Certificates
        </h1>
        <p className="text-[#555] text-sm sm:text-base mb-6 max-w-xl">
          Download and share your on‑chain verified Safu Academy certificates.
        </p>

        {coursesLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-12 h-12 border-2 border-safuDeep/30 border-t-safuDeep rounded-full animate-spin" />
          </div>
        ) : fallbackCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {fallbackCourses.map((course) => (
              <CertificateCard key={String(course.id)} course={course} userAddress={address!} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white/80 border border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-8 text-center">
            <p className="text-[#555]">No courses available yet. Check back soon!</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

// Individual certificate card that checks completion status
function CertificateCard({ course, userAddress }: { course: Course; userAddress: `0x${string}` }) {
  const { data: completionData, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourse",
    address: Deploy,
    args: [BigInt(course.id), userAddress],
  }) as {
    data: [Course, boolean, number, bigint] | undefined;
    isPending: boolean;
  };

  const isEnrolled = completionData?.[1] ?? false;
  const score = completionData?.[2] ?? 0;
  const hasCompleted = score >= 100; // 100% completion

  if (isPending) {
    return (
      <div className="rounded-3xl bg-white/80 border border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    );
  }

  if (!hasCompleted) {
    // Show as locked/incomplete
    return (
      <div className="rounded-3xl bg-gray-50 border border-gray-100 p-5 flex flex-col justify-between opacity-60">
        <div>
          <div className="text-xs text-[#777] mb-2 uppercase tracking-[0.18em]">
            Safu Certificate
          </div>
          <h2 className="font-semibold text-lg text-[#555] mb-1">{course.title}</h2>
          <p className="text-[11px] text-[#999]">
            {isEnrolled ? `Progress: ${score}%` : "Not enrolled"}
          </p>
        </div>
        <button
          disabled
          className="mt-4 w-full px-4 py-2 rounded-full bg-gray-200 text-gray-500 text-xs font-semibold cursor-not-allowed"
        >
          Complete course to unlock
        </button>
      </div>
    );
  }

  // Show earned certificate
  return (
    <div className="rounded-3xl bg-white/80 border border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-5 flex flex-col justify-between">
      <div>
        <div className="text-xs text-[#92400e] mb-2 uppercase tracking-[0.18em]">
          ✓ Safu Certificate
        </div>
        <h2 className="font-semibold text-lg text-[#111] mb-1">{course.title}</h2>
        <p className="text-[11px] text-[#777]">Completed on-chain</p>
      </div>
      <button className="mt-4 w-full px-4 py-2 rounded-full bg-[#111] text-white text-xs font-semibold hover:bg-[#222] transition">
        Download PDF
      </button>
    </div>
  );
}

export default Certificates;
