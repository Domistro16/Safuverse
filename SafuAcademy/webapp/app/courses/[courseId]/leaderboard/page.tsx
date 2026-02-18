"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  finalScore: number;
  baseScore: number | null;
  quizScore: number | null;
  engagementTimeScore: number | null;
  completedAt: string | null;
}

export default function CourseLeaderboardPage() {
  const params = useParams();
  const courseId = params.courseId as string;

  const [title, setTitle] = useState<string>("Course Leaderboard");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch(`/api/courses/${courseId}/leaderboard`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "Failed to load leaderboard.");
          return;
        }

        setTitle(data.course?.title || "Course Leaderboard");
        setEntries(data.entries || []);
      } catch {
        setError("Failed to load leaderboard.");
      }
    }

    if (courseId) {
      void loadLeaderboard();
    }
  }, [courseId]);

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{title} · Leaderboard</h1>
          <Link href={`/courses/${courseId}`} className="text-blue-400 hover:underline text-sm">
            Back to course
          </Link>
        </div>

        {error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : (
          <div className="rounded-2xl border border-[#2a2a3a] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#151522] text-gray-300">
                <tr>
                  <th className="text-left px-4 py-3">Rank</th>
                  <th className="text-left px-4 py-3">Wallet</th>
                  <th className="text-left px-4 py-3">Final Score</th>
                  <th className="text-left px-4 py-3">Quiz</th>
                  <th className="text-left px-4 py-3">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={`${entry.walletAddress}-${entry.rank}`} className="border-t border-[#2a2a3a] text-gray-200">
                    <td className="px-4 py-3">#{entry.rank}</td>
                    <td className="px-4 py-3">
                      {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-300">{entry.finalScore}</td>
                    <td className="px-4 py-3">{entry.quizScore ?? "-"}</td>
                    <td className="px-4 py-3">{entry.engagementTimeScore ?? "-"}</td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-gray-400" colSpan={5}>
                      No eligible leaderboard entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

