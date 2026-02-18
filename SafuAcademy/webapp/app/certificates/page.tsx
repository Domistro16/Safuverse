"use client";

import React from "react";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Deploy, OnChainCourse } from "@/lib/constants";
import { useTheme } from "@/app/providers";

const Certificates: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Fetch all courses
  const { data: courses, isPending: coursesLoading } = useReadContract({
    abi: abi,
    functionName: "getAllCourses",
    address: Deploy,
  }) as {
    data: OnChainCourse[];
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
          <h1 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] mb-6 ${isDark ? 'text-white' : 'text-[#111]'}`}>
            Your Certificates
          </h1>
          <div className={`rounded-3xl p-8 text-center border ${isDark
            ? 'bg-[#1a1a24] border-[#2a2a3a]'
            : 'bg-[#fefce8] border-[#fcd34d]/30'
            }`}>
            <p className={`font-medium mb-2 ${isDark ? 'text-[#ffb000]' : 'text-[#92400e]'}`}>Connect your wallet</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
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
        <h1 className={`text-3xl md:text-4xl font-bold tracking-[-0.04em] mb-6 ${isDark ? 'text-white' : 'text-[#111]'}`}>
          Your Certificates
        </h1>
        <p className={`text-sm sm:text-base mb-6 max-w-xl ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
          Download and share your on-chain verified Nex Academy certificates.
        </p>

        {coursesLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className={`w-12 h-12 border-2 rounded-full animate-spin ${isDark
              ? 'border-[#ffb000]/30 border-t-[#ffb000]'
              : 'border-safuDeep/30 border-t-safuDeep'
              }`} />
          </div>
        ) : fallbackCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {fallbackCourses.map((course) => (
              <CertificateCard key={String(course.id)} course={course} userAddress={address!} isDark={isDark} />
            ))}
          </div>
        ) : (
          <div className={`rounded-3xl border shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-8 text-center ${isDark
            ? 'bg-[#12121a] border-[#2a2a3a]'
            : 'bg-white/80 border-black/5'
            }`}>
            <p className={isDark ? 'text-gray-400' : 'text-[#555]'}>No courses available yet. Check back soon!</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

// Individual certificate card that checks completion status
function CertificateCard({ course, userAddress, isDark }: { course: OnChainCourse; userAddress: `0x${string}`; isDark: boolean }) {
  // Use getCourseWithUserStatus which returns [course, enrolled, completed, canEnroll]
  const { data: completionData, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourseWithUserStatus",
    address: Deploy,
    args: [course.id, userAddress],
  }) as {
    data: [OnChainCourse, boolean, boolean, boolean] | undefined;
    isPending: boolean;
  };

  const isEnrolled = completionData?.[1] ?? false;
  const hasCompleted = completionData?.[2] ?? false;

  if (isPending) {
    return (
      <div className={`rounded-3xl border shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-5 animate-pulse ${isDark
        ? 'bg-[#12121a] border-[#2a2a3a]'
        : 'bg-white/80 border-black/5'
        }`}>
        <div className={`h-4 rounded w-1/2 mb-3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className={`h-6 rounded w-3/4 mb-2 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
        <div className={`h-3 rounded w-1/3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
      </div>
    );
  }

  if (!hasCompleted) {
    // Show as locked/incomplete
    return (
      <div className={`rounded-3xl border p-5 flex flex-col justify-between opacity-60 ${isDark
        ? 'bg-[#12121a] border-[#2a2a3a]'
        : 'bg-gray-50 border-gray-100'
        }`}>
        <div>
          <div className={`text-xs mb-2 uppercase tracking-[0.18em] ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
            Safu Certificate
          </div>
          <h2 className={`font-semibold text-lg mb-1 ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>{course.title}</h2>
          <p className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-[#999]'}`}>
            {isEnrolled ? "In progress" : "Not enrolled"}
          </p>
        </div>
        <button
          disabled
          className={`mt-4 w-full px-4 py-2 rounded-full text-xs font-semibold cursor-not-allowed ${isDark
            ? 'bg-white/5 text-gray-500'
            : 'bg-gray-200 text-gray-500'
            }`}
        >
          Complete course to unlock
        </button>
      </div>
    );
  }

  // Show earned certificate
  return (
    <div className={`rounded-3xl border shadow-[0_18px_55px_rgba(15,23,42,0.12)] p-5 flex flex-col justify-between ${isDark
      ? 'bg-[#12121a] border-[#2a2a3a]'
      : 'bg-white/80 border-black/5'
      }`}>
      <div>
        <div className={`text-xs mb-2 uppercase tracking-[0.18em] ${isDark ? 'text-[#ffb000]' : 'text-[#92400e]'}`}>
          Completed Nex Certificate
        </div>
        <h2 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-[#111]'}`}>{course.title}</h2>
        <p className={`text-[11px] ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>Completed on-chain</p>
      </div>
      <button className={`mt-4 w-full px-4 py-2 rounded-full text-xs font-semibold transition ${isDark
        ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]'
        : 'bg-[#111] text-white hover:bg-[#222]'
        }`}>
        Download PDF
      </button>
    </div>
  );
}

export default Certificates;

