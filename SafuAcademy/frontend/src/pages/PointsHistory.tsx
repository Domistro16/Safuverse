import React from "react";
import { Layout } from "../components/Layout";

export const PointsHistory: React.FC = () => {
  const rows = [
    { date: "2025-11-01", action: "Completed: Wallet Basics", points: "+120" },
    { date: "2025-11-03", action: "Quiz: On‑Chain Safety", points: "+80" },
    { date: "2025-11-05", action: "Referral: Friend enrolled", points: "+150" }
  ];

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <h1 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em] mb-6">
          Safu Points History
        </h1>
        <p className="text-[#555] text-sm sm:text-base mb-6 max-w-xl">
          Track how you&apos;ve earned Safu Points from lessons, quizzes and referrals across
          the SafuVerse.
        </p>

        <div className="overflow-hidden rounded-2xl bg-white/80 border border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.12)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#fff7df] text-[#555]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date} className="border-t border-black/5">
                  <td className="px-4 py-3 text-[#555] text-xs sm:text-sm">{row.date}</td>
                  <td className="px-4 py-3 text-[#111] text-xs sm:text-sm">{row.action}</td>
                  <td className="px-4 py-3 text-right text-[#1a7f37] font-semibold text-xs sm:text-sm">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
};

export default PointsHistory;
